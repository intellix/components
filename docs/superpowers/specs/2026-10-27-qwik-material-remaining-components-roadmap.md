# qwik-material — remaining components roadmap

**Date:** 2026-10-27
**Decision (Dominic):** port every remaining Material component, easiest first.

All rules from `2026-10-27-qwik-material-dom-parity-remediation-design.md`
apply (Angular DOM is the contract, synced SCSS, SSR-rendered state, lazy
interaction plumbing, migration-friendly API, SYNC.md per entry point).

## Order (Claude's call — difficulty, then dependencies)

| Wave | Components | Notes |
|---|---|---|
| 1 | slide-toggle, checkbox, radio, expansion | Native-input form controls; expansion brings `cdk/accordion`. |
| 2 | sort, sidenav (drawer), form-field + input, tabs | form-field + input are one unit; form-field is the base for select / autocomplete / datepicker / chips input. |
| 3 | tooltip, snack-bar, bottom-sheet, stepper | Overlay family on the finished overlay; stepper brings `cdk/stepper`. |
| 4 | menu, slider, chips, select (+ `core/option`) | Keyboard-heavy; select needs form-field + overlay + option. |
| 5 | paginator, autocomplete, table, tree | paginator uses select; table / tree bring `cdk/table`, `cdk/tree`. |
| 6 | timepicker, datepicker | Largest; datepicker needs form-field, overlay, a date adapter. |

## How each wave runs

1. **Angular side first (main checkout).** For each component: mirror
   scenarios in `src/dev-app/qwik-parity/<component>.ts` drawn from upstream's
   dev-app demo, examples and unit specs (states, variants, interactions), and
   `specs/material-<component>/angular-parity.spec.ts` with interaction steps.
   The spec header lists every scenario's content so the Qwik side can mirror
   it exactly. Rebuild the Angular dev-app once per wave.
2. **Qwik side (one git worktree per component).** Implement the entry point,
   the Qwik dev-app routes, synced SCSS, ported upstream unit tests, SYNC.md —
   until the parity spec passes (run twice).
3. **Merge one at a time**, re-running the whole Playwright suite and both unit
   pipelines after each merge.

A component is done when its parity spec, its Qwik-only specs and the unit
pipelines pass and nothing previously green regresses.
