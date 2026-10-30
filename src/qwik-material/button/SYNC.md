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
| `button/internal/ripple-loader.ts`            | `src/material/core/private/ripple-loader.ts` (MatRippleLoader)       | ported     | `rippleLoaderHostAttrs()` (SSR attrs) + `useRippleLoader()` (client lazy-span insertion, wired via `useOn()` — see deviations 1 and 12) |
| `button/internal/disabled-attr.ts`            | n/a (Qwik JSX typing workaround)                                     | new        | Renders `disabled="true"` like Angular's `[attr.disabled]` boolean stringification — see deviation 11 |
| `scss/button/button.scss`                     | `src/material/button/button.scss`                                   | synced     | byte-identical copy                                                                       |
| `scss/button/fab.scss`                        | `src/material/button/fab.scss`                                      | synced     | byte-identical copy                                                                       |
| `scss/button/icon-button.scss`                | `src/material/button/icon-button.scss`                              | synced     | byte-identical copy                                                                       |
| `scss/button/button-high-contrast.scss`       | `src/material/button/button-high-contrast.scss`                     | synced     | byte-identical copy                                                                       |
| `scss/button/_button-base.scss`               | `src/material/button/_button-base.scss`                             | synced     | byte-identical copy                                                                       |
| `scss/button/_m2-button.scss` + m3 + theme    | (three underscore partials)                                         | synced     | byte-identical copies                                                                     |
| `scss/button/_m2-fab.scss` + m3 + theme       | (three underscore partials)                                         | synced     | byte-identical copies                                                                     |
| `scss/button/_m2-icon-button.scss` + m3 + theme | (three underscore partials)                                       | synced     | byte-identical copies                                                                     |
| `scss/button/button-prebuilt.scss`            | (Qwik-material-specific)                                            | new        | @use of the four structural files + the CSS-only click-burst rule (`.mat-mdc-button-persistent-ripple::after` — untouched by this change; a parallel task owns it). No `:root` token defaults — removed 2026-10-30 (see core/SYNC.md "Default theme"): button.scss/fab.scss/icon-button.scss only ever reference `--mat-button-*`/`--mat-fab-*`/`--mat-icon-button-*`/`--mat-sys-*`, each already carrying a real M3 fallback baked in via token-utils.slot(); the file's previous `:root` block defined `--mdc-*`-prefixed names that the structural CSS never reads at all (dead), plus a handful of `--mat-sys-*` literals that shadowed the consumer's theme because a `var()` resolves where it's declared (`:root`), not where it's read. The one default theme now ships from `core/default-theme.scss` via `core-prebuilt.css`. |

## Removed upstream files

- `button.html` → inlined into `mat-button.tsx`; breadcrumb at `button.html.removed.md`
- `icon-button.html` → inlined into `mat-icon-button.tsx`; breadcrumb at `icon-button.html.removed.md`
- `button-module.ts` → Qwik has no module concept
- `button-base.ts` → responsibilities split across `mat-button.tsx` / `mat-icon-button.tsx` / `mat-fab-button.tsx` / `mat-mini-fab-button.tsx` (each carries its own base logic inline)

## Deviations from upstream

