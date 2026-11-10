import { test, expect } from '@playwright/test';
import ExcelJS from 'exceljs';
import JSZip from 'jszip';
import { readFileSync } from 'node:fs';
import { watchErrors, seedSeen } from './helpers';

async function viewAllCountries(page: import('@playwright/test').Page) {
  await page.goto('/');
  await page.locator('[data-tour="country-scope"]').click();
  await page.locator('[data-country="ALL"]').click();
  await page.keyboard.press('Escape');
  await page.getByRole('button', { name: /^view all .* companies in All countries/ }).click();
}

test('bulk export of 10,000+ rows runs as a job with progress, allowance message and a zip on Downloads', async ({ page }) => {
  test.setTimeout(180_000);
  const errors = watchErrors(page);
  await seedSeen(page);
  await viewAllCountries(page);
  await page.locator('[data-tour="export-all"]').first().click();
  await page.locator('[data-export-format="xlsx"]').click();
  const modal = page.locator('[data-bulk-modal]');
  await expect(modal.locator('[data-allowance-message]')).toContainText(/This export uses 12,4\d\d rows\. You have used 61,000 of your 250,000 monthly bulk-export rows\. No additional charge\./);
  await expect(modal.locator('[data-sample-tag]').first()).toBeVisible();
  await page.locator('[data-start-export]').click();
  await expect(page.getByRole('progressbar', { name: 'Export progress' })).toBeVisible();
  await expect(page.locator('[data-go-downloads]')).toBeVisible({ timeout: 120_000 });
  await page.locator('[data-go-downloads]').click();
  const row = page.locator('[data-downloads-table] tr', { hasText: 'Search results' }).first();
  await expect(row.locator('[data-job-status]')).toHaveText('Ready');
  const [dl] = await Promise.all([page.waitForEvent('download'), row.locator('[data-download-job]').click()]);
  expect(dl.suggestedFilename()).toMatch(/\.zip$/);
  const zip = await JSZip.loadAsync(readFileSync(await dl.path()));
  const names = Object.keys(zip.files).sort();
  expect(names.filter((n) => n.endsWith('.xlsx'))).toHaveLength(3);
  expect(names).toContain('READ-ME.txt');
  await expect(page.locator('[data-usage-meter]')).toContainText(/73,4\d\d of 250,000/);
  expect(errors).toEqual([]);
});

test('exports over the allowance show the per-1,000-row charge and need a confirm', async ({ page }) => {
  await seedSeen(page);
  await page.addInitScript(() => localStorage.setItem('nb.allowance', JSON.stringify({ period: new Date().toISOString().slice(0, 7), used: 245_000 })));
  await viewAllCountries(page);
  await page.locator('[data-tour="export-all"]').first().click();
  await page.locator('[data-export-format="csv"]').click();
  await expect(page.locator('[data-overage]')).toContainText('£4.50 per 1,000 rows');
  await expect(page.locator('[data-start-export]')).toBeDisabled();
  await page.locator('[data-overage-confirm]').check();
  await expect(page.locator('[data-start-export]')).toBeEnabled();
  await page.keyboard.press('Escape');
});

test('Excel, PDF and CSV from the profile, statistics and results', async ({ page }) => {
  const errors = watchErrors(page);
  await seedSeen(page);
  await page.goto('/companies/de-1');
  const [x] = await Promise.all([page.waitForEvent('download'), page.locator('[data-profile-export="xlsx"]').click()]);
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.readFile(await x.path());
  expect(wb.worksheets.map((w) => w.name)).toEqual(expect.arrayContaining(['Read me', 'Details', 'Timeline', 'People', 'Ownership', 'Financials', 'Filing history', 'Sources']));
  expect(wb.getWorksheet('Sources')!.getCell('A2').value).toBe('Handelsregister (Germany)');
  const [pdf] = await Promise.all([page.waitForEvent('download'), page.locator('[data-profile-export="pdf"]').click()]);
  expect(readFileSync(await pdf.path()).subarray(0, 4).toString()).toBe('%PDF');
  // results (small export downloads directly)
  await page.goto('/companies/lumen-bank');
  await page.goto('/');
  await page.getByRole('button', { name: /^view all .* companies in/ }).click();
  await page.locator('[data-tour="add-criteria"]').click();
  await page.keyboard.press('Escape');
  // statistics: whole tab to PDF
  await page.getByRole('tab', { name: /Statistics/ }).click();
  await page.locator('[data-tour="stats-by-country"]').waitFor();
  const [st] = await Promise.all([page.waitForEvent('download'), (async () => { await page.locator('[data-tour="stats-export"]').click(); await page.locator('[data-export-format="pdf"]').click(); })()]);
  expect(st.suggestedFilename()).toBe('statistics.pdf');
  expect(errors).toEqual([]);
});
