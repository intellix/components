# qwik-material/button sync log

Tracks the sync state between this port and `src/material/button/` upstream.
Every deviation from a verbatim copy is recorded here. Companion to
`src/qwik-material/dialog/SYNC.md`.

## Upstream sync state

| File                                          | Upstream path                                                       | Sync state | Notes                                                                                     |
| --------------------------------------------- | ------------------------------------------------------------------- | ---------- | ----------------------------------------------------------------------------------------- |
| `button/mat-button.tsx`                       | `src/material/button/button.ts` + `button.html`                     | ported     | Directive→component; APPEARANCE_CLASSES lifted to `button-appearance.ts`; anchor via href; ripple-loader + FocusMonitor wired (see below) |
| `button/mat-icon-button.tsx`                  | `src/material/button/icon-button.ts` + `icon-button.html`           | ported     | Directive→component; MatIconAnchor alias dropped; ripple-loader + FocusMonitor wired       |
| `button/mat-fab-button.tsx`                   | `src/material/button/fab.ts` (MatFabButton half)                    | ported     | Directive→component; MAT_FAB_DEFAULT_OPTIONS folded into MAT_BUTTON_CONFIG; ripple-loader + FocusMonitor wired |
| `button/mat-mini-fab-button.tsx`              | `src/material/button/fab.ts` (MatMiniFabButton half)                | ported     | Directive→component; MatMiniFabAnchor alias dropped; ripple-loader + FocusMonitor wired     |
| `button/button-config.ts`                     | `src/material/button/button-base.ts` (config interface)             | ported     | ThemePalette narrowed to MatButtonColor                                                   |
| `button/button-appearance.ts`                 | `src/material/button/button-base.ts` (appearance type + map)        | ported     | Map converted to Record for zero-runtime lookup                                           |
| `button/internal/ripple-loader.ts`            | `src/material/core/private/ripple-loader.ts` (MatRippleLoader)       | ported     | `rippleLoaderHostAttrs()` (SSR attrs) + `useRippleLoader()` (client lazy-span insertion); see deviation 1 |
| `button/internal/disabled-attr.ts`            | n/a (Qwik JSX typing workaround)                                     | new        | Renders `disabled="true"` like Angular's `[attr.disabled]` boolean stringification — see deviation 11 |
| `scss/button/button.scss`                     | `src/material/button/button.scss`                                   | synced     | byte-identical copy                                                                       |
| `scss/button/fab.scss`                        | `src/material/button/fab.scss`                                      | synced     | byte-identical copy                                                                       |
| `scss/button/icon-button.scss`                | `src/material/button/icon-button.scss`                              | synced     | byte-identical copy                                                                       |
| `scss/button/button-high-contrast.scss`       | `src/material/button/button-high-contrast.scss`                     | synced     | byte-identical copy                                                                       |
| `scss/button/_button-base.scss`               | `src/material/button/_button-base.scss`                             | synced     | byte-identical copy                                                                       |
| `scss/button/_m2-button.scss` + m3 + theme    | (three underscore partials)                                         | synced     | byte-identical copies                                                                     |
| `scss/button/_m2-fab.scss` + m3 + theme       | (three underscore partials)                                         | synced     | byte-identical copies                                                                     |
| `scss/button/_m2-icon-button.scss` + m3 + theme | (three underscore partials)                                       | synced     | byte-identical copies                                                                     |
| `scss/button/button-prebuilt.scss`            | (Qwik-material-specific)                                            | new        | @use of the four structural files + M3 :root defaults                                     |

## Removed upstream files

- `button.html` → inlined into `mat-button.tsx`; breadcrumb at `button.html.removed.md`
- `icon-button.html` → inlined into `mat-icon-button.tsx`; breadcrumb at `icon-button.html.removed.md`
- `button-module.ts` → Qwik has no module concept
- `button-base.ts` → responsibilities split across `mat-button.tsx` / `mat-icon-button.tsx` / `mat-fab-button.tsx` / `mat-mini-fab-button.tsx` (each carries its own base logic inline)

## Deviations from upstream

