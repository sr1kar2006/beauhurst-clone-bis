export default async function (page) {
  await page.getByRole('button', { name: 'Tour', exact: true }).click();
  await page.waitForSelector('[data-tour-tooltip]');
  await page.click('[data-tour="add-criteria"]');
  await page.waitForTimeout(800);
  const info = await page.evaluate(() => {
    const r = (s) => { const e = document.querySelector(s); return e && (({ x, y, width, height }) => ({ x, y, width, height }))(e.getBoundingClientRect()); };
    return {
      pickers: [...document.querySelectorAll('[data-tour="criteria-picker"]')].map((e) => ({ tag: e.tagName, cls: e.className.slice(0, 60), rect: e.getBoundingClientRect().toJSON() })),
      tip: r('[data-tour-tooltip]'),
      text: document.querySelector('[data-tour-tooltip]')?.textContent,
    };
  });
  console.log(JSON.stringify(info, null, 1));
}
