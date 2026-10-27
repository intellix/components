# qwik-material / qwik-cdk — DOM parity remediation

**Date:** 2026-10-27
**Author:** Dominic + Claude

## Why

The consumer app is moving from Angular to Qwik and applies per-brand CSS from a
CMS on top of Angular Material. Those selectors "sometimes cut deep" into
Material's DOM. For the app to look identical after the framework switch, every
qwik-material / qwik-cdk component must render **exactly** Angular Material's DOM:
same elements, nesting, tag names, classes (including state classes), attributes
on the same elements, and synced SCSS.

Earlier component specs allowed "scope cuts" (dropping the pseudo-checkbox,
CSS-grid grid-list, rewritten SCSS, …). **DOM parity now overrides all of them.**
Those cuts are undone.

Nothing previously verified parity against Angular: the Material Playwright specs
only asserted the Qwik DOM against expectations written from the Qwik code.

## The gate: Angular-vs-Qwik parity specs (done)

- Angular renders each scenario at `/qwik-parity/<route>/<scenario>` from
  `src/dev-app/qwik-parity/*.ts` (local addition to the dev-app).
- Qwik renders the same scenario at `src/qwik-cdk-dev-app/src/routes/<route>/<scenario>/`.
- `src/qwik-cdk-parity-tests/specs/*/angular-parity.spec.ts` diff the two DOMs
  initially and after every interaction step (`lib/material-parity.ts`).
- Normalised away: framework bookkeeping, id digits, ripple transients,
  consumer-written directive selector attributes, Angular's static-input echo.

Baseline on 2026-10-27: **32 / 127 scenarios match.** Fully matching: divider,
toolbar, progress-spinner. See `src/qwik-cdk-parity-tests/README.md` for running.

A component is done when **every scenario and step in its `angular-parity.spec.ts`
passes**, plus its vitest suite and its Qwik-only Playwright specs.

## Rules for every fix

1. **Angular is the reference.** Change the Qwik side until the diff is empty.
   Only touch `src/dev-app/qwik-parity/*` if a scenario was mirrored wrongly
   (say so in the commit). Never weaken the harness to make a diff disappear;
   new normalisation needs a reason that applies to every component.
2. **SCSS is synced, not rewritten.** Copy upstream byte-for-byte; the only
   allowed edit is the existing `@angular/cdk` → cdk-stub import swap. Delete
   rewrites (grid-list, list, button-toggle).
3. **Render state on the server.** Classes/attributes that Angular sets at first
   render (state classes, roles, ids, `aria-*`) must be in Qwik's SSR output, not
   added in `useVisibleTask$`.
4. **API stays migration-friendly.** Prop names follow Angular input names
   (camelCase); events become `on<Output>$`. Where Angular puts a directive on a
   consumer element (`matBadge`, `matListItemAvatar`, `mat-subheader`), the Qwik
   component renders that element itself via a polymorphic `as` prop (the
   pattern `MatListItem` already uses) — no extra wrapper elements.
5. **Qwik primitives are unrestricted.** Earlier per-component bans
   (`useStore`, `useTask$`) were local choices, not project rules; use what gives
   correct SSR + resumable behaviour.
6. **Interactive internals Angular inserts lazily** (ripple elements, focus
   classes) must appear the same way after the same interaction. Ripple element
   animation itself is out of scope; the static ripple containers/attributes are
   not.
7. **Update the record.** Each component's `SYNC.md` loses the deviations that
   are fixed and states the upstream commit synced. Existing Qwik-only Playwright
   specs and vitest specs that asserted the drifted DOM are updated to the
   Angular DOM.

## Work items (from the baseline diff)

### Shared infrastructure
- **Overlay (qwik-cdk/overlay):** match current upstream structure —
  `.cdk-overlay-container > div.cdk-global-overlay-wrapper.cdk-overlay-popover[popover=manual][dir]`
  containing the backdrop and `div#cdk-overlay-N.cdk-overlay-pane`; drop the
  invented `cdk-overlay-host` / `data-overlay-id`; inline styles as upstream
  (`position: static` on the pane, flex alignment on the wrapper); default
  centered global position strategy as `Dialog` does; `cdk-overlay-dark-backdrop`.