1. **No JS ripple *animation*.** The static ripple-loader contract (lazy `.mat-ripple` span insertion + `mat-ripple-loader-*` host attributes) is ported — see `internal/ripple-loader.ts` — but the actual click-ripple grow/fade animation (`MatRipple`/`RippleRenderer`) is not; the state layer stays CSS-only via the persistent-ripple `<span>` + MDC SCSS `::before` transitions. Follow-up: port `MatRipple` as a first-class qwik-cdk primitive for the animation itself.
2. **FocusMonitor integration uses a per-component engine, not a DI singleton.** `useFocusMonitor(hostRef, {checkChildren})` (added to `qwik-cdk/a11y`) creates its own `FocusMonitor` instance inside a `useVisibleTask$` rather than injecting one shared instance — capturing a context-resolved `FocusMonitor` (a closure full of functions) into a `useVisibleTask$` from the component's render scope crashes SSR serialization ("Code(3)"), so each consumer gets a fresh engine instead (same pattern as `useFocusTrap`/`qwik-cdk/root.tsx`'s dispatchers). DOM output (the `cdk-*-focused` classes) is identical either way; only extra `document` listeners are the cost. `FOCUS_MONITOR`/`createFocusMonitor` stay exported for anyone who wants to wire a truly shared instance manually via the `noSerialize()` + reactive-store pattern in `root.tsx`.
3. **No `showProgress` prop or `[progressIndicator]` slot.** Deferred per scope decision 2026-07-15.
4. **No icon-position slot.** No `<Slot name="icon"/>` before or `<Slot name="icon-end"/>` after the label. Consumers place icons in the default slot at v1.
5. **No `tabIndex` prop.** Qwik JSX forwards `tabIndex` as a standard HTML attribute via the JSX props of the underlying `<button>` / `<a>`.
6. **No `MatAnchor` / `MatIconAnchor` / `MatFabAnchor` / `MatMiniFabAnchor` type aliases.** Upstream declares them as `const X = Y; type X = Y;`; that pattern doesn't map to Qwik's single-render component model. Anchor form is opt-in via `href`.
7. **`_isFab` / `_isAnchor` internal fields not exposed.** Upstream keeps them protected on MatButtonBase; qwik-material's split-into-4-components architecture makes them redundant.
8. **`MAT_FAB_DEFAULT_OPTIONS` folded into `MAT_BUTTON_CONFIG`.** Upstream has a separate injection token for FAB's default color. Qwik-material collapses this into the single `MatButtonConfig.color` field.
9. **`matButtonConfig` field on `QwikMaterialProviderProps`.** Consistent with the dialog port's pattern of gathering component defaults on the single provider.
10. **No `_animationsDisabled` propagation to `.mat-animation-noopable` class.** Rely on the browser's `prefers-reduced-motion: reduce` for now. Follow-up if that's insufficient.
11. **`disabled` attribute rendered via a typed `boolean`-shaped lie (`internal/disabled-attr.ts`).** Upstream's `[attr.disabled]="_getDisabledAttribute()"` binding writes the literal string `disabled="true"` (Angular's attribute renderer stringifies a bound `true`), not the standard empty-string HTML boolean-attribute form (`disabled=""`) Qwik's natively-typed `disabled?: boolean` JSX prop produces. `disabledAttr()` returns the real runtime string through a `boolean | undefined` cast so the DOM matches Angular's exactly while staying inside Qwik's attribute type.

## Stub inventory delta

The following 6 stubs were added by the button port SCSS copy step (Task 2) beyond the 16 stubs the dialog port already produced. They are also documented in `src/qwik-material/dialog/SYNC.md` under "Additions from qwik-material/button port".

| Stub path                                              | Upstream path                                                         |
| ------------------------------------------------------ | --------------------------------------------------------------------- |
| `scss/core/style/_layout-common.scss`                  | `@angular/material/core/style/layout-common`                          |
| `scss/core/style/_vendor-prefixes.scss`                | `@angular/material/core/style/vendor-prefixes`                        |
| `scss/core/style/_private.scss`                        | `@angular/material/core/style/private`                                |
| `scss/core/focus-indicators/_private.scss`             | `@angular/material/core/focus-indicators/private`                     |
| `scss/core/theming/_theming.scss`                      | `@angular/material/core/theming/theming`                              |
| `scss/progress-spinner/_progress-spinner-theme.scss`   | `@angular/material/progress-spinner/progress-spinner-theme`           |

## Class count

`grep -nE "^export class" src/qwik-material/button/**/*.ts src/qwik-material/button/**/*.tsx`
→ 0 (no exported classes on the consumer surface).

## Pipeline

`pnpm test:qwik-material` at the repo root runs `build && vitest && lint:no-ssr-leaks && typecheck` for the whole qwik-material package, covering both dialog and button.
