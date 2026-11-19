// Visual regression: screenshot a reference (design mockup, served statically) and the
// implementation (running PHP dev server), diff with pixelmatch, write out/*.png, print a
// PASS/FAIL table.
//
//   node compare.mjs components   # cards vs /dev/components.php — cropped to content bbox
//   node compare.mjs hud          # match-hud.html vs /game?mock=1 — per HUD region
//
// Measures CONTENT only (not the background):
//  - components: inject a solid sentinel background, find the content bounding box in each
//    screenshot, union + 8px pad, crop both to it, diff over the crop. Content bboxes that
//    differ by >2px in w or h FAIL as a layout bug (no size-normalising).
//  - hud: hide the globe, mask the live countdown, diff each of the 10 HUD regions separately.
// Pass: <= 0.3% of pixels differ in the measured area AND no connected diff blob > 24x24 px.
//
// Env: PHP_BASE (default http://127.0.0.1:8000).
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
import pixelmatch from 'pixelmatch';
import { PNG } from 'pngjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DESIGN_ROOT = path.resolve(__dirname, '../../design_handoff_match_hud/design');
const OUT = path.join(__dirname, 'out');
const PHP = process.env.PHP_BASE || 'http://127.0.0.1:8000';
const MAX_PCT = 0.3;          // fail if more than this % of measured pixels differ
const MAX_BLOB = 24;          // fail if any connected diff blob exceeds this in w or h
const PX_THRESHOLD = 0.1;     // pixelmatch per-pixel colour threshold
const BBOX_TOL = 2;           // content-bbox size tolerance (px) before "size mismatch"
const PAD = 8;                // padding around the content bbox
const SENTINEL = [255, 0, 255]; // magenta background for content detection

const MIME = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript',
  '.mjs': 'text/javascript', '.json': 'application/json', '.geojson': 'application/json',
  '.woff2': 'font/woff2', '.woff': 'font/woff', '.svg': 'image/svg+xml', '.png': 'image/png',
  '.jsx': 'text/babel', '.map': 'application/json',
};

function startStatic(root) {
  const server = http.createServer((req, res) => {
    let p = decodeURIComponent(req.url.split('?')[0]);
    if (p.endsWith('/')) p += 'index.html';
    const fp = path.join(root, path.normalize(p));
    if (!fp.startsWith(root) || !fs.existsSync(fp) || fs.statSync(fp).isDirectory()) { res.writeHead(404); res.end('404'); return; }
    res.writeHead(200, { 'Content-Type': MIME[path.extname(fp)] || 'application/octet-stream' });
    fs.createReadStream(fp).pipe(res);
  });
  return new Promise((r) => server.listen(0, '127.0.0.1', () => r({ server, port: server.address().port })));
}

async function shot(page, url, { viewport, fullPage = false, hideGlobe = false, solidBg = false }) {
  await page.setViewportSize(viewport);
  await page.goto(url, { waitUntil: 'networkidle', timeout: 45000 });
  await page.evaluate(() => document.fonts && document.fonts.ready).catch(() => {});
  if (hideGlobe) await page.waitForSelector('canvas', { timeout: 6000 }).catch(() => {});
  await page.waitForTimeout(1500);
  if (solidBg) { await page.addStyleTag({ content: `html,body{background:rgb(255,0,255)!important}` }); await page.waitForTimeout(120); }
  if (hideGlobe) { await page.evaluate(() => document.querySelectorAll('canvas').forEach((c) => { c.style.visibility = 'hidden'; })); await page.waitForTimeout(150); }
  return PNG.sync.read(await page.screenshot({ fullPage, animations: 'disabled' }));
}

const isContent = (d, i) =>
  Math.abs(d[i] - SENTINEL[0]) > 24 || Math.abs(d[i + 1] - SENTINEL[1]) > 24 || Math.abs(d[i + 2] - SENTINEL[2]) > 24;

function contentBBox(png) {
  let minX = png.width, minY = png.height, maxX = -1, maxY = -1;
  for (let y = 0; y < png.height; y++) for (let x = 0; x < png.width; x++) {
    if (isContent(png.data, (png.width * y + x) * 4)) {
      if (x < minX) minX = x; if (x > maxX) maxX = x; if (y < minY) minY = y; if (y > maxY) maxY = y;
    }
  }
  if (maxX < 0) return null;
  return { x: minX, y: minY, w: maxX - minX + 1, h: maxY - minY + 1 };
}