- **Focus trap anchors** carry `cdk-visually-hidden`.
- **FocusMonitor** (`cdk-focused`, `cdk-keyboard-focused`, `cdk-mouse-focused`, …)
  where upstream components monitor focus (button, button-toggle, list items):
  port `@angular/cdk/a11y` FocusMonitor as a hook if the parity steps need it.
- **Id generation** with upstream prefixes (`mat-button-toggle-N`,
  `mat-button-toggle-group-N`, `cdk-overlay-N`, …) via the existing
  `qwik-cdk/a11y` id generator.
- **Animations flag:** `QwikMaterialProvider` config equivalent to
  `MATERIAL_ANIMATIONS.animationsDisabled`, driving classes such as
  `mat-button-toggle-animations-enabled`.
- **Pseudo-checkbox** (`material/core/selection/pseudo-checkbox`) as a Qwik
  component + synced SCSS (needed by button-toggle; later list selection, select).

### Per component (diff highlights)
- **dialog (cdk + material):** container tags (`<cdk-dialog-container>`,
  `<mat-dialog-container>`), `mat-mdc-dialog-panel` on the pane,
  `aria-modal` default `false`, `MatDialogClose` adds no class / default
  `aria-label`. Also fix the pre-existing failing Qwik specs: Escape / backdrop
  close, close-with-result, restore-focus.
- **button:** emit Material's `mat-ripple-loader-*` host attributes (lazy ripple
  contract), no injected `type`, `disabled` attribute value as upstream; fix
  pre-existing disabled-interactive failure.
- **button-toggle:** re-port from upstream: `role="presentation"` host, `role` /
  `aria-checked` / `aria-pressed` / `name` / roving `tabindex` on the inner
  `<button class="mat-button-toggle-button mat-focus-indicator">`, checkbox
  wrapper + pseudo-checkbox, focus overlay + ripple spans, all state and
  appearance classes, keyboard navigation, synced SCSS.
- **badge:** directive model — `MatBadge` renders the host element (`as`) with
  `.mat-badge-content` inside it; no badge element when content is empty;
  `aria-describedby` description behaviour as upstream.
- **list:** upstream item template (`mdc-list-item__start/content/end`,
  `mat-focus-indicator`, ripple), content-derived classes (`--with-one-line`,
  `--with-leading-avatar`, `mat-mdc-list-item-single-line`, …), `aria-disabled`,
  `type="button"` on button items, avatar / icon / meta / subheader rendered on
  the element itself; synced SCSS.
- **grid-list:** `<mat-grid-tile>` tiles positioned by a port of upstream
  `TileCoordinator` + `TileStyler` (same inline styles), header / footer / avatar;
  synced SCSS; fix `fit` spec.
- **icon:** default font-set class from config (`material-icons mat-ligature-font`
  upstream default; the dev-app sets `material-symbols-outlined`), SVG attributes
  (`fit`, `height`, `width`, `preserveAspectRatio`, `focusable`),
  `data-mat-icon-name`.
- **card:** passes once consumer selector attributes are ignored; re-verify.
- **progress-bar:** `animation-end` scenario times out on one side — investigate.

## Order

1. Wave 1 (parallel, separate git worktrees): overlay + dialogs; button-toggle
   (+ pseudo-checkbox, animations flag, ids); list; grid-list.
2. Wave 2: button; badge; icon + card + progress-bar.
3. Then resume porting new components, each gated by its own
   `angular-parity.spec.ts` from the start (Angular mirror scenarios written
   before the Qwik implementation).

## Out of scope

- Qwik v2 migration (stay on `@builder.io/qwik` 1.x for now).
- Computed-style parity (needs the Qwik dev-app on the same theme as the Angular
  dev-app) — a follow-up that would verify the SCSS sync end to end.
