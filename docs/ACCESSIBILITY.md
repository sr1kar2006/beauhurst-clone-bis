# Accessibility

> Prototype for client demo. Draft statement in the app at **/accessibility** (`TODO(bid team)`: review before publication).

## Target

WCAG 2.2 level AA.

## What the prototype does

- **Keyboard:** every control is reachable and operable with the keyboard. There is a Skip to content link, a visible focus ring everywhere, and Esc closes the top-most layer. Popovers return focus to their trigger; dialogs trap and return focus.
- **Semantics:** combobox and listbox for the country selector; tablists; dialogs; grid and tables with header cells; tree controls with button roles; charts with `role="img"` and generated descriptions.
- **Alternatives:** every statistics chart has **View as table**; the people network graph has **View as list**; maps duplicate data shown elsewhere.
- **Motion:** `prefers-reduced-motion` turns off the tour beacon pulse, transitions and smooth scrolling.
- **Contrast:** muted text darkened to #6B6B6B; chip text and success colours darkened for AA; links within text are underlined.
- **Shortcuts:** press `?` for the shortcuts overlay.

## Testing

| Check | How | Where |
|---|---|---|
| Automated | axe (`@axe-core/playwright`) on every route; zero serious or critical violations is a CI gate | `e2e/a11y.spec.ts` |
| Keyboard journeys | Build a search, open a profile, export, compare, using keyboard only | `e2e/keyboard.spec.ts` |
| Reduced motion | Emulated `prefers-reduced-motion: reduce` | `e2e/keyboard.spec.ts` |
| Lighthouse | Accessibility score of at least 0.95 | `lighthouserc.json` |
| Assistive technology | `TODO(bid team)`: NVDA, JAWS, VoiceOver, Dragon; external audit | n/a |

## Known issues

- The Leaflet map is excluded from axe checks (third-party tiles). Company data on the map is also in the table and statistics.
- Exported PDFs are not tagged for screen readers. `TODO(bid team)`: remediation plan.
- The network graph is visual; use View as list with screen readers.
