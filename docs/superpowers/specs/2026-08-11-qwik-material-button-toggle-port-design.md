# qwik-material Button Toggle Port — Design Spec

**Date:** 2026-08-11
**Branch:** `qwik-cdk-dialog-port` (12th component after Dialog, Button, Card, Toolbar, Badge, Icon, Progress Bar, Progress Spinner, Divider, Grid List, List).
**Scope tier:** easy (button-family variant — segmented toggle control).

## 1. Goal

Port `src/material/button-toggle` to a `qwik-material/button-toggle` entry-point:

- **2 components:** `MatButtonToggleGroup` (container, controlled component with `value` + `onChange$` in single mode or `values` + `onValuesChange$` in multi mode) and `MatButtonToggle` (child).
- **First port with a reactive per-instance state context + QRL prop callbacks** — precedent-setting pattern for future forms-tier ports (checkbox, radio, slide-toggle).
- **Native Tab per button for keyboard nav** — each toggle is its own tab stop; no arrow-key handler, no focus manager (SSR-safe, zero JS).
- **Standard appearance only** — the deprecated `legacy` variant is dropped.

**Non-goals:** `ControlValueAccessor` / Angular Reactive Forms integration (Qwik has no equivalent); `SelectionModel` (RxJS); `FocusMonitor` + roving tabindex + arrow-key nav; ripple system; `MatPseudoCheckbox` selection indicator; `vertical` layout mode; `hideSingleSelectionIndicator` / `hideMultipleSelectionIndicator` / `disabledInteractive` niche flags; auto-generated ids via `_IdGenerator`.

## 2. Architecture

**2 pure `component$` wrappers, zero lifecycle beyond render, CSS-driven layout.**

**Controlled-component pattern.** Consumer owns the selection state via signals. The group takes `value` / `values` props and matching `onChange$` / `onValuesChange$` QRLs. Group creates a single `onToggle` QRL that internally forks by mode, then publishes it (along with the current selection) via a per-instance context (`MAT_BUTTON_TOGGLE_GROUP_STATE`) so children can (a) read the current selection to compute their own `checked` state and (b) fire updates back via the QRL when clicked.

**Standalone `<MatButtonToggle>`** (outside any group) reads the context with SSR-safe DEFAULTS fallback (Progress Bar / Progress Spinner lesson). The DEFAULTS include a no-op `onToggle` QRL — the toggle detects this via identity check and falls back to owning its own local `useSignal(false)` for its checked state.

**Native Tab per button.** Each toggle host has `tabindex="0"`; the inner `<button type="button">` has `tabindex="-1"` (absorbs clicks but not Tab focus). Trade-off: differs from upstream's roving-tabindex + arrow-key convention (Tab enters the group once, arrows navigate within). Documented as a scope decision per spec §5 deviation #5.

**No `useVisibleTask$`, no `useStore`, no `useTask$`.** Group state is derived fresh each render from props — Qwik's fine-grained reactivity re-runs the component when `props.value` / `props.values` changes (consumer-owned signal → prop → re-render).

**Family shape:**
- `MatButtonToggleConfig` — empty (parity with divider / list). Extended as the **13th** `useContextProvider` call in `QwikMaterialProvider`.
- `MAT_BUTTON_TOGGLE_GROUP_STATE` — per-instance parent → child state, second time we've used this pattern (grid-list was first, with static state; this is the first with a reactive store + QRL callback).

**File layout:**

```
src/qwik-material/button-toggle/
├── intrinsic-elements.d.ts             # <mat-button-toggle-group>, <mat-button-toggle>
├── button-toggle-config.ts              # MatButtonToggleConfig + MAT_BUTTON_TOGGLE_CONFIG
├── button-toggle-group-state.ts         # State type + context id + DEFAULTS
├── button-toggle-state.spec.ts          # combined config + state smoke (5 it())
├── mat-button-toggle-group.tsx          # container — publishes state, routes onToggle
├── mat-button-toggle-group.spec.tsx     # 1 smoke
├── mat-button-toggle.tsx                # child — reads state, computes checked, fires onToggle
├── mat-button-toggle.spec.tsx           # 1 smoke
├── public-api.ts                        # 10 exports
├── index.ts                             # export * from './public-api';
├── mat-button-toggle-scenarios.spec.tsx # smoke-only scenario port (18 it())
└── SYNC.md                              # deviation catalog

src/qwik-material/scss/button-toggle/
├── button-toggle.scss                   # heavily REWRITTEN (~100 LOC — segmented group CSS)
├── _button-toggle-theme.scss            # synced byte-identical
├── _m2-button-toggle.scss               # synced byte-identical
├── _m3-button-toggle.scss               # synced byte-identical
└── button-toggle-prebuilt.scss          # new — :root var defaults
```