// Crop a png to a rect; pixels outside the png are the sentinel (so bg never counts as diff).
function crop(png, box) {
  const out = new PNG({ width: box.w, height: box.h });
  for (let y = 0; y < box.h; y++) for (let x = 0; x < box.w; x++) {
    const sx = box.x + x, sy = box.y + y, d = (box.w * y + x) * 4;
    if (sx >= 0 && sy >= 0 && sx < png.width && sy < png.height) {
      const s = (png.width * sy + sx) * 4;
      out.data[d] = png.data[s]; out.data[d + 1] = png.data[s + 1]; out.data[d + 2] = png.data[s + 2]; out.data[d + 3] = png.data[s + 3];
    } else { out.data[d] = SENTINEL[0]; out.data[d + 1] = SENTINEL[1]; out.data[d + 2] = SENTINEL[2]; out.data[d + 3] = 255; }
  }
  return out;
}

// Largest connected blob (8-connectivity) in a pixelmatch diff mask. Returns {w,h} of its bbox.
function largestBlob(diff, W, H) {
  const seen = new Uint8Array(W * H);
  const on = (x, y) => diff.data[(W * y + x) * 4 + 3] > 0; // diffMask: diff pixels have alpha>0
  let best = { w: 0, h: 0 };
  const stack = [];
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const idx = W * y + x;
    if (seen[idx] || !on(x, y)) continue;
    let minX = x, maxX = x, minY = y, maxY = y;
    stack.push(idx); seen[idx] = 1;
    while (stack.length) {
      const c = stack.pop(), cx = c % W, cy = (c - cx) / W;
      if (cx < minX) minX = cx; if (cx > maxX) maxX = cx; if (cy < minY) minY = cy; if (cy > maxY) maxY = cy;
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
        const nx = cx + dx, ny = cy + dy;
        if (nx < 0 || ny < 0 || nx >= W || ny >= H) continue;
        const ni = W * ny + nx;
        if (!seen[ni] && on(nx, ny)) { seen[ni] = 1; stack.push(ni); }
      }
    }
    const bw = maxX - minX + 1, bh = maxY - minY + 1;
    if (bw * bh > best.w * best.h) best = { w: bw, h: bh };
  }
  return best;
}

function diffCrop(a, b, name) {
  const W = a.width, H = a.height;
  const diff = new PNG({ width: W, height: H });
  const n = pixelmatch(a.data, b.data, diff.data, W, H, { threshold: PX_THRESHOLD, diffMask: true });
  const pct = (n / (W * H)) * 100;
  const blob = largestBlob(diff, W, H);
  fs.writeFileSync(path.join(OUT, name + '-ref.png'), PNG.sync.write(a));
  fs.writeFileSync(path.join(OUT, name + '-impl.png'), PNG.sync.write(b));
  fs.writeFileSync(path.join(OUT, name + '-diff.png'), PNG.sync.write(diff));
  return { pct, blob };
}

function paintRect(png, { x, y, w, h }) {
  for (let yy = Math.max(0, y); yy < Math.min(png.height, y + h); yy++)
    for (let xx = Math.max(0, x); xx < Math.min(png.width, x + w); xx++) {
      const i = (png.width * yy + xx) * 4;
      png.data[i] = SENTINEL[0]; png.data[i + 1] = SENTINEL[1]; png.data[i + 2] = SENTINEL[2]; png.data[i + 3] = 255;
    }
}

async function runComponents(page, pair) {
  const ref = await shot(page, pair.ref, { ...pair, solidBg: true });
  const impl = await shot(page, pair.impl, { ...pair, solidBg: true });
  const rb = contentBBox(ref), ib = contentBBox(impl);
  const rStr = rb ? `${rb.w}x${rb.h}` : '0x0', iStr = ib ? `${ib.w}x${ib.h}` : '0x0';
  const sizeMismatch = !rb || !ib || Math.abs(rb.w - ib.w) > BBOX_TOL || Math.abs(rb.h - ib.h) > BBOX_TOL;
  // union bbox (so an empty/short side still gets measured against the other), padded.
  const boxes = [rb, ib].filter(Boolean);
  const u = boxes.length ? {
    x: Math.min(...boxes.map((b) => b.x)) - PAD, y: Math.min(...boxes.map((b) => b.y)) - PAD,
  } : { x: 0, y: 0 };
  u.x = Math.max(0, u.x); u.y = Math.max(0, u.y);
  u.w = (boxes.length ? Math.max(...boxes.map((b) => b.x + b.w)) : 1) - u.x + PAD;
  u.h = (boxes.length ? Math.max(...boxes.map((b) => b.y + b.h)) : 1) - u.y + PAD;
  const { pct, blob } = diffCrop(crop(ref, u), crop(impl, u), pair.name);
  const pass = !sizeMismatch && pct <= MAX_PCT && blob.w <= MAX_BLOB && blob.h <= MAX_BLOB;
  const note = sizeMismatch ? `size mismatch ${rStr} vs ${iStr}` : '';
  return [{ name: pair.name, pct, blob, pass, note }];
}

