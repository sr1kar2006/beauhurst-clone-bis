import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { seedSeen } from './helpers';

export const ALL_ROUTES = [
  '/', '/?find=people', '/companies/lumen-bank', '/companies/lumen-bank/details', '/companies/lumen-bank/timeline', '/companies/lumen-bank/recent-activity',
  '/companies/lumen-bank/transactions', '/companies/lumen-bank/people', '/companies/lumen-bank/ownership', '/companies/lumen-bank/corporate-structure',
  '/companies/lumen-bank/commodity-trade', '/companies/lumen-bank/financials', '/companies/lumen-bank/filing-history', '/companies/lumen-bank/news',
  '/companies/lumen-bank/similar-companies', '/companies/de-1/ownership', '/people/p4', '/compare?ids=gb-1,ie-1,de-1,us-1', '/comparisons', '/reports', '/reports/rep-demo',
  '/reports/new', '/downloads', '/data-sources', '/data-sources#coverage', '/data-sources#qa', '/data-sources#corrections', '/account', '/plan', '/tender-coverage',
  '/admin/users', '/admin/usage', '/admin/audit', '/news', '/alerts', '/monitoring', '/help', '/help/getting-started', '/support', '/accessibility',
  '/whats-new', '/status', '/governance',
];

for (const route of ALL_ROUTES) {
  test(`axe: no serious or critical violations on ${route}`, async ({ page }) => {
    await seedSeen(page);
    await page.goto(route);
    await page.waitForLoadState('networkidle');
    await page.locator('main [data-page], main [data-section], main [data-tour="query-builder"], main h1').first().waitFor({ timeout: 20_000 }).catch(() => {});
    await page.waitForTimeout(500);
    const res = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']).exclude('.leaflet-container').analyze();
    const bad = res.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical');
    const summary = bad.map((v) => `${v.id} (${v.impact}) x${v.nodes.length}: ${v.nodes.slice(0, 3).map((n) => n.target.join(' ')).join(' | ')}`);
    expect(summary, route).toEqual([]);
  });
}
