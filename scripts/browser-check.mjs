import assert from 'node:assert/strict';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import ts from 'typescript';

const modulePath = process.env.PLAYWRIGHT_MODULE;
if (!modulePath) throw new Error('Set PLAYWRIGHT_MODULE to an installed Playwright module. See README.');
const { chromium, expect } = await import(modulePath.startsWith('/') ? pathToFileURL(modulePath).href : modulePath);
const modelSource = await readFile(new URL('../src/game.ts', import.meta.url), 'utf8');
const modelCode = ts.transpileModule(modelSource, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } }).outputText;
const { cases, dailyCase, STORAGE_KEY } = await import(`data:text/javascript;base64,${Buffer.from(modelCode).toString('base64')}`);
const baseURL = process.env.BASE_URL ?? 'http://127.0.0.1:5188/';
const origin = new URL(baseURL).origin;
const label = baseURL.startsWith('http://127.') ? 'local' : 'live';
const artifactDirectory = new URL('../artifacts/', import.meta.url);
await mkdir(artifactDirectory, { recursive: true });

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, timezoneId: 'Australia/Sydney', reducedMotion: 'reduce' });
const page = await context.newPage();
const errors = [];
const failedResponses = [];
const externalRequests = [];
const tested = [];
page.on('pageerror', (error) => errors.push(error.message));
page.on('response', (response) => {
  if (response.status() >= 400) failedResponses.push(`${response.status()} ${response.url()}`);
});
page.on('request', (request) => {
  if (new URL(request.url()).origin !== origin) externalRequests.push(request.url());
});
try {
  const response = await page.goto(baseURL, { waitUntil: 'networkidle' });
  assert.equal(response.status(), 200);
  await expect(page.getByRole('heading', { name: /Every detail/ })).toBeVisible();
  const localParts = await page.evaluate(() => { const d = new Date(); return [d.getFullYear(), d.getMonth(), d.getDate()]; });
  await expect(page.getByTestId('case-select')).toHaveValue(dailyCase(new Date(...localParts)).id);
  tested.push('Daily selection matches local calendar date');

  await page.keyboard.press('Tab');
  await expect(page.getByRole('link', { name: 'Skip to investigation' })).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.locator('#case-file')).toBeInViewport();
  tested.push('Keyboard skip navigation');
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({ path: new URL(`${label}-desktop.png`, artifactDirectory).pathname, fullPage: true });

  for (const [index, c] of cases.entries()) {
    await page.getByTestId('case-select').selectOption(c.id);
    await expect(page.locator('#case-title')).toHaveText(c.title);
    await expect(page.getByTestId('accuse-submit')).toBeDisabled();
    for (const clue of c.clues.filter((item) => item.requires.length)) {
      await expect(page.getByTestId(`clue-${clue.id}`)).toBeDisabled();
    }
    await expect(page.locator('.solution-person')).toHaveCount(0);
    await page.getByRole('button', { name: 'Reveal a hint', exact: false }).click();
    await expect(page.locator('.hint-copy')).toBeVisible();

    const read = new Set();
    while (read.size < c.clues.length) {
      const clue = c.clues.find((item) => !read.has(item.id) && item.requires.every((id) => read.has(id)));
      assert.ok(clue, `Reachable next lead for ${c.title}`);
      await page.getByTestId(`clue-${clue.id}`).click();
      await expect(page.getByText(clue.text, { exact: true })).toBeVisible();
      read.add(clue.id);
    }
    await page.getByRole('button', { name: `Pin ${c.clues[0].title}`, exact: true }).click();
    const note = `Case ${index + 1}: compare the record with the reason.`;
    await page.getByTestId('notes').fill(note);
    await page.getByTestId('notes').press('Tab');
    await expect(page.locator('.pinned-list li')).toHaveCount(1);
    await page.locator('#suspect').selectOption(c.suspects.find((s) => s.id !== c.solution.suspectId).id);
    await page.locator('#motive').selectOption(c.solution.motiveId);
    for (const id of c.solution.evidenceIds) {
      await page.getByRole('checkbox', { name: c.clues.find((item) => item.id === id).title, exact: true }).check();
    }
    await page.getByTestId('accuse-submit').click();
    await expect(page.locator('.feedback')).toContainText('Not quite a closed case.');
    await expect(page.locator('.solution-person')).toHaveCount(0);
    await expect(page.locator('.status-stamp')).toHaveText('INVESTIGATION OPEN');
    await page.locator('#suspect').selectOption(c.solution.suspectId);
    await page.getByTestId('accuse-submit').click();
    await expect(page.getByRole('heading', { name: 'Case closed.', exact: true })).toBeVisible();
    await expect(page.locator('.ending')).toContainText(c.ending);
    await expect(page.locator('.solved-panel')).toContainText(c.solution.explanation);
    await expect(page.locator('.attempt-count')).toContainText('2 accusations');
    await expect.poll(() => page.evaluate((key) => JSON.parse(localStorage.getItem(key) ?? '{}'), STORAGE_KEY)).toMatchObject({
      [c.id]: { solved: true, notes: note, attempts: 1, pinned: [c.clues[0].id], hintLevel: 1 },
    });

    await page.reload({ waitUntil: 'networkidle' });
    await page.getByTestId('case-select').selectOption(c.id);
    await expect(page.getByTestId('notes')).toHaveValue(note);
    await expect(page.locator('.pinned-list li')).toHaveCount(1);
    await expect(page.getByRole('heading', { name: 'Case closed.', exact: true })).toBeVisible();
    tested.push(`${c.title}: staged leads, hint, notes/pins, wrong accusation rejected, correct ending, persisted reload`);
  }
  await page.screenshot({ path: new URL(`${label}-solved.png`, artifactDirectory).pathname, fullPage: true });
  await page.getByTestId('restart').click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).not.toBeVisible();
  await expect(page.getByRole('heading', { name: 'Case closed.', exact: true })).toBeVisible();
  await page.getByTestId('restart').click();
  await page.getByRole('button', { name: 'Yes, restart case', exact: true }).click();
  await expect(page.getByRole('dialog')).not.toBeVisible();
  await expect(page.getByTestId('notes')).toHaveValue('');
  await expect(page.locator('.pinned-list li')).toHaveCount(0);
  await expect(page.locator('.case-progress')).toContainText('0 of 8 clues read');
  await page.getByTestId('case-select').selectOption(cases[0].id);
  await expect(page.getByRole('heading', { name: 'Case closed.', exact: true })).toBeVisible();
  tested.push('Restart confirmation/cancel and per-case reset isolation');

  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByTestId('case-select').selectOption(cases[2].id);
  await page.evaluate(() => window.scrollTo(0, 0));
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), true, 'No mobile horizontal overflow');
  await page.screenshot({ path: new URL(`${label}-mobile.png`, artifactDirectory).pathname, fullPage: true });
  await page.getByTestId(`clue-${cases[2].clues[0].id}`).click();
  await expect(page.getByText(cases[2].clues[0].text, { exact: true })).toBeVisible();
  await page.getByTestId('notes').fill('Mobile investigation works.');
  await page.reload({ waitUntil: 'networkidle' });
  await page.getByTestId('case-select').selectOption(cases[2].id);
  await expect(page.getByTestId('notes')).toHaveValue('Mobile investigation works.');
  tested.push('390px mobile layout, clue interaction and persisted input');

  const assets = await page.locator('script[src], link[rel="stylesheet"], link[rel="icon"]').evaluateAll((nodes) => nodes.map((node) => node.src || node.href));
  assert.ok(assets.length >= 3);
  for (const url of assets) {
    const assetResponse = await context.request.get(url);
    assert.equal(assetResponse.status(), 200, url);
    if (url.endsWith('.js')) assert.match(assetResponse.headers()['content-type'], /javascript/);
    if (url.endsWith('.css')) assert.match(assetResponse.headers()['content-type'], /css/);
  }
  tested.push('Published HTML, JavaScript, CSS and favicon return 200');
  assert.deepEqual(errors, [], 'No browser exceptions');
  assert.deepEqual(failedResponses, [], 'No failed asset responses');
  assert.deepEqual(externalRequests, [], 'No third-party asset requests');
  const report = { baseURL, tested, errors, failedResponses, externalRequests };
  await writeFile(new URL(`${label}-browser-report.json`, artifactDirectory), JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report, null, 2));
} finally {
  await browser.close();
}
