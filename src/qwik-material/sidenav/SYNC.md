# qwik-material/sidenav sync log

Tracks the sync state between this port and `src/material/sidenav/`
upstream. Every deviation from a verbatim copy is recorded here. Companion to
`src/qwik-material/dialog/SYNC.md`, `src/qwik-material/button/SYNC.md`,
`src/qwik-material/card/SYNC.md`, `src/qwik-material/toolbar/SYNC.md`,
`src/qwik-material/badge/SYNC.md`, `src/qwik-material/icon/SYNC.md`,
`src/qwik-material/progress-bar/SYNC.md`,
`src/qwik-material/progress-spinner/SYNC.md`,
`src/qwik-material/divider/SYNC.md`, `src/qwik-material/grid-list/SYNC.md`,
`src/qwik-material/list/SYNC.md`, `src/qwik-material/button-toggle/SYNC.md`,
`src/qwik-material/slide-toggle/SYNC.md`,
`src/qwik-material/expansion/SYNC.md`, and `src/qwik-material/core/SYNC.md`.

## 2026-10-28 initial port

New entry point, gated from the start by
`specs/material-sidenav/angular-parity.spec.ts` per
`docs/superpowers/specs/2026-10-27-qwik-material-remaining-components-roadmap.md`
(wave 2). All 10 Angular-mirror scenarios pass, run 3 times consecutively
clean.

This port found and worked around **five** distinct Qwik limitations/bugs
in this project's pinned `@builder.io/qwik` 1.x version — by far the most
of any component ported so far. They're documented in detail at each call
site (see the files listed below), summarized here:

1. A hoisted `function` declaration referenced from two separate
   `$()`-extracted closures in the same component crashes the Qwik
   optimizer at **build time** (`Cannot read properties of null (reading
   '0')`, an internal diagnostic with no usable message). Fixed by using a
   `const` arrow function instead everywhere in this port.
2. Attaching a real `onTransitionEnd$`/`onTransitionCancel$` DOM listener
   to this component crashes Qwik's SSR container-pause serialization step
   (`QError_verifySerializable`, Code(3)) — reproduced with a trivial
   no-op handler on both a static and a dynamically-typed host tag, so
   it's not specific to this component's logic. Worked around with a fixed
   400ms `setTimeout` (matching the synced SCSS's hardcoded transition
   duration) instead of a real `transitionend` listener.
3. `track()`-ing a plain local `const` computed once from `props` at the
   top of the component (e.g. `const opened = props.opened ?? false;`)
   never re-runs the task on a later prop change — `track()` only
   subscribes to reactive reads made **inside** the tracked callback.
   Fixed by tracking `props.*` directly everywhere, which turns out to be
   the exact same stale-capture pitfall already documented for `$()`
   handlers in `slide-toggle`/`button-toggle`'s SYNC.md, just applying to
   `track()` callbacks too.
4. A re-render triggered solely by one signal flipping (no other tracked
   value changing in the same render) does not reliably reach a
   component's **own host element's** `class`/`style`/attribute, even
   though the component function demonstrably re-executes (confirmed via
   logging — this is not "the task doesn't fire"). Child elements rendered
   fresh each render (a backdrop `<div>`, focus-trap anchors) are
   unaffected — only the host's own attributes on an element that already
   existed from a previous render. Worked around by also applying the
   affected classes/attributes (`mat-drawer-transition`,
   `mat-drawer-opened`, `mat-drawer-animating`,
   `mat-drawer-container-has-open`, content margins, `inert`)
   **imperatively** via `classList`/`style`/`setAttribute`, alongside (not
   instead of) the reactive `classes`/`style` arrays (which still correctly
   cover the very first SSR/resume render and act as a safety net for
   whatever other reason a component might re-render).
   - A plain `useTask$` declared directly in `MatDrawerContainer`/
     `MatDrawerContent` to do this imperative work was separately found to
     **never fire on the client at all** (no errors, just silently never
     invoked) when it both tracked a signal sourced from `useContext()`
     and had no other distinguishing shape. Routing the same work through
     the ONE task in `MatDrawer` that IS confirmed to reliably run (via
     `containerHostRef`/`contentHostRef` fields on the shared context
     state) avoids it.
   - `hostRef.value` during SSR is a non-null SSR-internal node
     placeholder, not a real `HTMLElement` — it has no real `.classList`/
     `.style`. `isBrowser` guards are required before touching either, not
     just an `if (hostRef.value)` truthiness check.
