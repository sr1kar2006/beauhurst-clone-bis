export default async function (page) {
  await page.screenshot({ path: 'e2e-shots/sticky-search-top.png' });
  await page.getByRole('button', { name: /view all/ }).click();
  await page.evaluate(() => window.scrollTo(0, 900));
  await page.waitForTimeout(300);
  await page.screenshot({ path: 'e2e-shots/sticky-search-scrolled.png' });
  await page.goto('http://localhost:5173/companies/lumen-bank/timeline');
  await page.waitForSelector('[data-section]');
  await page.evaluate(() => window.scrollTo(0, 1200));
  await page.waitForTimeout(500);
}