## 3. Component API

### 3.1 `MatButtonToggleGroup`

```ts
export interface MatButtonToggleGroupProps {
  /** Selection mode. `false` (default) = single-select; `true` = multi-select. */
  multiple?: boolean;

  // ── SINGLE mode props (multiple === false) ──
  /** Currently-selected value. Consumer owns the state. */
  value?: unknown;
  /** Fires when a child toggle is clicked. Receives the new selected value —
   *  or `undefined` if the clicked toggle was the currently-selected one and
   *  is being deselected (matches upstream). */
  onChange$?: QRL<(value: unknown) => void>;

  // ── MULTI mode props (multiple === true) ──
  /** Currently-selected values. Consumer owns the state. */
  values?: readonly unknown[];
  /** Fires when a child toggle is clicked. Receives the new set of selected
   *  values (already deduped, order preserved). */
  onValuesChange$?: QRL<(values: readonly unknown[]) => void>;

  // ── Shared ──
  /** Disables the whole group; cascades to every child via context. */
  disabled?: boolean;
  /** Form-control name — set on hidden `<input>` inside each checked button so
   *  the group participates in standard HTML form submission. Empty by default. */
  name?: string;
  /** ARIA role override. Defaults to "radiogroup" (single) or "group" (multi). */
  role?: string;
  'aria-label'?: string;
  'aria-labelledby'?: string;
  'aria-describedby'?: string;
  class?: string | ReadonlyArray<string>;
  id?: string;
}
```

**Rendered DOM (single-select, value="bold"):**

```html
<mat-button-toggle-group class="mat-button-toggle-group mat-button-toggle-standard"
                         role="radiogroup" aria-label="Text style">
  <!-- projected <MatButtonToggle> children -->
</mat-button-toggle-group>
```

**Rendered DOM (multi-select, values=["bold","italic"]):**

```html
<mat-button-toggle-group class="mat-button-toggle-group mat-button-toggle-group-multiple mat-button-toggle-standard"
                         role="group" aria-label="Text style">
  <!-- ... -->
</mat-button-toggle-group>
```