5. Binding `ref=` to a `Signal` sourced from **another component's**
   `useContext()` value never actually populates it (`MatDrawerContent`
   tried to use the container-shared `contentHostRef` signal directly as
   its own `ref`). Fixed by keeping a local `ref` signal and mirroring it
   into the shared context signal via a one-time `useVisibleTask$` copy
   (no `track()` — just a mount-driven assignment, the same justified
   exception category as width measurement below).

A sixth, unrelated bug (not Qwik's): an inline `<style>{...}</style>` JSX
text child gets HTML-entity-escaped (`'` → `&#39;`) by Qwik's SSR
serializer, same as any other text content — breaking a quoted CSS value.
Found while adding a Roboto font-family fallback to `qwik-cdk-dev-app`'s
shell (`src/qwik-cdk-dev-app/src/root.tsx`) so its text metrics match the
Angular dev-app's (needed for `autosize`'s content-sized width to measure
the same in both apps) — fixed by using a font stack with no quoted/
multi-word names.

### A genuine upstream behavioral quirk, verified live (not a Qwik bug)

`autosize`'s drawer starts `[opened]="true"` (a static input) and its
content never gets Angular's `inert` attribute, even though its backdrop
is genuinely shown (`mat-drawer-shown`) — contrast every click-driven open
in `mode-over`/`has-backdrop-false`/`disable-close`, which DO eventually
get `inert`. Root cause, traced through `src/material/sidenav/drawer.ts`:
`MatDrawerContent._drawerToggled()` (which registers the actual 50ms-
delayed `_updateInert()` call) is invoked by `MatDrawer._setOpen()` via
`(this._container?._content || this._container?._userContent)
?._drawerToggled(this)` — but the FIRST time `_setOpen()` runs, for a
drawer whose `opened` is a static input, `_content`/`_userContent`
(`@ContentChild`/`@ViewChild`) haven't resolved yet, so that call is a
no-op, and the subscription is never registered. This is mirrored via
`DrawerRegistration.inertEligible` (`drawer-state.ts`) — `false` only for
a drawer whose `opened` was already `true` on its very first render,
`true` forever after its first REAL (post-mount) opened-state transition
— consulted by the new `isShowingBackdropForInert()`, used ONLY for
`MatDrawerContent`'s `inert` attribute (the backdrop's own
`mat-drawer-shown` class and the focus trap's enabled state are separate
upstream mechanisms, unaffected by this quirk, and still use the
unchanged `isShowingBackdrop()`).

Getting `inertEligible` right itself took two passes: the obvious "becomes
`true` once this isn't the task's first invocation" is wrong, because the
SAME combined task in `mat-drawer.tsx` also re-runs when the
`ResizeObserver`'s initial width measurement lands (unrelated to
`opened`), which was incorrectly graduating it on that alone. Fixed with a
dedicated persistent signal that only flips once `opened` has ACTUALLY
changed relative to its own previously-tracked value.

## Architecture: a shared registry instead of `@ContentChildren`

