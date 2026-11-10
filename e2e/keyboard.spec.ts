import { test, expect } from '@playwright/test';
import { watchErrors, seedSeen } from './helpers';

/** Keyboard-only journeys: no mouse clicks. Controls are reached with Tab or focus() and operated with Enter, Space, arrows and Esc. */
const press = async (page: import('@playwright/test').Page, selector: string, key = 'Enter') => { await page.locator(selector).first().focus(); await page.keyboard.press(key); };

test('keyboard: skip link, build a search, open a profile, export, compare', async ({ page }) => {
  const errors = watchErrors(page);
  await seedSeen(page);
  await page.goto('/');
  // skip link is the first stop
  await page.keyboard.press('Tab');
  await expect(page.locator('[data-skip-link]')).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.locator('#main-content')).toBeFocused();

  // build a search: countries via the combobox, then an Active status criterion
  await press(page, '[data-tour="country-scope"]');
  const combo = page.getByRole('combobox', { name: 'Search countries' });
  await expect(combo).toBeFocused();
  await page.keyboard.press('ArrowDown'); // United Kingdom
  await page.keyboard.press('Enter'); // untick UK
  await page.keyboard.press('Escape');
  await expect(page.locator('[data-tour="country-scope"]')).toContainText('Ireland');
  await press(page, '[data-tour="add-criteria"]');
  await press(page, '[data-tour="group-companies-house"]');
  await press(page, '[data-tour="criterion-ch-status"]');
  await page.keyboard.type('Active');
  await press(page, '[data-tour="list-item-active"] input', 'Space');
  await press(page, '[data-tour="list-ok"]');
  await press(page, '[data-tour="search-button"]');
  await expect(page.locator('[data-tour="results-summary"]')).toContainText(/[\d,]+ companies/);

  // open a profile and a section
  await press(page, '[data-company-link]');
  await expect(page).toHaveURL(/\/companies\//);
  await press(page, '[data-section-nav] [data-tour="nav-financials"]');
  await expect(page.locator('[data-section="financials"]')).toBeVisible();

  // export (Excel) with the keyboard
  const [dl] = await Promise.all([page.waitForEvent('download'), press(page, '[data-profile-export="xlsx"]')]);
  expect(dl.suggestedFilename()).toMatch(/profile\.xlsx$/);

  // compare: add this company, add another, open the comparison, switch currency
  await press(page, '[data-compare-toggle]', 'Space');
  await page.goto('/companies/de-1');
  await press(page, '[data-compare-toggle="de-1"]', 'Enter');
  await press(page, '[data-compare-now]');
  await expect(page).toHaveURL(/\/compare\?ids=/);
  await press(page, '[data-currency="EUR"]');
  await expect(page.locator('[data-currency="EUR"]')).toHaveAttribute('aria-pressed', 'true');
  // shortcuts overlay
  await page.locator('body').focus();
  await page.keyboard.press('?');
  await expect(page.locator('[data-shortcuts]')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.locator('[data-shortcuts]')).toHaveCount(0);
  expect(errors).toEqual([]);
});

test('charts offer a View as table alternative; reduced motion is honoured', async ({ page }) => {
  await seedSeen(page);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  await page.getByRole('button', { name: /^view all .* companies in/ }).click();
  await page.getByRole('tab', { name: /Statistics/ }).click();
  const card = page.locator('[data-tour="stats-by-country"]');
  await card.locator('[data-view-table]').focus();
  await page.keyboard.press('Enter');
  await expect(card.locator('[data-chart-table]')).toContainText('United Kingdom');
  const duration = await page.evaluate(() => getComputedStyle(document.body).transitionDuration);
  expect(['0s', '1e-06s', '0.000001s']).toContain(duration);
});

test('help centre: search, article, PDF user guide, support SLAs, accessibility statement', async ({ page }) => {
  const errors = watchErrors(page);
  await seedSeen(page);
  await page.goto('/help');
  await page.locator('[data-help-search]').fill('compare');
  await expect(page.locator('[data-help-articles] li').first()).toContainText('Comparing companies');
  const [pdf] = await Promise.all([page.waitForEvent('download'), page.locator('[data-user-guide]').click()]);
  expect(pdf.suggestedFilename()).toBe('user-guide.pdf');
  await page.locator('[data-help-articles] a').first().click();
  await expect(page).toHaveURL(/\/help\//);
  await page.goto('/support');
  await expect(page.locator('[data-sla-table]')).toContainText('P1');
  await expect(page.locator('[data-sample-tag]').first()).toBeVisible();
  await page.goto('/accessibility');
  await expect(page.locator('[data-a11y-statement]')).toContainText('WCAG');
  expect(errors).toEqual([]);
});
