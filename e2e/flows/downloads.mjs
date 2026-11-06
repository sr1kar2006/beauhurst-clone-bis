import stats from './stats.mjs';
import fs from 'node:fs';

async function grab(page, clickMenu, itemText) {
  await clickMenu();
  const [dl] = await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name: itemText, exact: true }).click()]);
  const p = await dl.path();
  const size = fs.statSync(p).size;
  const head = fs.readFileSync(p).subarray(0, 60).toString('latin1').replace(/\s+/g, ' ');
  console.log(`${itemText.padEnd(4)} ${dl.suggestedFilename()} ${size} bytes :: ${head.slice(0, 50)}`);
}

export default async function (page) {
  await stats(page);
  const card = page.locator('section', { hasText: 'Company foundations and cessations over time' }).first();
  const menu = () => card.getByRole('button', { name: /Download/ }).click();
  await grab(page, menu, 'PNG');
  await grab(page, menu, 'SVG');
  await grab(page, menu, 'CSV');
  // results CSV export
  await page.click('[data-tour="tab-results"]');
  const [dl] = await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name: 'Export results to a CSV' }).first().click()]);
  const lines = fs.readFileSync(await dl.path(), 'utf8').trim().split('\n').length;
  console.log(`results CSV ${dl.suggestedFilename()} rows=${lines - 1}`);
  // fundraisings sub-tab
  await page.click('[data-tour="tab-statistics"]');
  await page.getByRole('tab', { name: 'Fundraisings' }).click();
  await page.waitForTimeout(800);
  await page.locator('[data-tour="stats-subtabs"]').scrollIntoViewIfNeeded();
  await page.evaluate(() => window.scrollBy(0, 400));
}
