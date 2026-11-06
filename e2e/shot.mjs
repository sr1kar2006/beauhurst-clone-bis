// Ad-hoc screenshot helper: node e2e/shot.mjs <name> [scriptFile.mjs]
// The optional script exports `default async (page) => {}` to drive the UI first.
import { chromium } from '@playwright/test';
import { pathToFileURL } from 'node:url';

const [, , name = 'shot', script] = process.argv;
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1844, height: 1032 } });
const errors = [];
page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
page.on('pageerror', (e) => errors.push(String(e)));
await page.addInitScript(() => { try { localStorage.setItem('nb.tourSeen', 'true'); } catch {} });
await page.goto(process.env.URL ?? 'http://localhost:5173/', { waitUntil: 'networkidle' });
await page.evaluate(() => document.fonts.ready);
if (script) {
  const mod = await import(pathToFileURL(script).href);
  await mod.default(page);
}
await page.waitForTimeout(400);
await page.screenshot({ path: `e2e-shots/${name}.png`, fullPage: process.env.FULL === '1' });
if (errors.length) console.log('CONSOLE ERRORS:\n' + errors.join('\n'));
console.log('saved', `e2e-shots/${name}.png`);
await browser.close();