- `role` default: `"radiogroup"` (single) or `"group"` (multi). Consumer prop overrides.
- `.mat-button-toggle-group-multiple` class added in multi mode (kept for CSS-selector parity with upstream even though it's inert in our styling today).
- `.mat-button-toggle-standard` class always present (no other appearance variant per spec §5 deviation #8).

### 3.2 `MatButtonToggle`

```ts
export interface MatButtonToggleProps {
  /** The value this button represents in the group's selection. Required. */
  value: unknown;
  /** Individually disables this button (in addition to group-level disabled). */
  disabled?: boolean;
  /** Optional id. If omitted, no id is emitted (no auto-generated `mat-button-toggle-N`). */
  id?: string;
  /** Individual name override — falls back to group's `name` prop. */
  name?: string;
  'aria-label'?: string;
  'aria-labelledby'?: string;
  'aria-describedby'?: string;
  class?: string | ReadonlyArray<string>;
}
```

**Rendered DOM (in single-mode group, checked=true):**

```html
<mat-button-toggle class="mat-button-toggle mat-button-toggle-checked"
                   role="radio" aria-checked="true"
                   aria-disabled="false" tabindex="0">
  <button type="button" class="mat-button-toggle-button" tabindex="-1">
    <span class="mat-button-toggle-label-content"><!-- projected --></span>
  </button>
  <input type="hidden" name="text-style" value="bold" />  <!-- only when group.name is set -->
</mat-button-toggle>
```

**Rendered DOM (in multi-mode group, checked=true):**

```html
<mat-button-toggle class="mat-button-toggle mat-button-toggle-checked"
                   role="checkbox" aria-checked="true"
                   aria-disabled="false" tabindex="0">
  <button type="button" class="mat-button-toggle-button" tabindex="-1">
    <span class="mat-button-toggle-label-content">…</span>
  </button>
</mat-button-toggle>
```

**Rendered DOM (standalone, no group ancestor):**

```html
<mat-button-toggle class="mat-button-toggle"
                   role="button" aria-pressed="false"
                   aria-disabled="false" tabindex="0">
  <button type="button" class="mat-button-toggle-button" tabindex="-1">…</button>
</mat-button-toggle>
```

**Attribute/role logic:**

- `role`: `"radio"` (single-mode group), `"checkbox"` (multi-mode group), `"button"` (standalone).
- `aria-checked` in group modes; `aria-pressed` standalone.
- `aria-disabled` always emitted, reflects `groupDisabled OR myDisabled`.
- `tabindex="0"` on the host — native Tab moves between buttons.
- Inner `<button type="button">` with `tabindex="-1"` — the actual clickable element (upstream pattern). Absorbs click, forwards to context's `onToggle` QRL.
- Hidden `<input>` rendered only when `group.name` is set AND this button is currently checked. Value is `String(props.value)`.

**Click handler:**

```ts
onClick$={() => {
  if (effectiveDisabled) return;
  state.onToggle(props.value, !checked);
}}
```

### 3.3 Config token

```ts
// button-toggle-config.ts
export interface MatButtonToggleConfig {}
export const MAT_BUTTON_TOGGLE_CONFIG = createContextId<MatButtonToggleConfig>(
  'qwik-material/button-toggle-config',
);
```

Empty for family-shape parity. No fields today; kept as a stable token so future defaults plug in without an API break.

### 3.4 Per-instance state context

```ts
// button-toggle-group-state.ts
export type MatButtonToggleGroupMode = 'single' | 'multi';

export interface MatButtonToggleGroupState {
  mode: MatButtonToggleGroupMode;
  /** In single mode: currently-selected value (or undefined if none).
   *  In multi mode: undefined (children read `values` instead). */
  value: unknown;
  /** In multi mode: currently-selected values.
   *  In single mode: []. */
  values: readonly unknown[];
  /** Group-level disabled — cascades to every child. */
  disabled: boolean;
  /** Form-control name for hidden inputs. Empty string = no hidden input. */
  name: string;
  /** Child's click handler. Group routes to onChange$ (single) or
   *  onValuesChange$ (multi) internally. */
  onToggle: QRL<(itemValue: unknown, checked: boolean) => void>;
}

export const MAT_BUTTON_TOGGLE_GROUP_STATE = createContextId<MatButtonToggleGroupState>(
  'qwik-material/button-toggle-group-state',
);

/** SSR-safe fallback so a standalone <MatButtonToggle> renders. */
export const MAT_BUTTON_TOGGLE_GROUP_STATE_DEFAULTS: MatButtonToggleGroupState = {
  mode: 'single',
  value: undefined,
  values: [],
  disabled: false,
  name: '',
  onToggle: $((_value: unknown, _checked: boolean) => {
    // No-op — standalone toggle owns its own local state via useSignal.
  }),
};
```

Both `useContext(MAT_BUTTON_TOGGLE_CONFIG, {})` and `useContext(MAT_BUTTON_TOGGLE_GROUP_STATE, MAT_BUTTON_TOGGLE_GROUP_STATE_DEFAULTS)` follow the SSR-safe default-fallback pattern.

**Standalone toggle detection:** the child does an identity comparison — `state.onToggle === MAT_BUTTON_TOGGLE_GROUP_STATE_DEFAULTS.onToggle`. If true, allocate a local `useSignal(false)` for `checked` state; clicks flip it locally. Otherwise, `checked` is derived from context (`state.value === props.value` in single mode, `state.values.includes(props.value)` in multi).

### 3.5 Composition example (consumer)

```tsx
// Single-select
const style = useSignal<'bold' | 'italic' | 'underline'>('bold');
<MatButtonToggleGroup value={style.value} onChange$={v => (style.value = v as any)}
                     aria-label="Text style">
  <MatButtonToggle value="bold">Bold</MatButtonToggle>
  <MatButtonToggle value="italic">Italic</MatButtonToggle>
  <MatButtonToggle value="underline">Underline</MatButtonToggle>
</MatButtonToggleGroup>

// Multi-select
const perms = useSignal<readonly string[]>(['read']);
<MatButtonToggleGroup multiple values={perms.value}
                     onValuesChange$={vs => (perms.value = vs)}
                     aria-label="Permissions">
  <MatButtonToggle value="read">Read</MatButtonToggle>
  <MatButtonToggle value="write">Write</MatButtonToggle>
  <MatButtonToggle value="admin">Admin</MatButtonToggle>
</MatButtonToggleGroup>
```

### 3.6 Public API — 10 exports

```ts
export type {MatButtonToggleConfig} from './button-toggle-config';
export {MAT_BUTTON_TOGGLE_CONFIG} from './button-toggle-config';

export type {
  MatButtonToggleGroupState,
  MatButtonToggleGroupMode,
} from './button-toggle-group-state';
export {
  MAT_BUTTON_TOGGLE_GROUP_STATE,
  MAT_BUTTON_TOGGLE_GROUP_STATE_DEFAULTS,
} from './button-toggle-group-state';

export {MatButtonToggleGroup, type MatButtonToggleGroupProps} from './mat-button-toggle-group';
export {MatButtonToggle, type MatButtonToggleProps} from './mat-button-toggle';
```

**Breakdown:** 5 types (`MatButtonToggleConfig`, `MatButtonToggleGroupState`, `MatButtonToggleGroupMode`, `MatButtonToggleGroupProps`, `MatButtonToggleProps`) + 3 values (`MAT_BUTTON_TOGGLE_CONFIG`, `MAT_BUTTON_TOGGLE_GROUP_STATE`, `MAT_BUTTON_TOGGLE_GROUP_STATE_DEFAULTS`) + 2 components (`MatButtonToggleGroup`, `MatButtonToggle`).

## 4. SCSS strategy

**Upstream inventory (4 files, ~610 LOC):**

| File | Upstream LOC | Action | Notes |
|---|---|---|---|
| `button-toggle.scss` | 381 | **rewritten** (~100 LOC target) | CSS-only segmented group; drops ripple/state-layer/focus-indicator/pseudo-checkbox/legacy variant/vertical mode |
| `_button-toggle-theme.scss` | 93 | synced byte-identical | Theme mixin inert on our end |
| `_m2-button-toggle.scss` | 68 | synced byte-identical | M2 tokens |
| `_m3-button-toggle.scss` | 72 | synced byte-identical | M3 tokens |

**Rewritten `button-toggle.scss` — target shape:**

```scss
@use './m3-button-toggle';
@use '../core/tokens/token-utils';

$fallbacks: m3-button-toggle.get-tokens();

// Segmented group container — horizontal row with unified border.
.mat-button-toggle-group {
  display: inline-flex;
  flex-direction: row;
  align-items: stretch;
  border-radius: token-utils.slot(
    button-toggle-shape, $fallbacks, calc(var(--mat-button-toggle-height, 40px) / 2)
  );
  border: 1px solid var(--mat-button-toggle-divider-color, rgba(0, 0, 0, 0.12));
  overflow: hidden;
  background: var(--mat-button-toggle-background-color, transparent);

  &[aria-disabled='true'] .mat-button-toggle {
    pointer-events: none;
    opacity: 0.38;
  }
}

// Individual toggle host.
.mat-button-toggle {
  box-sizing: border-box;
  display: inline-flex;
  position: relative;
  color: var(--mat-button-toggle-text-color, rgba(0, 0, 0, 0.87));
  font-size: token-utils.slot(button-toggle-label-text-size, $fallbacks);
  line-height: 1;
  min-height: 40px;

  & + .mat-button-toggle {
    border-left: 1px solid var(--mat-button-toggle-divider-color, rgba(0, 0, 0, 0.12));
  }

  &.mat-button-toggle-checked {
    background: var(--mat-button-toggle-selected-state-background-color, rgba(0, 0, 0, 0.08));
    color: var(--mat-button-toggle-selected-state-text-color, rgba(0, 0, 0, 0.87));
  }

  &[aria-disabled='true'] {
    pointer-events: none;
    opacity: 0.38;
  }
}

// The actual clickable inner <button>.
.mat-button-toggle-button {
  all: unset;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0 16px;
  min-height: 100%;
  min-width: 100%;
  box-sizing: border-box;
  font: inherit;
  color: inherit;

  &:focus-visible {
    outline: 2px solid var(--mat-button-toggle-focus-outline-color, rgba(0, 0, 0, 0.87));
    outline-offset: -2px;
  }
}

.mat-button-toggle-label-content {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  white-space: nowrap;
}
```

**`box-sizing: border-box;`** included on `.mat-button-toggle` and `.mat-button-toggle-button` from the start — list-port lesson (Task 2 rewrite dropped it and Playwright caught it in final review).

**New `button-toggle-prebuilt.scss`:**

```scss
@use './button-toggle';

:root {
  --mat-button-toggle-text-color: rgba(0, 0, 0, 0.87);
  --mat-button-toggle-divider-color: rgba(0, 0, 0, 0.12);
  --mat-button-toggle-selected-state-background-color: rgba(0, 0, 0, 0.08);
  --mat-button-toggle-selected-state-text-color: rgba(0, 0, 0, 0.87);
  --mat-button-toggle-focus-outline-color: rgba(0, 0, 0, 0.87);
  --mat-button-toggle-background-color: transparent;
  --mat-button-toggle-height: 40px;
  // Additional --mat-* tokens from token-utils.slot() calls discovered during Task 2 reconciliation.
}
```

Reconciliation loop at Task 2 — precedent from every prior port; expect ~2-4 extra vars given list precedent (M3 tokens sometimes use doubled-prefix keys that don't match `slot()` calls).

**No `@use '../cdk-stub' as cdk` expected** — verified at Task 2 via `grep '@angular/cdk' src/material/button-toggle/*.scss`. If a hidden orphaned reference surfaces (list-port precedent showed one in an unused partial), document without a rewrite.

## 5. Deviations catalog

10 numbered deviations documented in SYNC.md at Task 10.

1. **`ControlValueAccessor` + `NG_VALUE_ACCESSOR` removed.** Qwik has no equivalent forms system. Replaced by controlled-component pattern: consumer owns state via signals; group takes `value`/`values` + `onChange$`/`onValuesChange$` QRLs. Native form submission still works via hidden `<input>` inside checked buttons when `group.name` is set.

2. **`SelectionModel` (RxJS-based) removed.** Replaced by plain arrays derived from `props.values` each render.

3. **`EventEmitter` `change` / `valueChange` removed.** Replaced by prop QRLs — no `.emit()` API.

4. **`FocusMonitor` + focus origin tracking removed.** Browser's native `:focus-visible` handles the visual case.

5. **Keyboard arrow-key navigation removed.** Port uses native Tab per button (each toggle has `tabindex="0"`). Differs from upstream's roving-tabindex + arrow-key ARIA convention. Scope decision Q2.

6. **Ripple system + `MatRipple` removed.** Consumers get `:active` / `:focus-visible` styling only.

7. **`MatPseudoCheckbox` visual selection indicator removed.** Selected state visualized via background color only. Multi-select mode is visually less explicit than upstream. Scope decision Q3.

8. **Deprecated appearance variants + niche flags removed:**
   - `appearance: 'legacy'` — deprecated upstream; port ships `'standard'` only.
   - `vertical` prop — dropped.
   - `hideSingleSelectionIndicator` / `hideMultipleSelectionIndicator` — moot (no indicator shipped).
   - `disabledInteractive` — dropped as niche.

9. **`Directionality` (`@angular/cdk/bidi`) removed.** No arrow-key handler → nothing to invert for RTL. Native CSS `dir="rtl"` handles layout.

10. **Angular-specific removals:**
   - `@Input()` + `booleanAttribute` transform + `HostAttributeToken` → TypeScript types + prop passthrough.
   - `@ContentChildren(MatButtonToggle)` QueryList → per-instance context; children self-detect.
   - `AfterContentInit` / `AfterViewInit` / `OnDestroy` / `OnInit` → no lifecycle.
   - `_IdGenerator` auto-id → consumers pass `id` explicitly or omit.
   - `WritableSignal<number>` for tabIndex → static `tabindex="0"`.
   - `providers: [{provide: MAT_BUTTON_TOGGLE_GROUP, useExisting: MatButtonToggleGroup}]` → per-instance context.
   - `exportAs: 'matButtonToggle' / 'matButtonToggleGroup'` → N/A.
   - Host bindings → JSX attribute passthrough.

**Removed upstream files:**
- `button-toggle-module.ts` — Qwik has no module concept.
- `testing/` (MatButtonToggleHarness) — no Angular test harness ecosystem.
- Upstream `public-api.ts` — replaced with our own re-export shape.
- `button-toggle.spec.ts` (1379 LOC) — ported to `mat-button-toggle-scenarios.spec.tsx`.
- `button-toggle.html` (36 LOC) — inlined into JSX.
- `MatButtonToggleDefaultOptions` interface + `MAT_BUTTON_TOGGLE_DEFAULT_OPTIONS` InjectionToken — folded into `MatButtonToggleConfig` (empty today).
- `MatButtonToggleChange` class — event shape unneeded (QRLs receive raw values).

## 6. Test strategy

### 6.1 Vitest — `mat-button-toggle-scenarios.spec.tsx`

Smoke-only (no `createDOM(<component$/>)`). 18 `it()` blocks per §7 Task 8:

- **7 live sanity:** exports + context ids + DEFAULTS shape + no-op onToggle safety + mode union + props shapes.
- **7 describe.skip DOM stubs:** deferred to Playwright — group role, child role, single-mode toggle + deselect, multi-mode toggle, group-level disabled cascade, individual disabled, form `name` hidden input.
- **4 describe.skip Angular-only stubs:** CVA, SelectionModel, FocusMonitor + arrow keys, ripple + PseudoCheckbox + IdGenerator + niche flags.

Expected: **7 pass + 11 skip = 18 total**. Full suite target ≈ **252 pass** (baseline post-list = 235; adds Task 3 config+state (5) + Task 4 group smoke (1) + Task 5 toggle smoke (1) + Task 6 provider (3) + Task 8 scenarios live (7) = 17 new; verify at implementation).

### 6.2 Dev-app routes — 7 under `src/qwik-cdk-dev-app/src/routes/mat-button-toggle/`

1. `basic/` — single-select 3-toggle group, consumer signal + `onChange$`.
2. `multi/` — multi-select 3-toggle group, consumer signal + `onValuesChange$`.
3. `disabled-group/` — group-level `disabled` cascade.
4. `disabled-individual/` — one child `disabled`; group + siblings still interactive.
5. `preselected/` — initial `value="italic"` renders `mat-button-toggle-checked` + `aria-checked="true"` at first SSR paint.
6. `form-name/` — group `name="text-style"` inside a `<form>`; hidden `<input>` emitted inside checked child.
7. `standalone/` — lone `<MatButtonToggle>` outside group, `role="button"` + `aria-pressed`, local `useSignal` owns state.

### 6.3 Playwright specs — 7 under `src/qwik-cdk-parity-tests/specs/material-button-toggle/`

Locators: `page.locator('mat-button-toggle-group')`, `page.locator('mat-button-toggle')`. Assertions on classes, attributes, click outcomes:

- **basic.spec.ts** — `role="radiogroup"`; 3 `<mat-button-toggle role="radio">`; initial all `aria-checked="false"`; click sets `aria-checked="true"` + `.mat-button-toggle-checked`.
- **multi.spec.ts** — `role="group"` + `.mat-button-toggle-group-multiple`; `role="checkbox"` children; click 2 in sequence → both checked; click again → uncheck.
- **disabled-group.spec.ts** — group `aria-disabled="true"`; all 3 unclickable + opacity 0.38.
- **disabled-individual.spec.ts** — one child `aria-disabled="true"`; other 2 clickable; disabled click is no-op.
- **preselected.spec.ts** — SSR renders correct `aria-checked="true"` + `.mat-button-toggle-checked` on the preselected toggle without a client-side flash.
- **form-name.spec.ts** — after selecting 'bold', a `<input type="hidden" name="text-style" value="bold">` exists inside the checked toggle; after selecting 'italic', the input moves.
- **standalone.spec.ts** — `role="button" aria-pressed="false"` initially; click flips `aria-pressed` + `.mat-button-toggle-checked` via local signal.

## 7. Task decomposition

11 tasks. Every commit uses scope `multiple` per branch convention.

| # | Task | Deliverable |
|---|---|---|
| 1 | Wire entry-point | `package.json` `./button-toggle` + `./button-toggle-prebuilt.css`; `vite.config.ts` entries + sassEntries; `intrinsic-elements.d.ts` for 2 custom tags typed as `QwikIntrinsicElements['div']`; empty `index.ts`. |
| 2 | Copy + rewrite SCSS | 3 partials byte-identical; new rewritten `button-toggle.scss` (~100 LOC, includes `box-sizing: border-box`); new `button-toggle-prebuilt.scss`. Iterative reconciliation. Verify no cdk refs. |
| 3 | Config + state contexts | `button-toggle-config.ts` (empty `MatButtonToggleConfig` + `MAT_BUTTON_TOGGLE_CONFIG`) + `button-toggle-group-state.ts` (mode union + state interface + `MAT_BUTTON_TOGGLE_GROUP_STATE` + DEFAULTS with no-op QRL). One combined smoke spec (5 it()). |
| 4 | `MatButtonToggleGroup` | `mat-button-toggle-group.tsx` — mode derivation, `onToggle` QRL forking by mode, `useContextProvider`, role default by mode, class ladder incl `.mat-button-toggle-group-multiple`. Reads `MAT_BUTTON_TOGGLE_CONFIG` with DEFAULTS fallback. 1 smoke it(). |
| 5 | `MatButtonToggle` | `mat-button-toggle.tsx` — reads state with DEFAULTS, computes checked from state, role by mode (radio/checkbox/button), inner `<button type="button">` click handler, hidden `<input>` when `state.name` set AND checked, standalone-detection via `onToggle` identity check → local `useSignal(false)`. 1 smoke it(). |
| 6 | Extend `QwikMaterialProvider` | 13th `useContextProvider` after `MAT_LIST_CONFIG`. Purely additive. 3 provider specs. |
| 7 | `public-api.ts` + build validation | 10 exports; replace Task 1 stub. `dist/button-toggle/public-api.d.ts` clean. |
| 8 | Vitest scenario port | 18 it() per §6.1. Full suite target ≈ 252 pass. |
| 9 | Dev-app routes + Playwright specs | 7 routes per §6.2 + 7 specs per §6.3. `root.tsx` += `button-toggle-prebuilt.css`. Manifest = exactly 7 `mat-button-toggle` routes. Playwright NOT run in this task. |
| 10 | SYNC.md + pipeline verification | 10 deviations per §5, sync-state table (~9 rows), header referencing 11 prior port SYNC.md companions. `pnpm test:qwik-material` exit 0. |
| 11 | Runtime Playwright verification | NEW task category — because this is the first port with reactive-state SSR through a per-instance QRL-carrying context, run the 7 Playwright specs against a local Chromium preview. Deliverable: 7/7 pass + screenshots of basic + preselected routes attached to task report. If Chromium unavailable, escalate to human (no silent skip). Addresses the list-port lesson where "typecheck-only" left 2 layout bugs hidden until final review. |

## 8. Global constraints

- **Commit hook scope:** `multiple` on every commit.
- **Zero exported classes** in `src/qwik-material/button-toggle/`.
- **Zero SSR globals** outside `.spec.tsx` files.
- **Zero `@builder.io/qwik/build` `isBrowser` imports.**
- **Every `useContext` call carries a defaults fallback** (Progress Bar / Progress Spinner lesson) — both `MAT_BUTTON_TOGGLE_CONFIG` and `MAT_BUTTON_TOGGLE_GROUP_STATE`.
- **Custom-element tag names must match upstream selectors** — `<mat-button-toggle-group>`, `<mat-button-toggle>`.
- **No `useVisibleTask$`, no `useStore`, no `useTask$`** — state derived from props each render.
- **No `--no-verify`, no hook bypass.**
- **`box-sizing: border-box` on `.mat-button-toggle` and `.mat-button-toggle-button`** — list-port lesson; SCSS Task 2 explicitly includes both from the start.
- **Pipeline gate at Task 10:** `pnpm test:qwik-material` exit 0 across build + vitest + lint-no-ssr-leaks + typecheck.
- **Runtime gate at Task 11:** 7/7 Playwright specs pass against local Chromium preview.
