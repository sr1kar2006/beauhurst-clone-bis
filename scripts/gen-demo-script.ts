/**
 * Generates docs/DEMO_SCRIPT.md from src/tender/requirements.ts (the same list as /tender-coverage),
 * so the demo script and the in-app traceability page never drift apart.
 * Run: npm run docs:demo
 */
import { writeFileSync } from 'node:fs';
import { REQUIREMENTS, type Requirement } from '../src/tender/requirements';

const ORDER: Requirement['priority'][] = ['Critical', 'High', 'Medium'];
// Minutes per step: Critical items get the most time; the whole script fits in 15 minutes.
const MINUTES: Record<Requirement['priority'], number> = { Critical: 0.36, High: 0.36, Medium: 0.5 };

const rows = [...REQUIREMENTS].sort((a, b) => ORDER.indexOf(a.priority) - ORDER.indexOf(b.priority));
let t = 0;
const fmt = (m: number) => `${String(Math.floor(m)).padStart(2, '0')}:${String(Math.round((m % 1) * 60)).padStart(2, '0')}`;

const lines: string[] = [
  '# Demo script: closing the CMA tender gaps',
  '',
  '> Prototype for client demo. All data shown is sample data. Figures tagged **Sample** in the app are placeholders, not commitments.',
  '> Generated from `src/tender/requirements.ts` by `npm run docs:demo`. The same list, with "Show me" links, is in the app at **/tender-coverage**.',
  '',
  '## Before you start (2 minutes before the meeting)',
  '',
  '- Open the app; you are signed in as **Simone Hartley (Administrator)**. Use the user menu → Switch user to show a Member.',
  '- On **/tender-coverage** → Demo controls: press **Reset to 61,000** (allowance) so the bulk export shows "No additional charge".',
  '- Optional: **Monitor** Tusklab AG (/companies/de-1) so "Simulate new events" has something to show.',
  '',
  '## Walkthrough (about 15 minutes, Critical first)',
  '',
  '| Time | Area | Route | What to click / say | Tender requirement | Priority |',
  '|---|---|---|---|---|---|',
];
for (const r of rows) {
  lines.push(`| ${fmt(t)} | ${r.area} | \`${r.show}\` | ${r.demo} | ${r.requirement} | ${r.priority} |`);
  t += MINUTES[r.priority];
}
lines.push('', `Total: about ${Math.round(t)} minutes for ${rows.length} requirements.`, '');
lines.push('## Talking points for each Critical area', '');
for (const area of [...new Set(rows.filter((r) => r.priority === 'Critical').map((r) => r.area))]) {
  lines.push(`### ${area}`, '');
  rows.filter((r) => r.area === area).forEach((r) => lines.push(`- **${r.requirement}.** ${r.demo} (\`${r.show}\`, status: ${r.status})`));
  lines.push('');
}
lines.push('## If something goes wrong', '', '- Refresh the page: all demo state is in the browser and survives reloads.', '- To reset everything, clear site data for the demo URL (resets users, collections, reports, alerts and exports to the seeded state).', '- TODO(bid team): add presenter contact and fallback recording link.', '');

writeFileSync(new URL('../docs/DEMO_SCRIPT.md', import.meta.url), lines.join('\n'));
console.log(`docs/DEMO_SCRIPT.md written: ${rows.length} steps, ~${Math.round(t)} minutes`);
