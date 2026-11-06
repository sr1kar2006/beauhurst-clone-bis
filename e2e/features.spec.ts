import { test, expect } from '@playwright/test';
import type { Page } from '@playwright/test';

const t = (k: string) => `[data-tour="${k}"]`;

async function fresh(page: Page) {
  const errors: string[] = [];
  page.on('console', (m) => m.type() === 'error' && !/tile\.openstreetmap/.test(m.text()) && errors.push(m.text()));
  page.on('pageerror', (e) => errors.push(String(e)));
  await page.addInitScript(() => { try { localStorage.setItem('nb.tourSeen', 'true'); } catch { /* */ } });
  await page.goto('/');
  return errors;
}

/** Build the demo query through the UI. */
async function buildDemo(page: Page) {
  await page.click(t('add-criteria'));
  await page.click(t('group-what-the-company-does'));
  await page.click(t('criterion-industries'));
  await page.click(t('ind-group-software'));
  await page.click(t('ind-item-artificial-intelligence'));
  await page.click(t('ind-confirm'));
  await page.click(t('add-criteria'));
  await page.click(t('group-companies-house'));
  await page.click(t('criterion-ch-status'));
  await page.click(t('list-item-active'));
  await page.click(t('list-ok'));
  await page.click(t('add-criteria'));
  await page.click(t('criterion-signals'));
  await page.click(t('tree-expand-growth'));
  await page.click(t('tree-item-growth:equity-fundraising'));
  await page.click(t('tree-item-growth:20-scaleup'));
  await page.click(t('tree-confirm'));
}

test('builder: all/any, remove, empty values, entity switch', async ({ page }) => {
  const errors = await fresh(page);
  await buildDemo(page);
  await expect(page.locator(t('row-ch-status'))).toContainText('and');
  await page.getByLabel('Match all or any').selectOption('any');
  await expect(page.locator(t('row-ch-status'))).toContainText('or');
  await page.getByLabel('Match all or any').selectOption('all');
  // an empty row is ignored by the query
  await page.click(t('add-criteria'));
  await page.click(t('criterion-location'));
  await page.keyboard.press('Escape');
  await expect(page.locator(t('value-location'))).toHaveText('None selected');
  await page.click(t('search-button'));
  await expect(page.locator(t('results-summary'))).toContainText(/1,\d{3} companies/);
  await page.getByRole('button', { name: 'Remove Location' }).click();
  // entity switch relabels the buttons
  await page.click(t('entity-select'));
  await page.getByRole('button', { name: /German legal entities/ }).click();
  await expect(page.locator(t('search-button'))).toHaveText(/Search for German legal entities/);
  await expect(page.locator(t('add-criteria'))).toHaveText(/Add German legal entity criteria/);
  expect(errors).toEqual([]);
});

test('picker search highlights and tracked-only toggle hides criteria', async ({ page }) => {
  await fresh(page);
  await page.click(t('add-criteria'));
  await page.getByLabel('Search for criteria').fill('status');
  await expect(page.locator('mark.nb-hl').first()).toHaveText(/status/i);
  await expect(page.locator(t('criterion-ch-status'))).toBeVisible();
  await page.getByLabel('Search for criteria').fill('');
  await page.getByRole('button', { name: 'Expand all' }).click();
  await expect(page.locator(t('criterion-turnover'))).toBeVisible();
  await page.getByText('Include tracked-only criteria').click();
  await expect(page.locator(t('criterion-turnover'))).toHaveCount(0);
  await page.keyboard.press('Escape');
  await expect(page.locator(t('criteria-picker'))).toHaveCount(0);
});