Upstream's `MatDrawerContainer` reaches into its `MatDrawer` children via
`@ContentChildren(MatDrawer) QueryList` to compute backdrop presence,
content margins, and the has-open class. Qwik has no equivalent query —
and, as design doc rule 1 requires DOM parity (not a scope cut), this port
can't drop the behavior either. Instead, each `MatDrawer`/`MatSidenav`
publishes its own slice of state (`position`/`mode`/`opened`/
`inertEligible`/`disableClose`/`width`/its own `hostRef`/a `requestClose$`
QRL) into a shared registry on `MatDrawerContainerState`
(`drawer-state.ts`), read directly (not through a value the container
precomputes) by `MatDrawerContainer`/`MatDrawerContent`/other
`MatDrawer`s — a plain `Signal<Record<id, DrawerRegistration>>`,
reassigned immutably on every change, **not** `useStore()` (see that
field's own doc comment: this project found, porting `button-toggle`, that
a cross-`<Slot>` consumer only reactively picks up a change when it
dereferences `.value` on a signal that's later reassigned, not from a
`useStore()` deep-proxy or a freshly-built plain object). All the
backdrop/margins/has-open/trap-enabled derivations are pure functions over
this registry (`containerHasBackdrop`, `drawerHasBackdrop`,
`isShowingBackdrop`, `isShowingBackdropForInert`, `hasOpenNonSide`,
`computeContentMargins`, `trapEnabledFor`) — real, DOM-free unit tests in
`drawer-state.spec.ts`.

A would-be simpler design — have each `MatDrawer`'s own registering
`useTask$` reliably patch `MatDrawerContainer`/`MatDrawerContent`'s OWN
attributes from a task declared IN those components — doesn't work, per
Qwik limitation #4 above; see `containerHostRef`/`contentHostRef`'s doc
comments in `drawer-state.ts` for the routing-through-MatDrawer's-task
workaround this port uses instead.

### Focus-trap anchors: declarative, not `createFocusTrap()`/`useFocusTrap()`

Design doc rule 3 ("render state on the server") means the `cdk-focus-
trap-anchor` `<div>`s flanking each drawer must exist in SSR output, not
be inserted imperatively on the client. `qwik-cdk/a11y`'s
`createFocusTrap()`/`useFocusTrap()` inserts its own anchors imperatively
(fine for `CdkDialogContainer`, which is portal-based and never SSR-
rendered) — not a fit here, so `MatDrawerContainer` renders the anchor
`<div>`s itself, declaratively, flanking named `<Slot name="start-drawer">`/
`<Slot name="end-drawer">` slots (Qwik has no equivalent of upstream's
`<ng-content select="mat-drawer, mat-sidenav">`, which reorders by
element selector regardless of source position — named slots stand in,
same pattern `expansion`'s `MatExpansionPanel` already uses). Each
anchor's tab-wrap target search (`getFirstTabbableElement`/
`getLastTabbableElement` in `focus-helpers.ts`) is a small local copy of
`qwik-cdk/a11y/focus-trap/focus-trap.ts`'s private, closure-scoped walk —
not exported there, and not worth upstreaming for one caller; doesn't
replicate the `[cdk-focus-region-*]` marker override, which no scenario's
drawer content uses.

### Why `position="end"` uses a named slot, not a DOM move