// HUD regions at 1440×900 (anchors/sizes from spec §2). Refined visually in step 6.
const HUD_REGIONS = [
  { key: 'identity', x: 14, y: 14, w: 300, h: 150 },
  { key: 'clock', x: 470, y: 14, w: 500, h: 136 },
  { key: 'treasury', x: 1086, y: 14, w: 340, h: 136 },
  { key: 'alert', x: 420, y: 170, w: 600, h: 76 },
  { key: 'standings', x: 14, y: 170, w: 300, h: 392 },
  { key: 'context', x: 1086, y: 186, w: 340, h: 634 },
  { key: 'comms', x: 14, y: 586, w: 380, h: 300 },
  { key: 'hotbar', x: 520, y: 782, w: 400, h: 110 },
  { key: 'globe-ctrl', x: 1086, y: 834, w: 340, h: 56 },
  { key: 'toasts', x: 560, y: 180, w: 320, h: 120 },
];
const COUNTDOWN_MASK = { x: 486, y: 20, w: 120, h: 70 }; // ring + countdown in the clock (refine step 6)

async function runHud(page, pair) {
  const ref = await shot(page, pair.ref, { ...pair, hideGlobe: true });
  const impl = await shot(page, pair.impl, { ...pair, hideGlobe: true });
  paintRect(ref, COUNTDOWN_MASK); paintRect(impl, COUNTDOWN_MASK);
  const rows = [];
  for (const reg of HUD_REGIONS) {
    const { pct, blob } = diffCrop(crop(ref, reg), crop(impl, reg), `${pair.name}-${reg.key}`);
    rows.push({ name: `${pair.name} · ${reg.key}`, pct, blob, pass: pct <= MAX_PCT && blob.w <= MAX_BLOB && blob.h <= MAX_BLOB, note: '' });
  }
  return rows;
}

const COMPONENT_GROUPS = ['brand', 'build', 'core', 'feed', 'feedback', 'forms', 'home', 'hud', 'players', 'surfaces'];
const SCENARIOS = ['calm', 'attack', 'starving'];
const MODES = ['build', 'army', 'trade', 'diplomacy'];

function buildSuite(kind, refBase) {
  if (kind === 'components') return COMPONENT_GROUPS.map((g) => ({
    kind, name: `components-${g}`, ref: `${refBase}/components/${g}/${g}.card.html`,
    impl: `${PHP}/dev/components.php?group=${g}`, viewport: { width: 700, height: 900 }, fullPage: true,
  }));
  if (kind === 'hud') { const out = []; for (const s of SCENARIOS) for (const m of MODES) out.push({
    kind, name: `hud-${s}-${m}`, ref: `${refBase}/ui_kits/game/match-hud.html?scenario=${s}&mode=${m}`,
    impl: `${PHP}/game?mock=1&scenario=${s}&mode=${m}`, viewport: { width: 1440, height: 900 }, fullPage: false,
  }); return out; }
  throw new Error('unknown suite: ' + kind);
}

(async () => {
  const kind = process.argv[2];
  if (!kind) { console.error('usage: node compare.mjs <components|hud>'); process.exit(2); }
  fs.mkdirSync(OUT, { recursive: true });
  const { server, port } = await startStatic(DESIGN_ROOT);
  const pairs = buildSuite(kind, `http://127.0.0.1:${port}`);
  const browser = await chromium.launch();
  const page = await browser.newPage({ deviceScaleFactor: 1 });
  let rows = [];
  for (const pair of pairs) {
    try { rows.push(...(kind === 'hud' ? await runHud(page, pair) : await runComponents(page, pair))); }
    catch (e) { rows.push({ name: pair.name, pct: 100, blob: { w: 0, h: 0 }, pass: false, note: String(e.message || e) }); }
  }
  await browser.close(); server.close();

  const w = Math.max(...rows.map((r) => r.name.length), 18);
  console.log('\n' + 'NAME'.padEnd(w) + '  ' + 'DIFF%'.padStart(8) + '  ' + 'MAXBLOB'.padStart(9) + '   RESULT');
  console.log('-'.repeat(w + 34));
  for (const r of rows) console.log(
    r.name.padEnd(w) + '  ' + r.pct.toFixed(2).padStart(7) + '%  ' +
    `${r.blob.w}x${r.blob.h}`.padStart(9) + '   ' + (r.pass ? 'PASS' : 'FAIL') + (r.note ? '  ' + r.note : ''));
  const failed = rows.filter((r) => !r.pass);
  console.log('-'.repeat(w + 34));
  console.log(`${rows.length - failed.length}/${rows.length} passed (<=${MAX_PCT}% & blob<=${MAX_BLOB}px). Diffs: ${path.relative(process.cwd(), OUT)}/<name>-diff.png`);
  process.exit(failed.length ? 1 : 0);
})();
