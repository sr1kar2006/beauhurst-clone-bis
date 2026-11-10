// node e2e/part3-shots.mjs <prefix> <route> [<route> ...] : full-viewport screenshots into e2e-shots/part3/
// Requires the dev server on :5173. Route may carry "@full" to capture the full page.
import { chromium } from '@playwright/test';
import fs from 'node:fs';

const [, , prefix = 'M', ...routes] = process.argv;
fs.mkdirSync('e2e-shots/part3', { recursive: true });
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1844, height: 1032 } });
const errors = [];
page.on('console', (m) => m.type() === 'error' && !/openstreetmap|Failed to load resource/.test(m.text()) && errors.push(m.text()));
page.on('pageerror', (e) => errors.push(String(e)));
await page.addInitScript(() => { try { localStorage.setItem('nb.tourSeen', 'true'); } catch {} });
for (const raw of routes) {
  const full = raw.endsWith('@full');
  const r = raw.replace(/@full$/, '');
  await page.goto(`http://localhost:5173${r}`, { waitUntil: 'networkidle' });
  await page.locator('main [data-page], main [data-section], main [data-sign-in], main [data-forbidden], main [data-tour="query-builder"], main h1').first().waitFor({ timeout: 20000 }).catch(() => {});
  await page.waitForTimeout(1200);
  const name = r.replace(/^\//, '').replace(/[^a-z0-9]+/gi, '-').replace(/-$/, '') || 'home';
  await page.screenshot({ path: `e2e-shots/part3/${prefix}-${name}.png`, fullPage: full });
}
console.log(errors.length ? 'CONSOLE ERRORS:\n' + [...new Set(errors)].join('\n') : 'no console errors');
await browser.close();