Upstream's `MatDrawer._updatePositionInParent('end')` imperatively moves
the drawer's real DOM node to be the container's last child
(`ngAfterViewInit`, before paint). This port instead has the consumer
place a `position="end"` drawer in the container's `end-drawer` named slot
(see `MatDrawerContainerProps`'s doc comment) — the container's own JSX
already puts that slot's content last, achieving the same final DOM order
without any post-render node relocation. The redundancy (the drawer's own
`position` prop AND which slot it's placed in must agree) is a documented,
accepted wart; no runtime validation enforces it.

## Upstream sync state

| File | Upstream path | Sync state | Notes |
| --- | --- | --- | --- |
| `sidenav/mat-drawer.tsx` | `src/material/sidenav/drawer.ts` (`MatDrawer` class) + `drawer.html` + `src/material/sidenav/sidenav.ts` (`MatSidenav extends MatDrawer`) | ported | `createDrawer(hostTag, extraHostClass)` factory parameterizes `MatDrawer`/`MatSidenav`, same pattern `createSpinner()` uses for `MatProgressSpinner`/`MatSpinner`. Controlled component: `opened` prop + `onOpenedChange$`/`onOpened$`/`onClosed$`/`onOpenedStart$`/`onClosedStart$` QRLs, no Qwik equivalent of an `exportAs`-exposed `open()`/`close()`/`toggle()` instance method — a consumer that would write `<mat-drawer #d>` + `d.toggle()` in Angular flips its own `opened` signal directly instead (see every `src/qwik-cdk-dev-app/src/routes/mat-sidenav/*` route). `position`/`mode`/`disableClose`/`autoFocus`/`width` map directly to upstream inputs (`width` replaces upstream's raw `style` binding — every scenario's inline `style` attribute on a drawer is purely a width declaration, see each route). `MatSidenav`-only `fixedInViewport`/`fixedTopGap`/`fixedBottomGap` on `MatSidenavProps`. Renders the `cdkscrollable` bare attribute on the inner container (mirrors `drawer.html`'s `cdkScrollable` directive-selector). See "Qwik limitations" above for the animation-timing/registry-write architecture |
| `sidenav/mat-drawer-container.tsx` | `src/material/sidenav/drawer.ts` (`MatDrawerContainer` class) + `drawer-container.html` + `src/material/sidenav/sidenav.ts` (`MatSidenavContainer extends MatDrawerContainer`) + `sidenav-container.html` | ported | `createContainer(hostTag, extraHostClass)` factory. `autosize`/`hasBackdrop`/`onBackdropClick$` map to upstream inputs/output. The upstream "no explicit `<mat-drawer-content>`? wrap the default content in one" fallback (`@if (!_content)`) is NOT replicated — every consumer must render its own `MatDrawerContent`/`MatSidenavContent` explicitly (true of every scenario this port targets; see `MatDrawerContainerProps`'s doc comment) |
| `sidenav/mat-drawer-content.tsx` | `src/material/sidenav/drawer.ts` (`MatDrawerContent` class) + `src/material/sidenav/sidenav.ts` (`MatSidenavContent extends MatDrawerContent`) | ported | `createContent(hostTag, extraHostClass)` factory. No props beyond `class`/`id` (upstream has none either beyond the base directive's). `_shouldBeHidden()` (SSR-vs-hydration content-jump mitigation, `mat-drawer-content-hidden` class) is NOT ported — see Deviations |
| `sidenav/drawer-state.ts` | (partial — the `MatDrawerContainer`-internal state + computation logic `@ContentChildren` would otherwise drive) | new | Shared registry type + context id + every pure backdrop/margins/trap/inert derivation. See "Architecture" above |
| `sidenav/focus-helpers.ts` | (partial — `qwik-cdk/a11y/focus-trap/focus-trap.ts`'s private tabbable-walk + `MatDrawer._takeFocus()`) | new/ported | Local tabbable-element search (not exported from qwik-cdk) + `applyDrawerAutoFocus()`, a port of `_takeFocus()`'s `autoFocus` switch (minus the `afterNextRender` defer, since this port calls it from an already-settled point, and minus the force-focusable-via-temporary-tabindex fallback for a non-focusable `[cdkFocusInitial]` redirect target, which no scenario uses) |
| `sidenav/sidenav-config.ts` | `src/material/sidenav/drawer.ts` (`MAT_DRAWER_DEFAULT_AUTOSIZE` InjectionToken) | ported | `MatSidenavConfig { autosize?: boolean }`, folded into `QwikMaterialProvider.matSidenavConfig`. See Deviations for why `autosize` is accepted but behaviorally inert in this port |
| `scss/sidenav/drawer.scss` | `src/material/sidenav/drawer.scss` (253 LOC) | synced | Byte-for-byte copy with the one allowed edit: `@use '@angular/cdk';` → `@use '../cdk-stub' as cdk;` (line 1), same stubbing precedent as every other synced component |
| `scss/sidenav/_m2-sidenav.scss` | `src/material/sidenav/_m2-sidenav.scss` | synced | byte-identical copy |
| `scss/sidenav/_m3-sidenav.scss` | `src/material/sidenav/_m3-sidenav.scss` | synced | byte-identical copy; this is the token function `drawer.scss` actually calls for its `$fallbacks` (`m3-sidenav.get-tokens()`, default args) |
| `scss/sidenav/_sidenav-theme.scss` | `src/material/sidenav/_sidenav-theme.scss` | synced | byte-identical copy; theme mixins inert on our end but kept for `diff -q` parity |
| `scss/sidenav/sidenav-prebuilt.scss` | (qwik-material-specific) | new | `@use` drawer.scss only — no `:root` token defaults (removed 2026-10-30, see core/SYNC.md "Default theme"): every `--mat-sidenav-*` token already resolves through a `token-utils.slot(..., var(--mat-sys-*))` fallback chain baked in at Sass-compile time, including the scrim color (falls back to a `color-mix()` against `--mat-sys-neutral-variant20`). The one default theme now ships from `core/default-theme.scss` via `core-prebuilt.css`. The file previously also hardcoded an approximated literal scrim color with no `var()` at all — that's gone too; the structural CSS's own fallback is used instead |

## Removed upstream files

- `sidenav-module.ts` — Qwik has no module concept
- `testing/` (`MatDrawerHarness`/`MatSidenavHarness`/etc.) — Angular test harness surface; no equivalent needed
- Upstream `public-api.ts`/`index.ts` — replaced with our own re-export shape
- `drawer.html`/`drawer-container.html`/`sidenav-container.html` — inlined into JSX
- `drawer.spec.ts`/`sidenav.spec.ts` — ported to `mat-sidenav-scenarios.spec.tsx` (sanity + `describe.skip` DOM/Angular-only documentation blocks) per the project's smoke-only vitest constraint (`createDOM()` hangs this package's vitest worker — see button's own scenario-port comment). Real DOM/behavior coverage lives in `specs/material-sidenav/angular-parity.spec.ts` (Playwright). The pure registry-derived computations (margins, backdrop presence/visibility, trap-enabled, the `inertEligible` quirk) have no DOM dependency and ARE real unit tests, in `drawer-state.spec.ts`
- `throwMatDuplicatedDrawerError` — no runtime validation that at most one drawer per position is registered; not exercised by any scenario and would need extra registry bookkeeping to replicate faithfully

## Deviations from upstream

1. **Controlled component, no `exportAs`/instance methods.** Qwik has no equivalent of a template-ref-exposed `open()`/`close()`/`toggle()`. A consumer flips its own `opened` signal directly instead — see every dev-app route under `src/qwik-cdk-dev-app/src/routes/mat-sidenav/`.
2. **`position="end"` uses a named slot, not an imperative DOM move.** See "Architecture" above.
3. **`autosize` always behaves as if `true`.** This port keeps every drawer's measured width live via a `ResizeObserver` unconditionally (needed anyway for the non-autosize scenarios' initial render — a drawer's width can't be known any other way in Qwik). The `autosize` prop is still accepted (and still defaults from `MAT_DRAWER_DEFAULT_AUTOSIZE`'s equivalent config) for API parity, but has no further behavioral effect here, unlike upstream's `ngDoCheck`-gated continuous remeasurement.
4. **`mat-drawer-container-has-open` is a plain OR across non-side drawers, not upstream's actual per-drawer-event "last write wins".** Upstream's `_setContainerClass(drawer.opened)` is called from EACH non-side drawer's own `openedChange`, toggling the SAME class based on whichever drawer's event fired most recently — with two independently-toggling non-side drawers, this can differ from a true OR. No scenario has two non-side drawers (the only two-drawer scenario, `two-drawers`, uses side mode for both), so this simplification is unverifiable either way and was chosen as simpler/more predictable.
5. **`MatDrawerContent._shouldBeHidden()` (the `mat-drawer-content-hidden` SSR-vs-hydration content-jump mitigation) is not ported.** Upstream only ever returns `true` when `!platform.isBrowser` — i.e. during Angular Universal's SSR render, never once the app is actually running in a browser (CSR or post-hydration). Since both the Angular and Qwik dev-apps serve this comparison from an already-interactive browser tab, no scenario can ever observe this class on the Angular side regardless, and Qwik's resumability model doesn't have an equivalent "static SSR snapshot that will imminently hydrate and needs a jump-free placeholder" moment to apply it at either.
6. **No validation that at most one drawer per position is registered.** See "Removed upstream files" above.
7. **Focus-management timing is simplified relative to upstream's split between an immediate (synchronous, un-delayed) close-time restore-focus and a delayed (animation-settled) open-time auto-focus.** This port settles BOTH auto-focus-on-open and restore-focus-on-close from the same animation-settled point. Deliberate: no parity scenario's structural DOM diff is sensitive to which node currently holds focus (the parity spec's own header comment confirms this explicitly), and the ~400ms difference is imperceptible to a real user.
8. **Restoring focus to the "previously focused" element uses plain `.focus()`, not `focusVia()`.** `focusVia()`'s pending-origin handoff attribute (`data-cdk-pending-focus-origin`) is only ever consumed by a `useFocusOrigin()` listener on the SAME element; a plain consumer-provided `<button>` (every scenario here) has none, so the attribute would leak into the compared DOM forever. Behaviorally identical for every scenario here either way (a plain, unmonitored button gets no `cdk-*-focused` classes from upstream's real `FocusMonitor` either).
9. **Angular-specific removals:** `@Input()` decorators + `coerceBooleanProperty`/`coerceNumberProperty` → TypeScript prop types + plain prop passthrough; `AfterViewInit`/`AfterContentInit`/`DoCheck`/`OnDestroy` lifecycle → no lifecycle, reactive `useTask$`/`useVisibleTask$` instead; `FocusTrapFactory`/`FocusMonitor`/`InteractivityChecker` DI tokens → the local `focus-helpers.ts` + `qwik-cdk/a11y`'s already-ported `createInteractivityChecker()`; `Renderer2`-based `keydown`/`transitionend`/`transitioncancel` listeners outside `NgZone` → a lazy, resumable `useOn('keydown', ...)` (see "Qwik v2 regressions" below for why it's `useOn`, not a JSX `onKeyDown$` prop, as of 2026-11-01) + the fixed-timer workaround for the transition events (Qwik limitation #2 above); `providers: [{provide: MAT_DRAWER_CONTAINER, useExisting: ...}]`/`{provide: MatDrawer, useExisting: MatSidenav}` → the shared `MAT_DRAWER_CONTAINER_STATE` context; `exportAs` → N/A; `ViewEncapsulation.None` + host bindings → plain JSX attribute/class passthrough.

## Class count

`grep -rnE "^export class" src/qwik-material/sidenav/ 2>/dev/null`
→ 0 (no exported classes on the consumer surface).

## Pipeline

`pnpm test:qwik-material` at the repo root runs `build && vitest &&
lint:no-ssr-leaks && typecheck` for the whole qwik-material package,
covering dialog + button + card + toolbar + badge + icon + progress-bar +
progress-spinner + divider + grid-list + list + button-toggle +
slide-toggle + expansion + sidenav + core.

## Qwik v2 regressions (2026-11-01)

Upgrading to `@qwik.dev/core@2.0.0-rc.4` broke 10/10 `material-sidenav` parity
scenarios, for THREE unrelated reasons:

1. **`onKeyDown$={...}` on `<MatDrawer>`'s dynamic host tag stopped being
   wired as an event listener at all** — it got serialized as a literal
   `onKeyDown$="<function source>"` DOM attribute instead of a `q-e:keydown`
   listener (so Escape stopped closing anything). `mat-drawer.tsx` and
   `mat-progress-spinner.tsx` both render their host via a
   `hostTag as unknown as FunctionComponent<...>` alias (so the SAME
   component can emit `<mat-drawer>` or `<mat-sidenav>`, `<mat-spinner>` or
   `<mat-progress-spinner>`) — under v2, the compiler's "is this prop an
   event handler" recognition apparently doesn't apply the same way to a
   JSX element whose tag is a variable rather than a literal lowercase
   name. (Only `mat-drawer.tsx` had an event prop on this host — the other
   three dynamic-host-tag components in this package attach none, so they
   weren't affected.) Fixed by attaching it with `useOn('keydown', ...)`
   instead (same category of hook `useFocusOrigin()` already relies on for
   this exact reason — it attaches directly to the component's own host
   element via Qwik's imperative API, bypassing JSX prop analysis
   entirely).
2. **The backdrop `<div>` — the FIRST JSX child of `<MatDrawerContainer>` —
   landed as the LAST DOM child instead**, on every scenario where it (and
   the focus-trap anchors around it) only start existing once a
   registering `<MatDrawer>`'s own task has populated the shared
   `registry` signal (which happens strictly after this container's first
   SSR render — the raw SSR HTML has no backdrop/anchor at all). That
   makes the backdrop's first real appearance a brand-new PREPEND into a
   parent that already has other children (`<mat-drawer>`/
   `<mat-drawer-content>`, present via `<Slot>` since SSR) — and under v2
   that shape (a new leading child with no prior sibling, while other new
   siblings insert in the very same pass) lands at the wrong spot.
   `key`-ing every conditional sibling did not change this. Fixed with a
   `useVisibleTask$` on `<MatDrawerContainer>` that, whenever the tracked
   `registry`/`backdropOverride` say the backdrop should show, explicitly
   `insertBefore`s it back to `parent.firstChild` if it isn't already
   there — the same imperative-escape-hatch category this file already
   uses for `mat-drawer-transition`'s class toggle.
3. **`<MatDrawerContent>`'s `inert` attribute lost its deliberately-literal
   `"true"` string value.** Qwik v2 added `inert` to its own hard-coded
   boolean-attribute list (`isBooleanAttr` in core — the same category
   `checked`/`disabled`/`required` are already in), so a declarative JSX
   `inert={someTruthyValue}` prop now unconditionally reflects through
   `element.inert = true`'s own IDL behavior, producing the bare `inert=""`
   form instead. This component specifically needs the literal string
   (matching upstream's own imperative `setAttribute('inert', 'true')`
   call — see the remaining doc comment at its removal site). Already had
   TWO imperative paths covering mount and every subsequent update (this
   component's own mount `useVisibleTask$`, `<MatDrawer>`'s registration
   task) — the declarative JSX prop was redundant with those AND now wrong
   under v2, so it was removed rather than patched.

None of these three are a shared-`qwik-cdk` fix (not focus-trap/overlay
code — `FocusTrapAnchor` here is a small LOCAL component, not
`qwik-cdk/a11y`'s real focus trap) — all three are local to
`qwik-material/sidenav`.

## Dev-app shell change (not sidenav-specific, but found while porting it)

`src/qwik-cdk-dev-app/src/root.tsx` now loads the Roboto webfont + a `body`
`font-family` fallback, matching the Angular dev-app's own. Without it,
this app's unstyled text (e.g. plain `<p>`/`<button>` content, as every
`mat-sidenav` scenario uses) falls back to the browser's serif UA default
instead of a sans-serif stack, which measurably changes `offsetWidth` for
any scenario whose content sizes itself to that text — found via
`autosize`'s content-sized drawer, but would affect any future scenario
with the same shape. See root.tsx's own doc comment for the quote-escaping
pitfall hit along the way.
