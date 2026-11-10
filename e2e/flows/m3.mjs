// node e2e/flows/m3.mjs : M3 provenance screenshots
import { chromium } from '@playwright/test';
const b = await chromium.launch();
const page = await b.newPage({ viewport: { width: 1844, height: 1032 } });
const errors = [];
page.on('pageerror', (e) => errors.push(String(e)));
await page.addInitScript(() => { try { localStorage.setItem('nb.tourSeen', 'true'); } catch {} });
const shot = async (n) => { await page.waitForTimeout(600); await page.screenshot({ path: `e2e-shots/part3/M3-${n}.png` }); };
await page.goto('http://localhost:5173/data-sources#companies-house'); await shot('sources');
for (const t of ['coverage', 'freshness', 'qa', 'limitations', 'corrections']) { await page.goto(`http://localhost:5173/data-sources#${t}`); await shot(t); }
await page.goto('http://localhost:5173/companies/lumen-bank/financials');
await page.locator('[data-provenance="Turnover"]').first().click(); await shot('profile-financials-info');
await page.goto('http://localhost:5173/companies/lumen-bank/details'); await shot('profile-details-footers');
console.log(errors.length ? errors.join('\n') : 'no page errors');
await b.close();
