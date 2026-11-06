import builder from './builder.mjs';
export default async function (page) {
  await builder(page);
  await page.click('[data-tour="search-button"]');
  await page.click('[data-tour="tab-statistics"]');
  await page.waitForSelector('[data-tour="stats-subtabs"]');
  await page.waitForTimeout(1200);
}
