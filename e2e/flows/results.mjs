import builder from './builder.mjs';
export default async function (page) {
  await builder(page);
  await page.click('[data-tour="search-button"]');
  await page.waitForSelector('[data-tour="results-table"]');
  await page.evaluate(() => window.scrollTo(0, 470));
}
