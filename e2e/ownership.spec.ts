import { test, expect } from '@playwright/test';
import { watchErrors, seedSeen } from './helpers';

test('ownership: chain to UBO with %, PSC nature of control, subsidiaries, historic compare; tree shows %', async ({ page }) => {
  const errors = watchErrors(page);
  await seedSeen(page);
  await page.goto('/companies/de-1/ownership');
  const chain = page.locator('[data-ownership-chain]');
  await expect(chain).toBeVisible();
  await expect(chain).toContainText(/\d+% held/);
  await expect(page.locator('[data-psc-table]')).toContainText('Ownership of shares: more than');
  // historic ownership: compare two dates
  const dates = page.locator('[data-compare-dates] select');
  await dates.first().selectOption({ index: 0 });
  await expect(page.locator('[data-compare-dates]')).toContainText('changed holders');
  // the parent's page lists this company as a subsidiary
  await chain.locator('a').first().click();
  await expect(page).toHaveURL(/\/companies\//);
  await page.goto('/companies/de-1/corporate-structure');
  await expect(page.locator('[data-edge-pct]').first()).toContainText('% held');
  // Lumen Bank PSCs (significant influence)
  await page.goto('/companies/lumen-bank/ownership');
  await expect(page.locator('[data-psc-table]')).toContainText('Significant influence or control');
  expect(errors).toEqual([]);
});

test('risk criteria in the picker: insolvency status = Liquidation, and turnover in a chosen year', async ({ page }) => {
  const errors = watchErrors(page);
  await seedSeen(page);
  await page.goto('/');
  await page.locator('[data-tour="add-criteria"]').click();
  await page.locator('[data-tour="group-risk"]').click();
  await page.locator('[data-tour="criterion-insolvency-status"]').click();
  await page.locator('[data-tour="list-item-liquidation"]').click();
  await page.locator('[data-tour="list-ok"]').click();
  await page.locator('[data-tour="add-criteria"]').click();
  await page.locator('[data-tour="group-financial-accounts"]').click();
  await page.locator('[data-tour="criterion-fin-turnover"]').click();
  await page.getByLabel('Turnover year').selectOption('2022');
  await page.locator('[data-tour="search-button"]').click();
  await expect(page.locator('[data-tour="results-summary"]')).toContainText(/[\d,]+ companies/);
  await page.locator('[data-results-view="analyse"]').click();
  await page.locator('[data-column-picker]').click();
  await page.getByRole('checkbox', { name: 'Insolvency status' }).check();
  await page.keyboard.press('Escape');
  await expect(page.locator('[data-analysis-grid] tbody')).toContainText('Liquidation');
  expect(errors).toEqual([]);
});
