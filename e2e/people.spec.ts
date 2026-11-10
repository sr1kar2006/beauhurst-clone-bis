import { test, expect } from '@playwright/test';
import { watchErrors, seedSeen } from './helpers';

test('people search → person profile with appointments, other positions, Gantt and network', async ({ page }) => {
  const errors = watchErrors(page);
  await seedSeen(page);
  await page.goto('/?find=people');
  await expect(page.locator('[data-tour="entity-select"]')).toContainText('people');
  await page.locator('[data-tour="add-criteria"]').click();
  await page.getByRole('button', { name: 'Appointments' }).click();
  await page.locator('[data-tour="criterion-p-num-current"]').click();
  await page.getByLabel(/min/i).first().fill('3');
  await page.keyboard.press('Escape');
  await page.locator('[data-tour="search-button"]').click();
  const results = page.locator('[data-people-results]');
  await expect(results).toContainText(/[\d,]+ people/);
  const first = results.locator('[data-person-row]').first();
  await expect(first.locator('td').nth(2)).not.toHaveText(/^[012]$/);
  // hover mini card
  await first.locator('[data-person-link]').hover();
  await expect(first.locator('[data-person-card]')).toContainText(/Director at \d+ compan/);
  await first.locator('[data-person-link]').click();
  await expect(page).toHaveURL(/\/people\/p\d+/);
  await expect(page.locator('[data-person-header]')).toContainText('Born');
  expect(await page.locator('[data-current-appointments] tbody tr').count()).toBeGreaterThanOrEqual(3);
  await expect(page.locator('[data-previous-appointments]')).toBeVisible();
  await expect(page.locator('[data-other-positions]')).toBeVisible();
  await expect(page.locator('canvas').first()).toBeVisible();
  await expect(page.locator('[data-network-graph] [data-node="company"]').first()).toBeVisible();
  await page.locator('[data-network-toggle]').click();
  await expect(page.locator('[data-network-list] li').first()).toBeVisible();
  const [dl] = await Promise.all([page.waitForEvent('download'), (async () => { await page.getByRole('button', { name: 'Export' }).click(); await page.locator('[data-export-format="xlsx"]').click(); })()]);
  expect(dl.suggestedFilename()).toMatch(/^person-p\d+\.xlsx$/);
  expect(errors).toEqual([]);
});

test('person names link everywhere: profile people, timeline and filings', async ({ page }) => {
  const errors = watchErrors(page);
  await seedSeen(page);
  await page.goto('/companies/gb-1/people');
  await expect(page.locator('[data-section="people"] [data-person-link]').first()).toBeVisible();
  await page.goto('/companies/gb-1/timeline');
  await expect(page.locator('[data-section="timeline"] [data-person-link]').first()).toBeVisible();
  await page.goto('/companies/gb-1/filing-history');
  await page.locator('[data-section="filing-history"] [data-person-link]').first().click();
  await expect(page).toHaveURL(/\/people\/p\d+/);
  await expect(page.locator('[data-current-appointments], [data-previous-appointments]').first()).toBeVisible();
  expect(errors).toEqual([]);
});

test('previous directors criterion on company search', async ({ page }) => {
  await seedSeen(page);
  await page.goto('/');
  await page.locator('[data-tour="add-criteria"]').click();
  await page.locator('[data-tour="group-people"]').click();
  await expect(page.locator('[data-tour="criterion-previous-directors"]')).toBeVisible();
});
