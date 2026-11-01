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
| `button/internal/ripple-loader.ts`            | `src/material/core/private/ripple-loader.ts` (MatRippleLoader)       | ported     | `rippleLoaderHostAttrs()` (SSR attrs) + `useRippleLoader()` (client lazy-span insertion AND real ripple launching via `core/ripple/`, wired via `useOn()` — see deviations 1 and 12) |
| `button/internal/disabled-attr.ts`            | n/a (Qwik JSX typing workaround)                                     | new        | Renders `disabled="true"` like Angular's `[attr.disabled]` boolean stringification — see deviation 11 |
| `scss/button/button.scss`                     | `src/material/button/button.scss`                                   | synced     | byte-identical copy                                                                       |
| `scss/button/fab.scss`                        | `src/material/button/fab.scss`                                      | synced     | byte-identical copy                                                                       |
| `scss/button/icon-button.scss`                | `src/material/button/icon-button.scss`                              | synced     | byte-identical copy                                                                       |
| `scss/button/button-high-contrast.scss`       | `src/material/button/button-high-contrast.scss`                     | synced     | byte-identical copy                                                                       |
| `scss/button/_button-base.scss`               | `src/material/button/_button-base.scss`                             | synced     | byte-identical copy                                                                       |
| `scss/button/_m2-button.scss` + m3 + theme    | (three underscore partials)                                         | synced     | byte-identical copies                                                                     |
| `scss/button/_m2-fab.scss` + m3 + theme       | (three underscore partials)                                         | synced     | byte-identical copies                                                                     |
| `scss/button/_m2-icon-button.scss` + m3 + theme | (three underscore partials)                                       | synced     | byte-identical copies                                                                     |
| `scss/button/button-prebuilt.scss`            | (Qwik-material-specific)                                            | new        | @use of the four structural files only (the former CSS-only click burst was removed when the real ripple was ported — see deviation 1 below). No `:root` token defaults — removed 2026-10-30 (see core/SYNC.md "Default theme"): button.scss/fab.scss/icon-button.scss only ever reference `--mat-button-*`/`--mat-fab-*`/`--mat-icon-button-*`/`--mat-sys-*`, each already carrying a real M3 fallback baked in via token-utils.slot(); the file's previous `:root` block defined `--mdc-*`-prefixed names that the structural CSS never reads at all (dead), plus a handful of `--mat-sys-*` literals that shadowed the consumer's theme because a `var()` resolves where it's declared (`:root`), not where it's read. The one default theme now ships from `core/default-theme.scss` via `core-prebuilt.css`. |

## Removed upstream files

- `button.html` → inlined into `mat-button.tsx`; breadcrumb at `button.html.removed.md`
- `icon-button.html` → inlined into `mat-icon-button.tsx`; breadcrumb at `icon-button.html.removed.md`
- `button-module.ts` → Qwik has no module concept
- `button-base.ts` → responsibilities split across `mat-button.tsx` / `mat-icon-button.tsx` / `mat-fab-button.tsx` / `mat-mini-fab-button.tsx` (each carries its own base logic inline)

## Deviations from upstream

