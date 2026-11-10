import { test, expect } from '@playwright/test';
import { watchErrors, seedSeen } from './helpers';

test('a 20-year-old company shows 20 years of financials with a year selector and available-from badges', async ({ page }) => {
  const errors = watchErrors(page);
  await seedSeen(page);
  await page.goto('/companies/c144/financials');
  await expect(page.locator('[data-available-from]')).toContainText(/Data available from \d{4}/);
  const pl = page.locator('[data-fin-table="pl"]');
  await expect(pl.locator('[data-year-col]')).toHaveCount(2);
  await page.locator('[data-years="10"]').click();
  await expect(pl.locator('[data-year-col]')).toHaveCount(10);
  await page.locator('[data-years="all"]').click();
  await expect(pl.locator('[data-year-col]')).toHaveCount(20);
  await expect(page.getByRole('button', { name: 'Download all 20 years (CSV)' })).toBeVisible();
  await page.goto('/companies/c144/ownership');
  await expect(page.locator('[data-available-from]')).toBeVisible();
  expect(errors).toEqual([]);
});
