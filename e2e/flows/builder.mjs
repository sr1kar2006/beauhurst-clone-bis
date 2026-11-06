// Drives the builder through the demo query, saving screenshots along the way.
const t = (k) => `[data-tour="${k}"]`;
export default async function (page) {
  const shot = (n) => page.screenshot({ path: `e2e-shots/${n}.png` });
  await page.click(t('add-criteria'));
  await page.click(t('group-what-the-company-does'));
  await shot('m3-picker');
  await page.click(t('criterion-industries'));
  await page.click(t('ind-group-software'));
  await page.click(t('ind-item-artificial-intelligence'));
  await shot('m4-industries-modal');
  await page.click(t('ind-confirm'));
  await page.click(t('add-criteria'));
  await page.click(t('group-companies-house'));
  await page.click(t('criterion-ch-status'));
  await shot('m4-list-popover');
  await page.click(t('list-item-active'));
  await page.click(t('list-ok'));
  await page.click(t('add-criteria'));
  await page.click(t('criterion-signals'));
  await page.click(t('tree-expand-growth'));
  await page.click(t('tree-item-growth:equity-fundraising'));
  await page.click(t('tree-item-growth:20-scaleup'));
  await shot('m4-tree-popover');
  await page.click(t('tree-confirm'));
  await page.waitForTimeout(200);
}
