# qwik-material/button-toggle sync log

Tracks the sync state between this port and `src/material/button-toggle/`
upstream. Every deviation from a verbatim copy is recorded here. Companion to
`src/qwik-material/dialog/SYNC.md`, `src/qwik-material/button/SYNC.md`,
`src/qwik-material/card/SYNC.md`, `src/qwik-material/toolbar/SYNC.md`,
`src/qwik-material/badge/SYNC.md`, `src/qwik-material/icon/SYNC.md`,
`src/qwik-material/progress-bar/SYNC.md`,
`src/qwik-material/progress-spinner/SYNC.md`,
`src/qwik-material/divider/SYNC.md`,
`src/qwik-material/grid-list/SYNC.md`, and
`src/qwik-material/list/SYNC.md`.

## Upstream sync state

| File | Upstream path | Sync state | Notes |
| --- | --- | --- | --- |
| `button-toggle/mat-button-toggle-group.tsx` | `src/material/button-toggle/button-toggle.ts` (MatButtonToggleGroup class, lines 124-547) | ported | Controlled-component surface. Drops SelectionModel/CVA/EventEmitter/FocusMonitor/@ContentChildren; replaces `change`/`valueChange` EventEmitters with `onChange$`/`onValuesChange$` QRLs; publishes per-instance MAT_BUTTON_TOGGLE_GROUP_STATE with the single `onToggle` QRL routed by mode. Reads MAT_BUTTON_TOGGLE_CONFIG with DEFAULTS fallback (SSR-safe). No lifecycle, no useVisibleTask$/useStore/useTask$ |
| `button-toggle/mat-button-toggle.tsx` | `src/material/button-toggle/button-toggle.ts` (MatButtonToggle class, lines 548-793) + `button-toggle.html` (36 LOC template inlined) | ported | Reads MAT_BUTTON_TOGGLE_GROUP_STATE with DEFAULTS fallback; standalone detection via identity check on `onToggle` → useSignal(false) for local checked state. Computes role by mode (radio/checkbox/button). Inner `<button type="button" tabindex="-1">` absorbs clicks; host has `tabindex="0"` for native Tab per button. Hidden `<input>` only when `state.name` set AND checked. No focus indicator, no ripple, no pseudo-checkbox |
| `button-toggle/button-toggle-config.ts` | `src/material/button-toggle/button-toggle.ts` (MatButtonToggleDefaultOptions interface + MAT_BUTTON_TOGGLE_DEFAULT_OPTIONS InjectionToken, lines 62-90) | new | MatButtonToggleConfig = {} interface (empty today) + MAT_BUTTON_TOGGLE_CONFIG context id; folded into QwikMaterialProvider.matButtonToggleConfig for family shape parity. Upstream defaults (appearance/hideIndicator/disabledInteractive) all dropped per §5 deviation #8 |
| `button-toggle/button-toggle-group-state.ts` | (partial — `src/material/button-toggle/button-toggle.ts` MAT_BUTTON_TOGGLE_GROUP InjectionToken + internal group state) | new | Externalizes upstream's group-internal state (mode/value/values/disabled/name + a click handler) into a per-instance context so Qwik children can subscribe. First port on the branch to carry a QRL callback in a per-instance context; precedent-setting for future forms-tier ports |
| `scss/button-toggle/button-toggle.scss` | `src/material/button-toggle/button-toggle.scss` (381 LOC) | rewritten | ~90 LOC of standard-only segmented control; drops MDC state-layer + ripple + focus-indicator + pseudo-checkbox + legacy appearance variant + vertical mode (§5 deviations #6, #7, #8). Includes explicit `box-sizing: border-box` on both `.mat-button-toggle` and `.mat-button-toggle-button` per the list-port lesson. Upstream `button-toggle.scss:1` reads `@use '@angular/cdk';` — unlike Icon/Divider/Grid List/List, whose main compiled SCSS files never referenced `@angular/cdk` to begin with, this upstream file *does* carry a live cdk reference. Because the port rewrites the whole file from scratch rather than copying it, that reference is dropped along with everything else standard-mode doesn't need — it never reaches the port tree. See Stub inventory delta below for how this differs from the List precedent |
| `scss/button-toggle/_button-toggle-theme.scss` | `src/material/button-toggle/_button-toggle-theme.scss` | synced | byte-identical copy; theme mixin inert on our end but kept for `diff -q` parity |
| `scss/button-toggle/_m2-button-toggle.scss` | `src/material/button-toggle/_m2-button-toggle.scss` | synced | byte-identical copy |
| `scss/button-toggle/_m3-button-toggle.scss` | `src/material/button-toggle/_m3-button-toggle.scss` | synced | byte-identical copy |
| `scss/button-toggle/button-toggle-prebuilt.scss` | (qwik-material-specific) | new | `@use` button-toggle.scss + 11 `:root` defaults (verified via Task 2 reconciliation loop): 7 base tokens (`--mat-button-toggle-text-color`, `-divider-color`, `-selected-state-background-color`, `-selected-state-text-color`, `-focus-outline-color`, `-background-color`, `-height`) + 4 more surfaced by `token-utils.slot()`'s nested `var()` fallback chains (`--mat-button-toggle-shape`, `--mat-button-toggle-label-text-size`, `--mat-sys-corner-extra-large`, `--mat-sys-label-large-size`) |

## Removed upstream files

- `button-toggle-module.ts` — Qwik has no module concept
- `testing/` (MatButtonToggleHarness) — Angular test harness surface; no equivalent needed
- Upstream `public-api.ts` — replaced with our own re-export shape (§3.6)
- `button-toggle.spec.ts` (1379 LOC) — ported to `mat-button-toggle-scenarios.spec.tsx` (18 it()) per smoke-only vitest constraint
- `button-toggle.html` (36 LOC) — trivial template inlined into JSX
- `MatButtonToggleDefaultOptions` interface + `MAT_BUTTON_TOGGLE_DEFAULT_OPTIONS` InjectionToken — folded into MatButtonToggleConfig (empty today); defaults (appearance/hideIndicator/disabledInteractive) all dropped per §5 deviation #8
- `MatButtonToggleChange` class — event shape unneeded (QRLs receive raw values, not `{source, value}` objects)
- `SelectionModel<MatButtonToggle>` (RxJS-based) — replaced by plain arrays derived from props each render (§5 deviation #2)
- `ControlValueAccessor` interface + `NG_VALUE_ACCESSOR` provider — Qwik has no forms system (§5 deviation #1)
- `MatRipple` element inside each button — dropped (§5 deviation #6)
- `MatPseudoCheckbox` visual selection indicator — dropped (§5 deviation #7)

## Deviations from upstream

1. **`ControlValueAccessor` + `NG_VALUE_ACCESSOR` removed entirely.** Qwik has no equivalent forms system. Replaced by controlled-component pattern: consumer owns state via signals; group takes `value`/`values` + `onChange$`/`onValuesChange$` QRLs. Native form submission still works via hidden `<input>` inside checked buttons when `group.name` is set.

2. **`SelectionModel` (from `@angular/cdk/collections`, RxJS-based) removed.** Replaced by plain arrays derived from `props.values` each render. No `.selected` / `.select()` / `.deselect()` / `.toggle()` API surface — consumers manipulate their own signal via the QRL callback.

3. **`EventEmitter` `change` / `valueChange` removed.** Replaced by prop QRLs — no `.emit()` API surface.

4. **`FocusMonitor` + focus origin tracking removed.** Upstream uses `@angular/cdk/a11y` FocusMonitor to detect keyboard vs mouse focus and apply differentiated styling. Dropped — browser's native `:focus-visible` selector handles the visual case; keyboard-vs-mouse detection isn't ported.

5. **Keyboard arrow-key navigation removed.** Upstream binds LEFT/RIGHT/UP/DOWN/SPACE/ENTER with a roving tabindex pattern. Port uses native Tab per button (each toggle has `tabindex="0"` on the host): Tab moves between buttons, Enter/Space activates via the inner `<button type="button">`. Trade-off: differs from upstream's segmented-control ARIA convention (Tab enters the group once, arrows navigate within). Scope decision.

6. **Ripple system + `MatRipple` element removed.** Upstream renders `<span class="mat-button-toggle-ripple">` with a `MatRipple` directive. Dropped — consumers get `:active` / `:focus-visible` styling only. Matches every prior port.

7. **`MatPseudoCheckbox` visual selection indicator removed.** Upstream renders `<mat-pseudo-checkbox>` inside selected toggles as a ✓ indicator. Dropped — selected state visualized via `.mat-button-toggle-checked` background color only. Multi-select mode is visually less explicit than upstream. Consumers wanting an indicator can style `.mat-button-toggle-checked::before { content: '✓'; ... }`.

8. **Deprecated appearance variants + niche flags removed:**
   - `appearance: 'legacy'` — deprecated upstream; port ships `'standard'` only.
   - `vertical` prop — dropped.
   - `hideSingleSelectionIndicator` / `hideMultipleSelectionIndicator` — moot (no indicator shipped).
   - `disabledInteractive` — dropped as niche.

9. **`Directionality` (`@angular/cdk/bidi`) dependency removed.** Upstream reads `Directionality.value` to invert arrow-key handling in RTL. Since arrow-key nav is dropped (deviation #5), RTL falls out of native CSS — no code needed.

10. **Angular-specific removals:**
   - `@Input()` decorators + `booleanAttribute` transform + `HostAttributeToken` → TypeScript types + prop passthrough.
   - `@ContentChildren(MatButtonToggle)` QueryList → per-instance context; children self-detect.
   - `AfterContentInit` / `AfterViewInit` / `OnDestroy` / `OnInit` lifecycle → no lifecycle.
   - `_IdGenerator` auto-id generation → consumers pass `id` explicitly or omit.
   - `WritableSignal<number>` for tabIndex → static `tabindex="0"`.
   - `providers: [{provide: MAT_BUTTON_TOGGLE_GROUP, useExisting: MatButtonToggleGroup}]` → per-instance MAT_BUTTON_TOGGLE_GROUP_STATE context.
   - `exportAs: 'matButtonToggle' / 'matButtonToggleGroup'` → N/A.
   - Host bindings → plain JSX attribute passthrough.

## Stub inventory delta

No new stubs — the button-toggle SCSS chain does NOT reference `@angular/cdk` anywhere in the port tree (grep-confirmed across all 5 files under `scss/button-toggle/`). Zero additions to `scss/cdk-stub/_cdk-stub.scss` or any other stub file.

This is reached differently than the Icon + Divider + Grid List + List precedent, and is worth spelling out precisely. Icon's, Divider's, and Grid List's main compiled upstream files never contained an `@angular/cdk` reference to begin with — there was nothing to drop. List's `_list-item-hcm-indicator.scss` is the opposite case: it *is* copied byte-identical, including its `@use '@angular/cdk';` line, but the file is never `@use`'d anywhere in the compiled chain, so it's a true unreferenced orphan whose cdk import never resolves.

Button-toggle is neither. Upstream's `button-toggle.scss:1` contains `@use '@angular/cdk';`, and this *is* the actively-compiled main file (pulled in by `button-toggle-prebuilt.scss`) — not an orphan. The reference disappears because the port rewrites the entire file from scratch (§ standard-only ~90 LOC rewrite) rather than copying it; the cdk import, along with the MDC ripple/focus-indicator/pseudo-checkbox machinery it exists to support, simply isn't reproduced. Net build-time effect is identical to the other precedents (zero cdk resolution, no stub needed), but it's the result of an active rewrite dropping a real dependency, not an absent or orphaned one.

## Class count

`grep -rnE "^export class" src/qwik-material/button-toggle/ 2>/dev/null`
→ 0 (no exported classes on the consumer surface).

## Pipeline

`pnpm test:qwik-material` at the repo root runs `build && vitest && lint:no-ssr-leaks && typecheck` for the whole qwik-material package, covering dialog + button + card + toolbar + badge + icon + progress-bar + progress-spinner + divider + grid-list + list + button-toggle.