test('results: sort, paginate, page size, columns, collections, CSV', async ({ page }) => {
  const errors = await fresh(page);
  await buildDemo(page);
  await page.click(t('search-button'));
  const firstName = () => page.locator('[data-company-link]').first().textContent();
  expect(await firstName()).toMatch(/^\d/); // numbers first
  await page.click(t('sort-fundraisingTotal'));
  const top = await firstName();
  await page.click(t('sort-fundraisingTotal'));
  expect(await firstName()).not.toBe(top);
  await page.getByRole('button', { name: '2', exact: true }).first().click();
  await expect(page.getByRole('button', { name: '2', exact: true }).first()).toHaveAttribute('aria-current', 'page');
  await page.getByLabel('Results per page').first().selectOption('50');
  await expect(page.locator('[role="table"] > [role="row"]')).toHaveCount(51);
  // column editor
  await page.click(t('column-editor'));
  await page.getByText('Turnover', { exact: true }).click();
  await expect(page.getByRole('columnheader', { name: /Turnover/ })).toBeVisible();
  await page.keyboard.press('Escape');
  // add all results to a new collection
  await page.getByRole('button', { name: 'Add to collection' }).first().click();
  await page.getByText('Create a new collection').click();
  await page.getByLabel('Collection name').fill('Demo AI list');
  await page.getByRole('dialog', { name: 'Add to collection' }).getByRole('button', { name: 'Save', exact: true }).click();
  await expect(page.getByRole('dialog', { name: 'Add to collection' })).toContainText(/Added 1,\d{3} companies to Demo AI list/);
  await page.getByRole('button', { name: 'Done' }).click();
  // the new collection is now usable as a criterion
  await page.click(t('add-criteria'));
  await page.click(t('criterion-collections'));
  await expect(page.locator(t('list-popover'))).toContainText('Demo AI list');
  await page.keyboard.press('Escape');
  // profile drawer
  await page.getByRole('button', { name: /^Quick view/ }).first().click();
  await expect(page.getByRole('dialog', { name: /profile/ })).toBeVisible();
  await page.screenshot({ path: 'e2e-shots/m8-profile-drawer.png' });
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog', { name: /profile/ })).toHaveCount(0);
  expect(errors).toEqual([]);
});

test('save, open, reset and URL state', async ({ page }) => {
  const errors = await fresh(page);
  await buildDemo(page);
  await page.getByRole('button', { name: 'Save search' }).click();
  await page.getByRole('dialog', { name: 'Save search' }).getByRole('textbox').fill('Active AI scaleups');
  await page.getByRole('dialog', { name: 'Save search' }).getByRole('button', { name: 'Save' }).click();
  await page.getByRole('button', { name: 'Done' }).click();

  const url = page.url();
  expect(url).toContain('?q=');

  await page.getByRole('button', { name: 'Reset search' }).click();
  await expect(page.locator(t('row-industries'))).toHaveCount(0);
  expect(page.url()).not.toContain('?q=');

  await page.getByRole('button', { name: 'Open search' }).click();
  await expect(page.getByRole('dialog', { name: 'Open search' })).toContainText('3 criteria');
  await page.getByRole('button', { name: /^Active AI scaleups Saved/ }).click();
  await expect(page.locator(t('value-signals'))).toHaveText('2 selected');
  await expect(page.locator(t('results-summary'))).toContainText(/1,\d{3} companies/);

  // a shared link restores the builder and its results
  const p2 = await page.context().newPage();
  await p2.goto(url);
  await expect(p2.locator(t('value-industries'))).toHaveText('Artificial Intelligence');
  await expect(p2.locator(t('results-summary'))).toContainText(/1,\d{3} companies/);
  await expect(p2.locator('[data-tour-tooltip]')).toHaveCount(0);
  expect(errors).toEqual([]);
});

test('other tabs render and Esc closes the top-most layer only', async ({ page }) => {
  const errors = await fresh(page);
  await buildDemo(page);
  await page.click(t('search-button'));
  await page.click(t('tab-activity'));
  await expect(page.getByText(/updates$/)).toBeVisible();
  await page.screenshot({ path: 'e2e-shots/m8-activity.png' });
  await page.click(t('tab-news'));
  await expect(page.locator('article').first()).toBeVisible();
  await page.screenshot({ path: 'e2e-shots/m8-news.png' });
  await page.click(t('tab-map'));
  await expect(page.locator('.leaflet-container')).toBeVisible();
  await expect(page.locator('.marker-cluster').first()).toBeVisible();
  await page.waitForTimeout(1500);
  await page.screenshot({ path: 'e2e-shots/m8-map.png' });

  // Esc layering: open the collection modal from a profile drawer, Esc closes only the modal
  await page.click(t('tab-results'));
  await page.getByRole('button', { name: /^Quick view/ }).first().click();
  await page.getByRole('dialog', { name: /profile/ }).getByRole('button', { name: 'Add to collection' }).click();
  await expect(page.getByRole('dialog', { name: 'Add to collection' })).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog', { name: 'Add to collection' })).toHaveCount(0);
  await expect(page.getByRole('dialog', { name: /profile/ })).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog', { name: /profile/ })).toHaveCount(0);

  // focus is trapped in modals
  await page.getByRole('button', { name: 'Save search' }).click();
  for (let i = 0; i < 8; i++) await page.keyboard.press('Tab');
  const inside = await page.evaluate(() => !!document.activeElement?.closest('[aria-label="Save search"]'));
  expect(inside).toBe(true);
  expect(errors).toEqual([]);
});
