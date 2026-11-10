import { test, expect } from '@playwright/test';
import { watchErrors, seedSeen } from './helpers';

test('data sources page: six tabs, deep link to a source card, coverage matrix', async ({ page }) => {
  const errors = watchErrors(page);
  await seedSeen(page);
  await page.goto('/data-sources#companies-house');
  await expect(page.locator('[data-source-card="companies-house"]')).toBeVisible();
  for (const tab of ['coverage', 'freshness', 'qa', 'limitations', 'corrections', 'sources']) {
    await page.locator(`[data-ds-tab="${tab}"]`).click();
    await expect(page.locator(`[data-ds-tab="${tab}"]`)).toHaveAttribute('aria-selected', 'true');
    await expect(page.locator(`#panel-${tab}`)).toBeVisible();
  }
  await page.locator('[data-ds-tab="coverage"]').click();
  await expect(page.locator('[data-cell="accounts:GB"]')).toContainText(/from \d{4}/);
  await expect(page.locator('[data-coverage-matrix] [data-sample-tag], [data-sample-tag]').first()).toBeVisible();
  await page.locator('[data-ds-tab="qa"]').click();
  await expect(page.locator('[data-qa-steps] > li')).toHaveCount(6);
  expect(errors).toEqual([]);
});

test('every profile card shows a source footer; key values have keyboard-operable provenance popovers', async ({ page }) => {
  const errors = watchErrors(page);
  await seedSeen(page);
  for (const path of ['/companies/lumen-bank', '/companies/lumen-bank/details', '/companies/de-1/financials', '/companies/lumen-bank/people']) {
    await page.goto(path);
    await page.locator('[data-section] [data-source-footer]').first().waitFor();
    const cards = await page.locator('[data-section] section.rounded-card').count();
    const footers = await page.locator('[data-section] [data-source-footer]').count();
    expect(footers, path).toBe(cards);
  }
  await page.goto('/companies/lumen-bank/financials');
  const info = page.locator('[data-provenance="Turnover"]').first();
  await info.focus();
  await page.keyboard.press('Enter');
  const pop = page.getByRole('document', { name: 'Provenance of Turnover' });
  await expect(pop).toBeVisible();
  await expect(pop).toContainText('Companies House');
  await expect(pop.locator('[data-confidence]')).toHaveText(/Verified|Estimated|Modelled/);
  await page.keyboard.press('Escape');
  await expect(pop).toHaveCount(0);
  // footer source link opens the source card
  await page.locator('[data-source-footer] a').first().click();
  await expect(page).toHaveURL(/\/data-sources#/);
  await expect(page.locator('[data-source-card]')).toBeVisible();
  expect(errors).toEqual([]);
});

test('reporting an error shows it under My reported issues', async ({ page }) => {
  await seedSeen(page);
  await page.goto('/companies/lumen-bank');
  await page.getByRole('button', { name: 'Report an issue' }).click();
  await page.getByRole('dialog', { name: 'Report an issue' }).locator('textarea').fill('Registered address is out of date.');
  await page.getByRole('dialog', { name: 'Report an issue' }).getByRole('button', { name: 'Submit' }).click();
  await page.goto('/data-sources#corrections');
  await expect(page.locator('[data-issues-table]')).toContainText('Registered address is out of date.');
  await expect(page.locator('[data-issues-table]')).toContainText('Received');
});
