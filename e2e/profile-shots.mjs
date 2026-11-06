// node e2e/profile-shots.mjs [companyId] [section ...] : screenshots each profile section to e2e-shots/profile/
import { chromium } from '@playwright/test';
import fs from 'node:fs';

const [, , id = 'lumen-bank', ...only] = process.argv;
const SECTIONS = ['summary', 'details', 'timeline', 'recent-activity', 'transactions', 'people', 'ownership', 'corporate-structure', 'commodity-trade', 'financials', 'filing-history', 'news', 'similar-companies'];
fs.mkdirSync('e2e-shots/profile', { recursive: true });
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1844, height: 1032 } });
const errors = [];
page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
page.on('pageerror', (e) => errors.push(String(e)));
await page.addInitScript(() => { try { localStorage.setItem('nb.tourSeen', 'true'); } catch {} });
for (const s of only.length ? only : SECTIONS) {
  await page.goto(`http://localhost:5173/companies/${id}/${s === 'summary' ? '' : s}`, { waitUntil: 'networkidle' });
  await page.waitForSelector('[data-section]');
  await page.waitForTimeout(700);
  await page.screenshot({ path: `e2e-shots/profile/${id}-${s}.png` });
  if (process.env.SCROLL) {
    await page.evaluate(() => window.scrollTo(0, 950));
    await page.waitForTimeout(300);
    await page.screenshot({ path: `e2e-shots/profile/${id}-${s}-2.png` });
  }
}
console.log(errors.length ? 'CONSOLE ERRORS:\n' + [...new Set(errors)].join('\n') : 'no console errors');
await browser.close();
