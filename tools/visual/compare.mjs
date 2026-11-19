// Visual regression: screenshot a reference (design mockup, served statically) and
// the implementation (running PHP dev server), diff with pixelmatch, write out/*.png,
// print a PASS/FAIL table. Fail when > 0.5% of pixels differ.
//
//   node compare.mjs components      # design cards vs /dev/components.php
//   node compare.mjs hud             # match-hud.html vs /game?mock=1 (12 scenario×mode pairs)
//
// Env: PHP_BASE (default http://127.0.0.1:8000) — the running PHP dev server.
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
const FAIL_PCT = 0.5;            // fail threshold (percent of pixels different)
const PX_THRESHOLD = 0.1;        // pixelmatch per-pixel colour threshold

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
    if (!fp.startsWith(root) || !fs.existsSync(fp) || fs.statSync(fp).isDirectory()) {
      res.writeHead(404); res.end('404'); return;
    }
    res.writeHead(200, { 'Content-Type': MIME[path.extname(fp)] || 'application/octet-stream' });
    fs.createReadStream(fp).pipe(res);
  });
  return new Promise((resolve) => server.listen(0, '127.0.0.1', () => resolve({ server, port: server.address().port })));
}

async function shot(page, url, { viewport, fullPage = false, hideGlobe = false }) {
  await page.setViewportSize(viewport);
  await page.goto(url, { waitUntil: 'networkidle', timeout: 45000 });
  await page.evaluate(() => document.fonts && document.fonts.ready).catch(() => {});
  if (hideGlobe) await page.waitForSelector('canvas', { timeout: 6000 }).catch(() => {}); // globe, if any
  await page.waitForTimeout(1500);
  if (hideGlobe) {
    await page.evaluate(() => document.querySelectorAll('canvas').forEach((c) => { c.style.visibility = 'hidden'; }));
    await page.waitForTimeout(150);
  }
  const buf = await page.screenshot({ fullPage, animations: 'disabled' });
  return PNG.sync.read(buf);
}

// Copy `src` PNG into a fresh WxH PNG (top-left), filling the rest with navy so a
// size mismatch counts as a difference rather than crashing pixelmatch.
function fit(src, W, H) {
  if (src.width === W && src.height === H) return src;
  const out = new PNG({ width: W, height: H });
  for (let i = 0; i < out.data.length; i += 4) { out.data[i] = 5; out.data[i + 1] = 8; out.data[i + 2] = 15; out.data[i + 3] = 255; }
  for (let y = 0; y < Math.min(H, src.height); y++) {
    for (let x = 0; x < Math.min(W, src.width); x++) {
      const s = (src.width * y + x) * 4, d = (W * y + x) * 4;
      out.data[d] = src.data[s]; out.data[d + 1] = src.data[s + 1]; out.data[d + 2] = src.data[s + 2]; out.data[d + 3] = src.data[s + 3];
    }
  }
  return out;
}

function paintRect(png, { x, y, w, h }) {
  for (let yy = Math.max(0, y); yy < Math.min(png.height, y + h); yy++) {
    for (let xx = Math.max(0, x); xx < Math.min(png.width, x + w); xx++) {
      const i = (png.width * yy + xx) * 4;
      png.data[i] = 255; png.data[i + 1] = 0; png.data[i + 2] = 255; png.data[i + 3] = 255;
    }
  }
}

async function comparePair(page, pair) {
  const ref = await shot(page, pair.ref, pair);
  const impl = await shot(page, pair.impl, pair);
  const W = Math.max(ref.width, impl.width), H = Math.max(ref.height, impl.height);
  const a = fit(ref, W, H), b = fit(impl, W, H);
  for (const m of pair.masks || []) { paintRect(a, m); paintRect(b, m); }
  const diff = new PNG({ width: W, height: H });
  const n = pixelmatch(a.data, b.data, diff.data, W, H, { threshold: PX_THRESHOLD });
  const pct = (n / (W * H)) * 100;
  fs.writeFileSync(path.join(OUT, pair.name + '-ref.png'), PNG.sync.write(a));
  fs.writeFileSync(path.join(OUT, pair.name + '-impl.png'), PNG.sync.write(b));
  fs.writeFileSync(path.join(OUT, pair.name + '-diff.png'), PNG.sync.write(diff));
  return { name: pair.name, pct, pass: pct <= FAIL_PCT, dims: `${W}x${H}`, sizeMismatch: ref.width !== impl.width || ref.height !== impl.height };
}

const COMPONENT_GROUPS = ['brand', 'build', 'core', 'feed', 'feedback', 'forms', 'home', 'hud', 'players', 'surfaces'];
const SCENARIOS = ['calm', 'attack', 'starving'];
const MODES = ['build', 'army', 'trade', 'diplomacy'];
// HUD masks (1440×900): the live countdown/ring in the world clock (top-centre). The globe
// itself is hidden via hideGlobe. Refined visually in step 6.
const HUD_MASKS = [{ x: 470, y: 8, w: 500, h: 128 }];

function buildSuite(kind, refBase) {
  if (kind === 'components') {
    return COMPONENT_GROUPS.map((g) => ({
      name: `components-${g}`,
      ref: `${refBase}/components/${g}/${g}.card.html`,
      impl: `${PHP}/dev/components.php?group=${g}`,
      viewport: { width: 700, height: 900 }, fullPage: true,
    }));
  }
  if (kind === 'hud') {
    const pairs = [];
    for (const s of SCENARIOS) for (const m of MODES) pairs.push({
      name: `hud-${s}-${m}`,
      ref: `${refBase}/ui_kits/game/match-hud.html?scenario=${s}&mode=${m}`,
      impl: `${PHP}/game?mock=1&scenario=${s}&mode=${m}`,
      viewport: { width: 1440, height: 900 }, fullPage: false, hideGlobe: true, masks: HUD_MASKS,
    });
    return pairs;
  }
  throw new Error('unknown suite: ' + kind);
}

(async () => {
  const kind = process.argv[2];
  if (!kind) { console.error('usage: node compare.mjs <components|hud>'); process.exit(2); }
  fs.mkdirSync(OUT, { recursive: true });
  const { server, port } = await startStatic(DESIGN_ROOT);
  const refBase = `http://127.0.0.1:${port}`;
  const pairs = buildSuite(kind, refBase);

  const browser = await chromium.launch();
  const page = await browser.newPage({ deviceScaleFactor: 1 });
  const results = [];
  for (const pair of pairs) {
    try { results.push(await comparePair(page, pair)); }
    catch (e) { results.push({ name: pair.name, pct: 100, pass: false, dims: '-', err: String(e.message || e) }); }
  }
  await browser.close();
  server.close();

  const w = Math.max(...results.map((r) => r.name.length), 20);
  console.log('\n' + 'NAME'.padEnd(w) + '  ' + 'DIFF%'.padStart(8) + '   RESULT');
  console.log('-'.repeat(w + 20));
  for (const r of results) {
    const note = r.err ? '  ' + r.err : (r.sizeMismatch ? '  (size mismatch)' : '');
    console.log(r.name.padEnd(w) + '  ' + r.pct.toFixed(2).padStart(7) + '%   ' + (r.pass ? 'PASS' : 'FAIL') + note);
  }
  const failed = results.filter((r) => !r.pass);
  console.log('-'.repeat(w + 20));
  console.log(`${results.length - failed.length}/${results.length} passed. Diffs in ${path.relative(process.cwd(), OUT)}/<name>-diff.png`);
  process.exit(failed.length ? 1 : 0);
})();
