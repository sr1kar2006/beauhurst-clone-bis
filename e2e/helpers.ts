import type { Page } from '@playwright/test';

export function watchErrors(page: Page) {
  const errors: string[] = [];
  page.on('console', (m) => m.type() === 'error' && !/tile\.openstreetmap|Failed to load resource/.test(m.text()) && errors.push(m.text()));
  page.on('pageerror', (e) => errors.push(String(e)));
  return errors;
}
export async function seedSeen(page: Page) {
  await page.addInitScript(() => { try { localStorage.setItem('nb.tourSeen', 'true'); } catch { /* */ } });
}
