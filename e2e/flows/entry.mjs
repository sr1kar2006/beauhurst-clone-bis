import builder from './builder.mjs';
export default async function (page) {
  await builder(page);
  await page.click('[data-tour="search-button"]');
  await page.waitForSelector('[data-view-profile]');
  await page.evaluate(() => window.scrollTo(0, 560));
  await page.waitForTimeout(300);
  await page.screenshot({ path: 'e2e-shots/profile/results-row-buttons.png' });
  await page.locator('[data-view-profile]').nth(2).click();
  await page.waitForSelector('[data-section]');
  await page.waitForTimeout(500);
  await page.screenshot({ path: 'e2e-shots/profile/generated-summary.png' });
  await page.click('[data-tour="nav-company-profile"]');
  await page.waitForTimeout(300);
}
