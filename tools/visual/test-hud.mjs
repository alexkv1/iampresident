// Playwright interaction tests for the Match HUD (run against the PHP dev server).
//   node test-hud.mjs
// Env: PHP_BASE (default http://127.0.0.1:8000).
//
// Selector/behaviour contract the HUD implementation (steps 6–7) must satisfy:
//   - Hotbar buttons:      [data-hotbar="build|army|trade|diplomacy"]
//   - Context panel:       #context-panel[data-mode="…"]   (reflects the active mode)
//   - Chat input:          #chat-input
//   - Build tiles:         [data-build="farm"] etc.;        add ?broke=1 to make all unaffordable
//   - Under construction:  [data-queue-item] rows
//   - Lens buttons:        [data-lens="political|farmland|minerals|oil"], active => aria-pressed="true"
//   - Toasts:              #toast .toast  (text)
//   - window.hudNum()      exposed for number formatting
import { chromium } from 'playwright';

const PHP = process.env.PHP_BASE || 'http://127.0.0.1:8000';
const results = [];
const ok = (name, cond, info = '') => results.push({ name, pass: !!cond, info });

async function settle(page) {
  await page.evaluate(() => document.fonts && document.fonts.ready).catch(() => {});
  await page.waitForTimeout(800);
}
const mode = (page) => page.getAttribute('#context-panel', 'data-mode').catch(() => null);
async function toastText(page) {
  try { return (await page.locator('#toast .toast').last().textContent({ timeout: 3000 })).trim(); }
  catch { return null; }
}

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.setViewportSize({ width: 1440, height: 900 });

  try {
    await page.goto(`${PHP}/game?mock=1`, { waitUntil: 'networkidle', timeout: 45000 });
    await settle(page);

    // 1. Hotbar click switches mode
    await page.click('[data-hotbar="army"]');
    ok('hotbar click → army', (await mode(page)) === 'army');

    // 2. Keyboard B/A/T/D
    await page.keyboard.press('t'); ok('key T → trade', (await mode(page)) === 'trade');
    await page.keyboard.press('d'); ok('key D → diplomacy', (await mode(page)) === 'diplomacy');
    await page.keyboard.press('b'); ok('key B → build', (await mode(page)) === 'build');

    // 3. Keys ignored while typing in chat. The composer is Chat-tab-only (faithful to
    //    the mockup, where <Input> renders only when tab==='chat'), so open that tab first.
    await page.click('[data-tab="chat"]');
    await page.click('#chat-input');
    await page.keyboard.type('army');
    ok('keys ignored while typing in chat', (await mode(page)) === 'build');
    await page.click('[data-hotbar="build"]');

    // 4. Afford a build → toast + under-construction row
    const before = await page.locator('[data-queue-item]').count();
    await page.click('[data-build="farm"]');
    const t4 = await toastText(page);
    const after = await page.locator('[data-queue-item]').count();
    ok('affordable build → "Farm started." toast', t4 === 'Farm started.', `got: ${t4}`);
    ok('affordable build → +1 under-construction row', after === before + 1, `${before}→${after}`);

    // 5. Unaffordable build → error toast
    await page.goto(`${PHP}/game?mock=1&broke=1`, { waitUntil: 'networkidle', timeout: 45000 });
    await settle(page);
    await page.click('[data-hotbar="build"]');
    await page.click('[data-build="farm"]');
    const t5 = await toastText(page);
    ok('unaffordable build → "Not enough resources." toast', t5 === 'Not enough resources.', `got: ${t5}`);

    // 6. Lens buttons change active state
    await page.click('[data-lens="farmland"]');
    ok('lens farmland becomes active', (await page.getAttribute('[data-lens="farmland"]', 'aria-pressed')) === 'true');

    // 7. Number formatting (hudNum)
    const nums = await page.evaluate(() => ({
      a: window.hudNum(2410), b: window.hudNum(100000), c: window.hudNum(10600000),
    })).catch(() => ({}));
    ok('hudNum(2410) = "2\\u00a0410"', nums.a === '2 410', `got: ${JSON.stringify(nums.a)}`);
    ok('hudNum(100000) = "100K"', nums.b === '100K', `got: ${JSON.stringify(nums.b)}`);
    ok('hudNum(10600000) = "10.6M"', nums.c === '10.6M', `got: ${JSON.stringify(nums.c)}`);
  } catch (e) {
    ok('suite ran without fatal error', false, String(e.message || e));
  }
  await browser.close();

  const w = Math.max(...results.map((r) => r.name.length), 10);
  console.log('');
  for (const r of results) console.log((r.pass ? 'PASS ' : 'FAIL ') + r.name.padEnd(w) + (r.info && !r.pass ? '   ' + r.info : ''));
  const failed = results.filter((r) => !r.pass);
  console.log(`\n${results.length - failed.length}/${results.length} checks passed.`);
  process.exit(failed.length ? 1 : 0);
})();
