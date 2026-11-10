import { test, expect } from '@playwright/test';
import ExcelJS from 'exceljs';
import { watchErrors, seedSeen } from './helpers';

test('compare UK, Irish, German and US companies in GBP then EUR; differences only; exports', async ({ page }) => {
  const errors = watchErrors(page);
  await seedSeen(page);
  await page.goto('/compare?ids=gb-1,ie-1,de-1,us-1');
  const table = page.locator('[data-compare-table]');
  await expect(table.locator('[data-compare-col]')).toHaveCount(4);
  for (const f of ['GB', 'IE', 'DE', 'US']) await expect(table.locator(`[data-compare-col] [data-flag="${f}"]`)).toBeVisible();
  const raised = table.locator('[data-compare-row="raised"]');
  await expect(raised).toContainText('£');
  await page.locator('[data-currency="EUR"]').click();
  await expect(raised).toContainText('€');
  await expect(raised).not.toContainText('£');
  await expect(page.locator('[data-compare-toolbar]')).toContainText('FX: 1 GBP = 1.17 EUR');
  // best / worst tints
  await expect(raised.locator('[data-tone="best"]')).toHaveCount(1);
  // differences only hides rows whose values are all equal
  const before = await table.locator('[data-compare-row]').count();
  await page.locator('[data-diff-only]').check();
  const after = await table.locator('[data-compare-row]').count();
  expect(after).toBeLessThan(before);
  // exports
  const [x] = await Promise.all([page.waitForEvent('download'), page.locator('[data-export-xlsx]').click()]);
  expect(x.suggestedFilename()).toBe('company-comparison.xlsx');
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.readFile(await x.path());
  expect(wb.worksheets.map((w) => w.name)).toEqual(['Read me', 'Comparison', 'Sources']);
  expect(String(wb.getWorksheet('Read me')!.getCell('B1').value)).toContain('Prototype for client demo');
  const [p] = await Promise.all([page.waitForEvent('download'), page.locator('[data-export-pdf]').click()]);
  expect(p.suggestedFilename()).toBe('company-comparison.pdf');
  expect(errors).toEqual([]);
});

test('compare tray: tick companies in results, compare now, save the comparison', async ({ page }) => {
  const errors = watchErrors(page);
  await seedSeen(page);
  await page.goto('/');
  await page.getByRole('button', { name: /^view all .* companies in/ }).click();
  const checks = page.locator('[data-compare-check]');
  await checks.nth(0).check();
  await checks.nth(1).check();
  await expect(page.locator('[data-compare-tray]')).toContainText('Compare (2/6)');
  await expect(page.locator('[data-compare-button]').first()).toContainText('Compare (2)');
  await page.locator('[data-compare-now]').click();
  await expect(page).toHaveURL(/\/compare\?ids=/);
  await expect(page.locator('[data-compare-col]')).toHaveCount(2);
  // add a company inline, from another country
  await page.locator('[data-compare-add]').first().fill('Tusklab');
  await page.getByRole('button', { name: /Tusklab AG/ }).click();
  await expect(page.locator('[data-compare-col]')).toHaveCount(3);
  await page.getByRole('button', { name: 'Save comparison' }).click();
  await page.goto('/comparisons');
  await expect(page.locator('[data-saved-comparisons] li')).toHaveCount(2);
  // profile header entry point
  await page.goto('/companies/lumen-bank');
  await page.locator('[data-compare-toggle="lumen-bank"]').click();
  await expect(page.locator('[data-compare-tray]')).toContainText('Lumen Bank');
  expect(errors).toEqual([]);
});