1. **JS ripple animation ported (2026-10-30, `core/ripple/` remediation).** The static ripple-loader contract (lazy `.mat-ripple` span insertion + `mat-ripple-loader-*` host attributes) was already ported — see `internal/ripple-loader.ts` — and now the actual click-ripple grow/fade animation is too: `useRippleLoader()`'s shared `mousedown`/`touchstart`/`mouseup`/`mouseleave`/`touchend`/`touchcancel` handler (`handleInteraction$`) calls `core/ripple/ripple-dom.ts`'s `handleRippleEvent()` once the lazily-created `.mat-ripple` span exists, launching real `.mat-ripple-element` spans with the same geometry/timing/classes as upstream's `RippleRenderer` (see `core/SYNC.md`'s new ripple section). The `button-prebuilt.scss` CSS-only "click burst" that previously stood in for this has been deleted (it added a `.mat-mdc-button-persistent-ripple::after`/`overflow:hidden` upstream never has — confirmed via the `PARITY_STYLES=1` computed-style gate).
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
13. **`useRippleLoader()`'s ONE handler reference is also wired to `mouseup`/`mouseleave`/`touchend`/`touchcancel`, not just the original four bootstrap events.** (Added 2026-10-30, ripple-animation remediation.) A real `RippleRenderer` needs to know when the pointer is released to end the enter-hold/start the exit transition — upstream's own `RippleRenderer` registers that listener itself, once, ON-DEMAND inside its `mousedown` handler. That exact approach, ported literally, raced and lost on a cold (never-loaded) chunk: Qwik defers a `$()` handler's BODY until its chunk resolves (a real async gap), so a fast real `mouseup` (e.g. any Playwright `.click()`, or just a quick real click) could fire and vanish before the on-demand `addEventListener` call inside the (still-loading) `mousedown` handler ever ran — leaving the ripple's `_isPointerDown` flag permanently `true` and the ripple stuck in `VISIBLE` forever (confirmed live: every `material-checkbox`/`material-radio`/`material-button-toggle` parity scenario's click step failed with a leftover `.mat-ripple-element` after this port's first ripple-animation pass). Fixed by moving pointer-up handling out of `RippleRenderer` entirely (`handlePointerUp()` is now a public method with NO listener of its own — see `core/ripple/ripple-renderer.ts`'s module doc comment) and having every ripple-bearing component instead wire ONE shared `$()` reference to all six pointer events declaratively; qwikloader's own event-prop dispatch is already eager (a real native listener, present from first paint, independent of any one handler's chunk), so the EVENT itself is never missed, and using the identical QRL for both halves of a mousedown/mouseup pair gives Qwik's own promise-cache `.then()` FIFO ordering as the correctness guarantee that `_isPointerDown` is set before it's read. See `core/SYNC.md`'s new ripple section for the full writeup; this applies identically to every OTHER ripple-bearing component this remediation pass touched.

14. **`target` prop added to `MatButton` (2026-10-31, docs-example port).** `button-overview` (material.angular.dev's headline example, ported to `src/qwik-cdk-dev-app/src/routes/mat-button/example/`) uses `<a matButton href target="_blank">`. Upstream's directive attaches to the consumer's own `<a>`, so `target` was always just a plain native attribute Angular never needed to touch; `MatButton` renders the host element itself, so any native anchor attribute beyond `href` has to be an explicit prop. Added `target?: string`, forwarded only on the anchor render path (ignored on `<button>`, same as `href`). No other anchor attributes (`rel`, `download`, …) are exposed yet — same gap, not hit by any current scenario.
15. **`trailingContent` prop added to `MatButton` (2026-10-31, docs-example port).** `badge-overview` (ported to `src/qwik-cdk-dev-app/src/routes/mat-badge/example/`) has `<button matButton matBadge>` — upstream's `[matBadge]` directive attaches directly to the `<button>` host and appends `.mat-badge-content` as its last child, something no plain `<MatBadge as="…">` call (closed `span|div|button|a` enum — see badge/SYNC.md item 7) can do from the OUTSIDE once `MatButton` owns the whole subtree. Added `trailingContent?: JSXOutput`, rendered as the host's real last child, positioned BEFORE the lazily-inserted ripple span specifically (not after): upstream's directive creates its badge span eagerly, well before any interaction, while the ripple span is only ever inserted lazily on first interaction, so in the real DOM the badge span is always the earlier sibling once both exist. The route computes `MatBadge`'s class ladder + content span manually for just the features it needs (content, position, hidden) and passes them through this prop — not a general badge-on-anything API.
16. **`icon` prop added to `MatFabButton`/`MatMiniFabButton` ONLY, not `MatButton` (2026-10-31, docs-example port).** `button-overview`'s plain (non-extended) FAB/Mini-FAB buttons put a real `<MatIcon>` inside — the first scenario to do so (existing `/mat-button/fab`/`mini-fab` routes use plain text/emoji). Upstream's real `button.html` (shared by all three) projects a leading `mat-icon`/`.material-icons`/`[matButtonIcon]` child via a SEPARATE `<ng-content>` ahead of `.mdc-button__label` — BY TYPE, not by source position — so the icon lands OUTSIDE the label in the real DOM, not inside it (confirmed against `src/material/button/button.html`; `button.html.removed.md` only documented the collapsed-into-one-Slot v1 simplification, not this consequence of it). Added `icon?: JSXOutput`, rendered as a direct child before the label — same "named prop instead of slotted children" pattern `MatListItem`/`MatCardHeader` use for by-type projection Qwik can't inspect `<Slot/>` for. **`MatButton` was given, then had, the identical prop reverted**: adding `{props.icon}` ahead of `<Slot/>` there corrupted the Slot's own projection bookkeeping specifically for an instance that ALSO has `trailingContent` AND goes through a click-triggered re-render (`badge-overview`'s "Hide" button) — after the click, `.mdc-button__label`'s projected text vanished from the live DOM entirely (`<!--qv --><!--/qv-->` with no `q:s`/`q:sref` reference, vs. the correct `<!--qv q:s q:sref=… q:key=-->Hide<!--/qv-->` before), even though the SSR'd initial render was correct. Confirmed by reverting just the `{props.icon}` insertion in `mat-button.tsx` — fixed immediately, no other change. Not root-caused (suspected Qwik vnode-diffing edge case combining 3 optional/conditional children around one `<Slot/>` across a re-render); `MatButton` itself has no scenario needing a leading icon, so the prop was simply dropped there rather than chased further. `iconPositionEnd` (icon AFTER the label) isn't exposed on either component — no current scenario needs it.

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

## `disabled="true"` on client-rendered buttons (2026-10-31)

`disabledAttr()` now returns a spread (`{DISABLED: 'true'}`): Qwik's client renderer assigns
known props as DOM properties, so `disabled="true"` on a button rendered after load became
`el.disabled = 'true'`, reflected as `disabled=""`, unlike upstream's `disabled="true"`. The
upper-case key falls through to `setAttribute`, and HTML lower-cases it. Found by the tree docs
example (leaf toggles appear on expand).

## Directive-hook host support (2026-10-31, directive-hooks remediation)

**Item 15 above (`trailingContent`) is REMOVED, replaced.** `trailingContent` was a one-off escape
hatch added for exactly one example's exact needs. The real, general mechanism is now
`qwik-material/core/host-props.ts`'s `HostProps`/`mergeHostProps()` contract ("Composing
directives" in `qwik-material/README.md`): every directive hook
(`useMatMenuTrigger`/`useMatTooltip`/`useMatBadge`/the stepper hooks) returns a `HostProps` bag
meant to be spread directly onto whichever element becomes its host, and `MatButton` (along with
`MatIconButton`/`MatFabButton`/`MatMiniFabButton`) now accepts that bag generically instead of
growing one bespoke prop per directive:

- **`ref?: HostRef`** — forwarded onto the rendered `<a>`/`<button>`. Re-added (deviation 12
  dropped it as unused at the time); `useMatMenuTrigger()`/`useMatTooltip()` both need the live
  host element.
- **`onMouseDown$`/`onMouseEnter$`/`onMouseLeave$`/`onKeyDown$`/`onFocusIn$`/`onFocusOut$`**, all
  `HostHandler`-shaped (a single QRL or Qwik's own `QRLEventHandlerMulti` array form) — forwarded
  as-is onto the host; Qwik composes an array of handlers for the same event natively, so no
  internal guard/wrapping is needed for these (`onClick$` is the one exception — see below).
- **`onClick$` is now `HostHandler<MouseEvent>`, not a plain `QRL`.** `preventDisabledClick$` (the
  `<a>`-path disabled-click guard) now calls through via `callHostHandler()`
  (`core/host-props.ts`) instead of invoking `props.onClick$(e)` directly, since that prop may now
  be an ARRAY of composed handlers (once `mergeHostProps()` has combined two directives' clicks).
- **`hostContent?: JSXOutput`** — the renamed, generalized `trailingContent`: still rendered as the
  host's real last child, BEFORE the lazily-inserted ripple span, for the exact reason item 15
  documented (upstream's directive creates its own appended element eagerly; the ripple span is
  lazy). Now it's the host-side half of ANY directive hook's `content` field
  (`useMatBadge(...).content`), not badge-specific.
- **A generic `[extraAttr: string]: unknown` index signature + `extraHostAttrs()`
  (`core/host-props.ts`)** — lets a directive add an attribute this component has no dedicated
  named prop for (`aria-haspopup`/`aria-expanded`/`aria-controls`, from `useMatMenuTrigger()`)
  without `MatButton` growing a new named prop per directive. Spread FIRST, so this component's
  own explicitly-computed attributes always win for the keys they already set. The one attribute
  with its own named prop (`aria-describedby` ← `ariaDescribedBy`) ALSO merges with an incoming
  `aria-describedby` extra (`props.ariaDescribedBy ?? props['aria-describedby']`) — see
  `tooltip/SYNC.md`'s and `badge/SYNC.md`'s directive-hook sections for the composing directives
  that rely on this.

Verified: the full `specs/material-button` suite, `specs/examples`'s `mat-menu`/`mat-tooltip`/
`mat-badge`/`mat-stepper` examples, and `specs/material-paginator` all stay green across this
change (nothing in the existing API surface changed shape — only additions).

## Directive-hook handlers forwarded via `useOn()` (Qwik v2, 2026-11-01)

The button family forwards `onMouseDown$`/`onMouseEnter$`/`onMouseLeave$`/`onKeyDown$`/
`onFocusIn$`/`onFocusOut$` with `useForwardedHostHandlers(props)` (core/host-props.ts) instead of
JSX props on the root. The root also carries `useOn()` listeners for the same events (ripple
loader, focus origin), and under Qwik v2 those REPLACE a same-named JSX-prop handler on that element
rather than joining it: `useMatTooltip()`'s `mouseenter` on a `<MatButton>` never ran (button's
`q-e:mouseenter` held only the ripple loader's entries). `onClick$` is unaffected (no `useOn('click')`).
