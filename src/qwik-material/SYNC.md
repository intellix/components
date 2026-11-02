# qwik-material sync state

Repo root: this file lives at src/qwik-material/SYNC.md.

Upstream base: `@angular/material@21.2.14` (git tag `v21.2.14`, commit
`8fe4d6a8ffcf`) as of the 2026-11-02 rebaseline. The port was originally
built against this repo's `main` at `22.1.0-next` and rebaselined onto
v21.2.14 in the `qwik-port-21.2` branch/worktree — see each entry-point's
own `SYNC.md` for its upstream path and sync state, and the root-level
rebaseline notes below for what moved between the two versions.

## 2026-11-02 rebaseline to v21.2.14 (8fe4d6a8ffcf)

A comparison of every template/style file under `src/material/`/`src/cdk/`
between v21.2.14 and the port's original 22.1-next base found 17 changed
template/style files, all accounted for:

- **button** (6 files: `button.html`, `button.scss`, `fab.scss`,
  `icon-button.html`, `icon-button.scss`, `_m3-button.scss`) — the newer
  `showProgress`/`[progressIndicator]` feature. Never implemented by this
  port (already deferred); only dead CSS needed removing. See
  `button/SYNC.md`.
- **tabs** (3 files: `_tabs-common.scss`, `tab-body.scss`,
  `tab-group.html`) — the newer split `--mat-tab-body-/-header-
  animation-duration` CSS vars (one `--mat-tab-animation-duration` var at
  v21.2.14). This port had the newer var names; reverted. See
  `tabs/SYNC.md`.
- **core** (3 files: `_typography.scss`, `_classes.scss`, `_system.scss`)
  — Sass-internal plumbing refactors with no token-value change
  (confirmed by regenerating `default-theme.scss` against this worktree's
  v21.2.14 source: byte-identical output). This port doesn't vendor any
  of the three files. See `core/SYNC.md`.
- **sidenav** (2 files: `drawer-container.html`, `sidenav-container.html`)
  — a newer `ng-content select`-tag widening with no effect on this
  port's own named-slot projection mechanism. See `sidenav/SYNC.md`.
- **slide-toggle** (1 file: `slide-toggle.scss`) — the newer `fullWidth`
  input/CSS. This port had implemented it; removed. See
  `slide-toggle/SYNC.md`.
- **radio** (1 file: `_radio-common.scss`) — `cursor: pointer`
  unconditional vs. guarded; pure CSS. See `radio/SYNC.md`.
- **chips** (1 file: `chip.scss`) — a newer selector variant, pure dead
  CSS. See `chips/SYNC.md`.

Every other SCSS file this package's component `SYNC.md` files document
as a byte-identical/byte-for-byte copy of an upstream file (178 documented
mappings total) was verified against this worktree's real
`src/material/`/`src/cdk/` v21.2.14 source and matches exactly (the 9
files above needed resyncing; everything else already matched).

Every other component (autocomplete, badge, bottom-sheet, button-toggle,
card, checkbox, datepicker, divider, dialog, expansion, form-field,
grid-list, icon, input, list, menu, paginator, progress-bar,
progress-spinner, select, slider, snack-bar, sort, stepper, table,
timepicker, toolbar, tooltip, tree) was audited against v21.2.14's
templates/styles/host bindings and found unchanged — no component-level
fix needed beyond the two incidental `@ts-expect-error` cleanups
(bottom-sheet, and `qwik-cdk/dialog`) that 21.2.14's own pinned
TypeScript (5.9.2 vs. 22.1-next's 6.0.2) made unnecessary.

Full parity suite (`src/qwik-cdk-parity-tests`) run against the v21.2.14
Angular reference: see the repo-level report for pass counts; the only
expected failure is `material-timepicker` `min-max` (pre-existing, open
bug, unrelated to this rebaseline).

## Per-entry-point state

| Entry-point | Upstream base | Last sync commit | Notes |
|---|---|---|---|
| dialog | src/material/dialog | v21.2.14 (8fe4d6a8ffcf) | See dialog/SYNC.md |
| expansion | src/material/expansion | v21.2.14 (8fe4d6a8ffcf) | Built on `@angular-community/qwik-cdk/accordion`. See expansion/SYNC.md |
| menu | src/material/menu | v21.2.14 (8fe4d6a8ffcf) | Built on `@angular-community/qwik-cdk/a11y`'s new `FocusKeyManager`. See menu/SYNC.md |

## Sync recipe

See `dialog/SYNC.md` for the entry-scoped sync recipe. This file rolls up which entry-points exist and where each was last synced.
