// Screenshots the real app in the same states (API mocked from fixtures/), hides WebGL canvases,
// and diffs against reference/masked. Writes out/impl, out/diff and out/side (reference | implementation | diff).
// Usage: IMPL_URL=http://127.0.0.1:8000 npm run compare [-- <state-name>]
import { chromium } from 'playwright';
import { PNG } from 'pngjs';
import pixelmatch from 'pixelmatch';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import states from './states.mjs';

const IMPL = process.env.IMPL_URL || 'http://127.0.0.1:8000';
const MAX_DIFF = Number(process.env.MAX_DIFF || 1.5);   // % of pixels
const MAX_DH = Number(process.env.MAX_DH || 4);         // px height delta (landing)
const only = process.argv[2];
for (const d of ['out/impl', 'out/diff', 'out/side']) mkdirSync(d, { recursive: true });
const fx = (n) => JSON.parse(readFileSync(new URL('./fixtures/' + n + '.json', import.meta.url)));

async function mockApi(page, s) {
  const map = {
    '/api/auth/me': fx('auth-me'), '/api/auth/guest': fx('auth-me'),
    '/api/country/leaders': fx('leaders'), '/api/match/list': fx('match-list'),
    '/api/match/get': fx(s.get || 'match-get-joined'),
    '/api/player/selectCountry': fx('select-country-prk'),
    '/api/player/setReady': { success: true },
  };
  await page.route('**/api/**', (route) => {
    const p = new URL(route.request().url()).pathname;
    if (!map[p]) return route.fulfill({ status: 404, json: { success: false, message: 'No fixture for ' + p } });
    return route.fulfill({ json: map[p] });
  });
}

const pad = (img, w, h) => {
  const out = new PNG({ width: w, height: h });
  for (let i = 0; i < out.data.length; i += 4) { out.data[i] = 255; out.data[i + 1] = 0; out.data[i + 2] = 255; out.data[i + 3] = 255; }
  PNG.bitblt(img, out, 0, 0, Math.min(img.width, w), Math.min(img.height, h), 0, 0);
  return out;
};

const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const rows = [];
for (const s of states) {
  if (only && s.name !== only) continue;
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
  await mockApi(page, s);
  await page.goto(IMPL + s.impl, { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(2000);
  if (s.setup) { await page.evaluate(s.setup); await page.waitForTimeout(300); }
  await page.addStyleTag({ content: 'canvas{visibility:hidden!important}' });
  const buf = await page.screenshot({ fullPage: s.mode === 'fullpage', animations: 'disabled' });
  writeFileSync('out/impl/' + s.name + '.png', buf);
  const ref = PNG.sync.read(readFileSync('reference/masked/' + s.name + '.png'));
  const imp = PNG.sync.read(buf);
  const w = Math.max(ref.width, imp.width), h = Math.max(ref.height, imp.height);
  const a = pad(ref, w, h), b = pad(imp, w, h), diff = new PNG({ width: w, height: h });
  const n = pixelmatch(a.data, b.data, diff.data, w, h, { threshold: 0.1, includeAA: false });
  writeFileSync('out/diff/' + s.name + '.png', PNG.sync.write(diff));
  const side = new PNG({ width: w * 3, height: h });
  PNG.bitblt(a, side, 0, 0, w, h, 0, 0); PNG.bitblt(b, side, 0, 0, w, h, w, 0); PNG.bitblt(diff, side, 0, 0, w, h, w * 2, 0);
  writeFileSync('out/side/' + s.name + '.png', PNG.sync.write(side));
  const pct = (100 * n) / (w * h), dh = imp.height - ref.height;
  rows.push({ state: s.name, diffPct: pct.toFixed(2), heightDelta: dh, pass: pct <= MAX_DIFF && Math.abs(dh) <= MAX_DH });
  await page.close();
}
await browser.close();
console.table(rows);
process.exit(rows.every((r) => r.pass) ? 0 : 1);
