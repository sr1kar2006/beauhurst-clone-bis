import { test, expect } from '@playwright/test';
import { watchErrors, seedSeen } from './helpers';

test('monitor a company, simulate events, bell count increases, inbox and email preview', async ({ page }) => {
  const errors = watchErrors(page);
  await seedSeen(page);
  await page.goto('/companies/de-1');
  await page.locator('[data-monitor="de-1"]').click();
  await expect(page.locator('[data-monitor="de-1"]')).toContainText('Monitoring');
  const before = Number((await page.locator('[data-bell-count]').textContent()) ?? 0);
  await page.goto('/tender-coverage');
  await page.locator('[data-simulate-events]').click();
  await expect(page.getByRole('status').filter({ hasText: 'new alerts generated' })).toBeVisible();
  const after = Number(await page.locator('[data-bell-count]').textContent());
  expect(after).toBeGreaterThan(before);
  await page.locator('[data-bell]').click();
  await expect(page.getByRole('dialog').getByText(/Tusklab AG/).first()).toBeVisible();
  await page.getByRole('link', { name: 'Open inbox' }).click();
  await expect(page.locator('[data-alerts-table]')).toContainText('Tusklab AG');
  await page.getByRole('button', { name: 'Mark shown as read' }).click();
  await expect(page.locator('[data-bell-count]')).toHaveCount(0);
  // rule editing: switch on simulated email and preview it
  await page.goto('/monitoring');
  await page.locator('[data-edit-rule="de-1"]').click();
  await page.locator('[data-rule-email]').check();
  await page.locator('[data-save-rule]').click();
  await page.locator('[data-rule="de-1"] [data-email-preview]').click();
  await expect(page.locator('[data-email-body]')).toContainText('Tusklab AG');
  expect(errors).toEqual([]);
});

test('news: categories with source links on the company page and a global news page with filters and saved searches', async ({ page }) => {
  const errors = watchErrors(page);
  await seedSeen(page);
  await page.goto('/companies/lumen-bank/news');
  await page.locator('[data-category="Financial results"]').click();
  const first = page.locator('[data-news-table] [data-article]').first();
  await expect(first).toContainText('Financial results');
  await expect(first.locator('[data-source-link]')).toHaveAttribute('target', '_blank');
  await page.goto('/news');
  await page.locator('[data-category="Insolvency & administration"]').click();
  await expect(page.locator('[data-news-table] [data-article]').first()).toContainText('Insolvency & administration');
  await page.locator('[data-save-news-search]').click();
  await expect(page.locator('[data-news-searches] li')).toHaveCount(2);
  expect(errors).toEqual([]);
});