1. **No JS ripple *animation*.** The static ripple-loader contract (lazy `.mat-ripple` span insertion + `mat-ripple-loader-*` host attributes) is ported — see `internal/ripple-loader.ts` — but the actual click-ripple grow/fade animation (`MatRipple`/`RippleRenderer`) is not; the state layer stays CSS-only via the persistent-ripple `<span>` + MDC SCSS `::before` transitions. Follow-up: port `MatRipple` as a first-class qwik-cdk primitive for the animation itself.
2. **Focus-origin classes use `useFocusOrigin()`, not a `FocusMonitor` DI singleton.** (Updated 2026-10-27, lazy-interactions remediation — superseding the original note below.) All four button components call `useFocusOrigin()` (`qwik-cdk/a11y`), a lazy `useOn()`-based hook: it attaches `on:pointerdown`/`on:focusin`/`on:focusout` references to the rendered `<a>`/`<button>` at SSR time, and its JS chunk only loads/runs the first time one of those events actually fires on a given instance — never eagerly on resume. It replaces the button family's earlier `useFocusMonitor(hostRef, {checkChildren: true})` (a `useVisibleTask$`-based hook that has since been deleted from `qwik-cdk/a11y` — see that package's SYNC.md). Rendered DOM (the `cdk-focused`/`cdk-touch-focused`/`cdk-keyboard-focused`/`cdk-mouse-focused`/`cdk-program-focused` classes, derived declaratively into each component's `classes` array since Qwik's `class` prop replaces `className` wholesale on every render) is unchanged from the old hook's output; only the loading strategy differs. `FocusMonitor`/`createFocusMonitor`/`FOCUS_MONITOR` remain in `qwik-cdk/a11y` as the faithful low-level CDK port, for a caller that needs `focusVia()` or a shared engine — neither of which a button needs.
3. **No `showProgress` prop or `[progressIndicator]` slot.** Deferred per scope decision 2026-07-15.
4. **No icon-position slot.** No `<Slot name="icon"/>` before or `<Slot name="icon-end"/>` after the label. Consumers place icons in the default slot at v1.
5. **No `tabIndex` prop.** Qwik JSX forwards `tabIndex` as a standard HTML attribute via the JSX props of the underlying `<button>` / `<a>`.
6. **No `MatAnchor` / `MatIconAnchor` / `MatFabAnchor` / `MatMiniFabAnchor` type aliases.** Upstream declares them as `const X = Y; type X = Y;`; that pattern doesn't map to Qwik's single-render component model. Anchor form is opt-in via `href`.
7. **`_isFab` / `_isAnchor` internal fields not exposed.** Upstream keeps them protected on MatButtonBase; qwik-material's split-into-4-components architecture makes them redundant.
8. **`MAT_FAB_DEFAULT_OPTIONS` folded into `MAT_BUTTON_CONFIG`.** Upstream has a separate injection token for FAB's default color. Qwik-material collapses this into the single `MatButtonConfig.color` field.
9. **`matButtonConfig` field on `QwikMaterialProviderProps`.** Consistent with the dialog port's pattern of gathering component defaults on the single provider.
10. **No `_animationsDisabled` propagation to `.mat-animation-noopable` class.** Rely on the browser's `prefers-reduced-motion: reduce` for now. Follow-up if that's insufficient.
11. **`disabled` attribute rendered via a typed `boolean`-shaped lie (`internal/disabled-attr.ts`).** Upstream's `[attr.disabled]="_getDisabledAttribute()"` binding writes the literal string `disabled="true"` (Angular's attribute renderer stringifies a bound `true`), not the standard empty-string HTML boolean-attribute form (`disabled=""`) Qwik's natively-typed `disabled?: boolean` JSX prop produces. `disabledAttr()` returns the real runtime string through a `boolean | undefined` cast so the DOM matches Angular's exactly while staying inside Qwik's attribute type.
12. **`useRippleLoader()` is lazy via `useOn()`, not a `useVisibleTask$`, and returns a signal rather than mutating the DOM.** (Added 2026-10-27, lazy-interactions remediation, rule 7.) Upstream's `MatRippleLoader` is a root-singleton service with one document-level delegated listener for `focus`/`mousedown`/`mouseenter`/`touchstart`, shared across every ripple-loader host app-wide. A Qwik host has no equivalent app-wide singleton to delegate to, so `useRippleLoader()` instead calls `useOn()` once per event type on the component's own host element — same event list, same shared handler reference, same lazy "only after a real interaction" contract, just distributed per-instance instead of delegated through one listener. The handler's chunk loads/runs on the first qualifying event on *that* host, not on page load/resume regardless of interaction (the previous `useVisibleTask$`-based version's behavior). `useRippleLoader()` returns a `Signal<boolean>` instead of mutating the DOM imperatively (an earlier pass tried the imperative approach and it broke: once MatButton *also* started deriving its `cdk-*-focused` classes from `useFocusOrigin()`'s signal, a single click fires both a ripple-triggering event and a focus event, and the focus signal's write made Qwik reconcile the whole component's vnode tree on the next render — silently undoing the imperative span-insertion/attribute-removal because neither existed in the vnode being reconciled against). The `<span class="mat-ripple …">` is now rendered declaratively as a conditional JSX child, `{rippleInitialized.value && <span .../>}`, as the host's last child. One attribute needed a further workaround: `mat-ripple-loader-uninitialized` must be written as the host's own literal JSX attribute (`mat-ripple-loader-uninitialized={rippleInitialized.value ? undefined : ''}`), *not* folded into `rippleLoaderHostAttrs()`'s spread object — a Qwik JSX spread prop whose value becomes `undefined` after a client-side re-render does not reliably get removed from the live DOM following SSR + resume (confirmed with a minimal repro outside this component), even though the exact same toggle written as a literal attribute expression works correctly; see `internal/ripple-loader.ts`'s doc comments for the full writeup. No `hostRef`/`ref` plumbing is needed any more — `useOn()`'s handler would receive the host element as its second argument if needed — so `ref={hostRef}` was dropped from all four button components' `<a>`/`<button>` JSX along with the now-unused `useSignal` import.

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
