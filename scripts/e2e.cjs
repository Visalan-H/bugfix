// Browser test of the whole site against the production build.
// Not run in CI. Run it before merging:
//
//   npm run build && npx vite preview --port 4173 &
//   npm run test:e2e
//
// Needs Playwright with Chromium available to require('playwright').
const { chromium } = require('playwright');
const { mkdirSync } = require('node:fs');
const { join } = require('node:path');
const SP = join(__dirname, '..', 'node_modules', '.e2e');
mkdirSync(SP, { recursive: true });
const LV = JSON.parse(require('node:child_process').execSync('npx tsx scripts/e2e-levels.ts', { encoding: 'utf8' }));
const BASE = process.env.BASE_URL || 'http://localhost:4173/';
let fails = 0;
const ok = (name, cond, extra = '') => {
  console.log(`${cond ? '✓' : '✗'} ${name}${cond ? '' : '  ' + extra}`);
  if (!cond) fails++;
};
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 1280, height: 800 } });
  const p = await ctx.newPage();
  const errors = [];
  p.on('pageerror', (e) => errors.push(e.message));
  p.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  const secretFetches = [];
  p.on('response', async (r) => {
    if (!/\/[ehm]\d+-[\w-]+\.js$/.test(r.url())) return;
    try {
      const t = await r.text();
      if (/[`"'][A-Za-z0-9+/]{200,}={0,2}[`"']/.test(t) && !t.includes('ticket'))
        secretFetches.push(r.url().split('/').pop());
    } catch {}
  });

  // ---- old progress from the old site loads
  const e2app = 'src/app.js';
  await p.goto(BASE);
  await p.evaluate(
    ([e2app]) =>
      localStorage.setItem(
        'bugdrill:v1',
        JSON.stringify({
          levels: {
            e2: {
              edits: { [e2app]: '// my old edit\n' },
              notes: 'old note',
              solved: true,
              best: 500,
              hints: { 0: 1 },
              revealed: false,
              started: true,
              elapsed: 300000,
            },
          },
          interview: false,
          consoleH: 250,
        }),
      ),
    [e2app],
  );
  await p.goto(BASE + '#home');
  await p.reload();
  await p.waitForSelector('.card');
  ok('old #home link goes to #/', p.url().endsWith('#/'), p.url());
  const e2card = await p.locator('a.card[href="#/level/e2"] .status').innerText();
  ok('old progress: e2 shows solved time 08:20', e2card.includes('08:20'), e2card);
  ok('progress counter 1/40', (await p.innerText('.sec-h')).includes('1/40'));

  await p.goto(BASE + '#level-e2');
  await p.waitForSelector('.monaco-editor');
  ok('old #level-e2 link goes to #/level/e2', p.url().endsWith('#/level/e2'), p.url());
  await sleep(1000);
  await p.locator('.fi', { hasText: 'app.js' }).first().click();
  await p
    .waitForFunction(
      () => [...document.querySelectorAll('.view-lines')].some((v) => v.innerText.includes('my old edit')),
      null,
      { timeout: 8000 },
    )
    .catch(() => {});
  ok(
    'old edit shows in the editor',
    (await p.locator('.view-lines').allInnerTexts()).some((t) => t.replace(/\u00a0/g, ' ').includes('my old edit')),
    JSON.stringify({
      tabs: await p.locator('.etab').allInnerTexts(),
      ed: (await p.locator('.view-lines').allInnerTexts()).map((t) => t.slice(0, 50)),
      store: await p.evaluate(() => JSON.parse(localStorage.getItem('bugdrill:v1')).levels.e2),
    }),
  );
  await p.locator('.ptabs button', { hasText: 'Notes' }).click();
  ok('old notes load', (await p.inputValue('textarea.notes')) === 'old note');

  // ---- e1: editor
  await p.goto(BASE + '#/level/e1');
  await p.reload();
  await p.waitForSelector('.monaco-editor .view-lines');
  await sleep(2500); // TS worker
  const squiggles = await p.locator('.squiggly-error').count();
  ok('no red error underlines in the starting code', squiggles === 0, `${squiggles} found`);
  ok('secrets not fetched on open', secretFetches.length === 0, secretFetches.join());
  const tabNames = await p.locator('.etab').allInnerTexts();
  ok(
    'default tabs: route + test',
    tabNames.some((t) => t.includes('todos.js')) && tabNames.some((t) => t.includes('test')),
    tabNames.join('|'),
  );

  // read-only test file
  await p.locator('.etab', { hasText: 'todos.test.js' }).first().click();
  await p.locator('.monaco-editor .view-lines').first().click();
  const before = await p.locator('.view-lines').first().innerText();
  await p.keyboard.type('zzz');
  ok(
    'test files are read-only',
    !(await p.locator('.view-lines').first().innerText()).includes('zzz') && before.length > 0,
  );

  // ---- run tests (buggy)
  await p.click('button.tb.run');
  await p.waitForFunction(
    () =>
      /\d+\/\d+/.test(document.querySelector('.sumbar .big')?.textContent || '') &&
      !document.querySelector('button.tb.run')?.disabled,
    null,
    { timeout: 15000 },
  );
  const sum = await p.innerText('.sumbar .big');
  ok('Run shows results (buggy e1 fails)', sum === '0/3', sum);
  ok('timer started on run', (await p.getAttribute('.timer', 'class')).includes('run'));
  ok('secrets still not fetched after Run', secretFetches.length === 0, secretFetches.join());

  // ---- console.log on line 2 + link
  await p.locator('.etab', { hasText: 'todos.js' }).filter({ hasNotText: 'test' }).first().click();
  const ed = p.locator('.monaco-editor .view-lines').first();
  await ed.click();
  await p.keyboard.press('Control+Home');
  await p.keyboard.press('End');
  await p.keyboard.press('Enter');
  await p.keyboard.press('Home');
  await p.keyboard.insertText("console.log('probe here');");
  ok('edit marks the file as changed', (await p.locator('.fi .mod').count()) > 0);
  await p.keyboard.press('Control+Enter');
  await p.waitForFunction(
    () => !document.querySelector('button.tb.run')?.disabled && document.querySelectorAll('.con-line').length > 0,
    null,
    { timeout: 15000 },
  );
  const link = p.locator('.con-src').first();
  const linkText = await link.innerText();
  ok('console shows the log with file:line', linkText === 'todos.js:2', linkText);
  await p.keyboard.press('Control+End');
  await link.click();
  await sleep(400);
  const activeLine = await p.locator('.monaco-editor .line-numbers.active-line-number').first().innerText();
  ok('console link lands on the right line in the editor', activeLine.trim() === '2', activeLine);
  ok('line flashes', (await p.locator('.line-flash').count()) > 0);

  // ---- infinite loop
  await ed.click();
  await p.keyboard.press('Control+Home');
  await p.keyboard.press('End');
  await p.keyboard.press('Enter');
  await p.keyboard.press('Home');
  await p.keyboard.insertText('while (true) {}');
  const t0 = Date.now();
  await p.click('button.tb.run');
  let ticks = 0;
  const probe = setInterval(async () => {
    try {
      await p.evaluate(() => 1);
      ticks++;
    } catch {}
  }, 200);
  await p.waitForFunction(() => !document.querySelector('button.tb.run')?.disabled, null, { timeout: 30000 });
  clearInterval(probe);
  const loopTxt = await p.innerText('.pbody');
  ok('infinite loop: error shown in Results', /didn't finish in 3 seconds/.test(loopTxt), loopTxt.slice(0, 200));
  ok('infinite loop: page stayed responsive', ticks >= 5, `ticks=${ticks}, took ${Date.now() - t0}ms`);

  // ---- diff modal + reset all
  await p.click('button.tb.opt:has-text("Diff")');
  ok('diff popup lists the change', (await p.innerText('.modal')).includes('while (true) {}'));
  const ra = p.locator('.modal .mf button').first();
  await ra.click();
  ok('reset asks to confirm', (await ra.innerText()).includes('again'));
  await ra.click();
  await sleep(300);
  ok('reset all restores files', (await p.locator('.fi .mod').count()) === 0);

  // ---- hints fetch secrets
  await p.locator('.ptabs button', { hasText: 'Hints' }).click();
  await p.waitForSelector('.bug button', { timeout: 5000 });
  ok('opening Hints fetches the secrets', secretFetches.length === 1, secretFetches.join());
  await p.locator('.bug button', { hasText: 'Hint 1' }).first().click();
  ok('hint 1 shows', (await p.locator('.bug .hint').count()) === 1);

  // ---- solve e5 by typing the real fix
  await p.goto(BASE + '#/level/e5');
  await p.waitForSelector('.monaco-editor .view-lines');
  for (const [file, text] of Object.entries(LV.e5.solution)) {
    await p
      .locator('.fi', { hasText: file.split('/').pop() })
      .first()
      .click();
    await sleep(200);
    await p.locator('.monaco-editor .view-lines').first().click();
    await p.keyboard.press('Control+A');
    await p.keyboard.insertText(text);
  }
  await p.click('button.tb.sub');
  await p.waitForFunction(
    () => !document.querySelector('button.tb.sub')?.disabled && document.querySelector('.sumbar'),
    null,
    { timeout: 20000 },
  );
  await sleep(300);
  const sub = await p.innerText('.pbody');
  ok(
    'submit with the real fix: all pass incl. hidden',
    /All \d+ tests pass, hidden ones too/.test(sub),
    sub.slice(0, 200),
  );
  ok(
    'Answers unlocked after solving',
    !(await p.locator('.ptabs button', { hasText: 'Answers' }).innerText()).includes('🔒'),
  );
  const saved = await p.evaluate(() => JSON.parse(localStorage.getItem('bugdrill:v1')).levels.e5);
  ok(
    'solved + best time saved',
    saved.solved === true && typeof saved.best === 'number',
    JSON.stringify({ s: saved.solved, b: saved.best }),
  );

  // ---- interview mode
  await p.goto(BASE + '#/');
  await p.click('.toggle');
  await sleep(200);
  await p.goto(BASE + '#/level/e3');
  await p.waitForSelector('.monaco-editor .view-lines');
  await p.locator('.ptabs button', { hasText: 'Hints' }).click();
  ok('interview mode hides hints', (await p.innerText('.pbody')).includes('Interview mode is on'));
  ok(
    'interview mode hides tips',
    await p
      .locator('.ptabs button', { hasText: 'Task' })
      .click()
      .then(async () => (await p.locator('details.coach').count()) === 0),
  );
  await p.click('button.tb.sub');
  await p.waitForFunction(
    () => !document.querySelector('button.tb.sub')?.disabled && document.querySelector('.sumbar'),
    null,
    { timeout: 20000 },
  );
  const hidTxt = await p.innerText('.pbody');
  ok('interview mode masks hidden test names', /Hidden test #1/.test(hidTxt), hidTxt.slice(-300));
  await p.goto(BASE + '#/');
  await p.click('.toggle');

  // ---- screenshots desktop
  await p.goto(BASE + '#/level/e1');
  await p.waitForSelector('.monaco-editor .view-lines');
  await sleep(800);
  await p.screenshot({ path: SP + '/desk-level.png' });
  await p.goto(BASE + '#/');
  await p.screenshot({ path: SP + '/desk-home.png' });

  // ---- phone
  const m = await b.newPage({ viewport: { width: 390, height: 844 } });
  m.on('pageerror', (e) => errors.push('mobile: ' + e.message));
  await m.goto(BASE + '#/level/e1');
  await m.waitForSelector('.monaco-editor .view-lines');
  await sleep(800);
  ok('phone: one editor pane only', (await m.locator('.epane').count()) === 1);
  ok('phone: no Split button', (await m.locator('[title*="side by side"], button:has-text("Split")').count()) === 0);
  ok(
    'phone: no sideways scroll',
    await m.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1),
  );
  await m.screenshot({ path: SP + '/m-code.png' });
  await m.click('.mtabs button:has-text("Files")');
  await m.screenshot({ path: SP + '/m-files.png' });
  await m.locator('.fi', { hasText: 'app.js' }).first().click();
  await sleep(200);
  ok(
    'phone: tapping a file opens Code',
    (await m.getAttribute('.mtabs button:has-text("Code")', 'class')).includes('on'),
  );
  await m.click('button.tb.run');
  await m.waitForFunction(
    () => !document.querySelector('button.tb.run')?.disabled && document.querySelector('.sumbar'),
    null,
    { timeout: 15000 },
  );
  ok(
    'phone: Run switches to Task / Results',
    (await m.getAttribute('.mtabs button:has-text("Task")', 'class')).includes('on'),
  );
  await m.screenshot({ path: SP + '/m-results.png' });
  await m.goto(BASE + '#/');
  await m.screenshot({ path: SP + '/m-home.png' });
  ok(
    'phone home: no sideways scroll',
    await m.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1),
  );
  await m.goto(BASE + '#/guide');
  await m.screenshot({ path: SP + '/m-guide.png' });

  ok('no page errors', errors.length === 0, errors.slice(0, 5).join(' | '));
  console.log(fails ? `\n${fails} FAILED` : '\nALL PASSED');
  await b.close();
  process.exit(fails ? 1 : 0);
})();
