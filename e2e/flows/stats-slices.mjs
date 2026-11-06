import stats from './stats.mjs';
export default async function (page) {
  await stats(page);
  const h = await page.evaluate(() => document.body.scrollHeight);
  let i = 0;
  for (let y = 0; y < h; y += 950) {
    await page.evaluate((yy) => window.scrollTo(0, yy), y);
    await page.waitForTimeout(250);
    await page.screenshot({ path: `e2e-shots/m6-stats-${i++}.png` });
  }
}
