import { test, expect } from '@playwright/test';
import { watchErrors, seedSeen } from './helpers';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const NOTICE = 'Prototype for client demo. All data shown is sample data.';

const ROUTES = ['/', '/companies/lumen-bank', '/companies/lumen-bank/financials', '/tender-coverage', '/account', '/plan'];

test('prototype banner, footer notice and title suffix on every route', async ({ page }) => {
  const errors = watchErrors(page);
  await seedSeen(page);
  for (const r of ROUTES) {
    await page.goto(r);
    await expect(page.locator('[data-prototype-banner]')).toHaveText(NOTICE);
    await expect(page.locator('[data-footer-notice]')).toHaveText(NOTICE);
    await expect(page).toHaveTitle(/Prototype for client demo/);
  }
  // banner stays visible while scrolling
  await page.goto('/companies/lumen-bank');
  await page.mouse.wheel(0, 2000);
  await expect(page.locator('[data-prototype-banner]')).toBeInViewport();
  expect(errors).toEqual([]);
});

test('tender coverage: every built "Show me" link opens a real screen', async ({ page }) => {
  const errors = watchErrors(page);
  await seedSeen(page);
  await page.goto('/tender-coverage');
  const links = page.locator('[data-show-me]');
  await links.first().waitFor();
  const n = await links.count();
  expect(n).toBeGreaterThan(30);
  const hrefs: string[] = [];
  for (let i = 0; i < n; i++) {
    const row = links.nth(i).locator('xpath=ancestor::tr');
    const status = await row.locator('td').nth(4).innerText();
    if (status !== 'Planned') hrefs.push((await links.nth(i).getAttribute('href'))!);
  }
  for (const h of hrefs) {
    await page.goto(h);
    await expect(page.locator('[data-not-found]')).toHaveCount(0);
  }
  expect(errors).toEqual([]);
});

test('account and plan pages show licences and Sample-tagged allowance', async ({ page }) => {
  await seedSeen(page);
  await page.goto('/account');
  await expect(page.locator('[data-licences]')).toContainText('30 of 30 assigned · Full access for all users');
  await page.goto('/plan');
  await page.locator('[data-sample-tag]').first().waitFor();
  expect(await page.locator('[data-sample-tag]').count()).toBeGreaterThan(5);
  await expect(page.getByText('250,000 rows per month')).toBeVisible();
});

test('no hardcoded deployment domain in src', () => {
  const offenders: string[] = [];
  const walk = (d: string) => readdirSync(d).forEach((f) => {
    const p = join(d, f);
    if (statSync(p).isDirectory()) return walk(p);
    if (!/\.(ts|tsx)$/.test(f)) return;
    const s = readFileSync(p, 'utf8');
    if (/https?:\/\/(localhost|[a-z0-9-]+\.(netlify|vercel)\.app|(north)?beam\.)/i.test(s)) offenders.push(p);
  });
  walk('src');
  expect(offenders).toEqual([]);
});
