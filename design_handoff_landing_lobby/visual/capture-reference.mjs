// Renders every state from the prototype (the source of truth) into reference/full (with globes, for eyeballing)
// and reference/masked (canvases hidden, for pixel diffing).
// 1) npm run serve:proto   (separate terminal)   2) npm run capture
import { chromium } from 'playwright';
import { mkdir } from 'node:fs/promises';
import states from './states.mjs';

const PROTO = process.env.PROTO_URL || 'http://127.0.0.1:4173/Landing%20Page.dc.html';
const only = process.argv[2];
await mkdir('reference/full', { recursive: true });
await mkdir('reference/masked', { recursive: true });
const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const page = await browser.newPage({ viewport: { width: 1600, height: 1000 }, deviceScaleFactor: 1 });
for (const s of states) {
  if (only && s.name !== only) continue;
  await page.goto(PROTO + '?' + s.proto, { waitUntil: 'networkidle' });
  await page.waitForSelector('html[data-hooks="ready"]');
  await page.evaluate(() => document.fonts.ready);
  await page.addStyleTag({ content: '.dv-card{border:0!important;border-radius:0!important;box-shadow:none!important}' });
  await page.waitForTimeout(3000); // globes fetch countries.geo.json and settle
  const card = page.locator('[id="' + s.card + '"] .dv-card');
  await card.screenshot({ path: 'reference/full/' + s.name + '.png', animations: 'disabled' });
  const mask = await page.addStyleTag({ content: 'canvas{visibility:hidden!important}' });
  await card.screenshot({ path: 'reference/masked/' + s.name + '.png', animations: 'disabled' });
  await mask.evaluate((el) => el.remove());
  console.log('captured', s.name);
}
await browser.close();
