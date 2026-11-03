# qwik-material/bottom-sheet sync log

Tracks the sync state between this port and `src/material/bottom-sheet/` upstream.

Last synced from angular/components commit: v21.2.14 (8fe4d6a8ffcf) as of the 2026-11-02 rebaseline.

## 2026-11-02 rebaseline to v21.2.14 (8fe4d6a8ffcf)

No template/style/behavioral difference found. One incidental fix:
`mat-bottom-sheet-container.tsx`'s `@ts-expect-error` on its scss
side-effect import became an "Unused directive" error (TS2578) under
v21.2.14's pinned TypeScript (5.9.2 vs. 22.1-next's 6.0.2) — removed.

## Real bugs found via live browser testing (not just vitest)

Booting the actual dev-app and driving every scenario with Playwright against a real Chromium
(before the shared Angular reference app was reachable to run the official parity spec)
surfaced two real runtime bugs no unit test alone would have caught:

1. **Enter/exit trigger race.** `[TRIGGER_ENTER]()`/`dismiss()` could run before
   `MatBottomSheetContainer` ever mounted and called `[REGISTER_ANIMATION_HANDLERS]` — writing
   to the shared overlay `entries` signal doesn't render synchronously in Qwik (unlike Angular's
   synchronous `ComponentFactory` attachment). The common "no sheet already open" path triggers
   enter in the same synchronous call as creating the overlay entry, so the request was silently
   dropped. Fixed by making both triggers "sticky" in `mat-bottom-sheet-ref.ts` — see
   `enterRequested`/`exitRequested`. Locked in by two new tests in `mat-bottom-sheet-ref.spec.ts`.
2. **`useContext` crash on every route.** `useMatBottomSheet()` (and the identical pre-existing
   pattern in `useMatDialog()`) crashed SSR as soon as either hook was called from a component
   with no `<QwikMaterialProvider>` ancestor — exactly the `replace-sheet` scenario's "open a
   second sheet from inside the first sheet's own content" (content rendered via
   `<OverlayContainerOutlet>`, a sibling of the routed page under `<QwikCdkRoot>`, not a
   descendant of `<QwikMaterialProvider>`). Root cause: Qwik's `useContext(ctx, defaultValue)`
   treats an explicit `undefined` default the same as no default (throws), AND treats a
   function-typed default as a lazy initializer to invoke immediately — so the natural-looking
   `useContext(SCROLL_STRATEGY, noSerialize(() => createBlockScrollStrategy()))` made Qwik call
   the factory and try to serialize the resulting `ScrollStrategy` instance (function properties
   like `.attach`) during SSR. Fixed in both hooks by defaulting to `null` and substituting the
   real fallback factory afterward in plain JS. No vitest-reachable repro (Qwik's `useContext`
   special-casing only fires through the real optimizer/runtime) — verified instead via a
   throwaway Playwright script against the live dev-app for every one of the 10 scenarios.

## Upstream sync state

| File | Upstream path | Sync state | Notes |
|------|---------------|------------|-------|
| `scss/bottom-sheet/bottom-sheet-container.scss` | `src/material/bottom-sheet/bottom-sheet-container.scss` | synced with one deviation | `@use '@angular/cdk'` rewritten to `@use '../cdk-stub' as cdk` (same convention as `dialog.scss`) |
| `scss/bottom-sheet/_bottom-sheet-theme.scss` | `src/material/bottom-sheet/_bottom-sheet-theme.scss` | synced | byte-identical copy |
| `scss/bottom-sheet/_m2-bottom-sheet.scss` | `src/material/bottom-sheet/_m2-bottom-sheet.scss` | synced | byte-identical copy |
| `scss/bottom-sheet/_m3-bottom-sheet.scss` | `src/material/bottom-sheet/_m3-bottom-sheet.scss` | synced | byte-identical copy |

No new SCSS stubs were needed — every `@use` target (`core/style/elevation`, `core/tokens/{token-utils,m2-utils,m3-utils,m3}`, `core/typography/typography`, `core/theming/inspection`) already exists as a stub from the dialog/button/checkbox/radio ports.

## Synced TypeScript/TSX files

Synced files (mapped from src/material/bottom-sheet/, spec-driven — this is a from-scratch
Qwik port, not a line-for-line translation; see upstream `bottom-sheet-container.html`'s own
near-triviality):

- `mat-bottom-sheet-config.ts` ← `bottom-sheet-config.ts`
- `mat-bottom-sheet-ref.ts` ← `bottom-sheet-ref.ts`
- `mat-bottom-sheet-container.tsx` ← `bottom-sheet-container.ts` + `bottom-sheet-container.html` (the HTML is just `<ng-template cdkPortalOutlet></ng-template>` — folded into this file's `<Slot />`)
- `mat-bottom-sheet.tsx` ← `bottom-sheet.ts`

## Intentionally not ported

- `bottom-sheet-module.ts` (NgModules don't exist in Qwik).
- `bottom-sheet-container.html` (folded into `mat-bottom-sheet-container.tsx`'s JSX).
- `testing/bottom-sheet-harness.ts` + `testing/bottom-sheet-harness-filters.ts` (harness deferred; separate project, same as dialog's).

## Open deviations

- `MatBottomSheet.open(templateRef, …)` removed (no `TemplateRef` in Qwik).
- `MatBottomSheetConfig.viewContainerRef` / `injector` removed (no DI container in Qwik).
- `MatBottomSheetConfig.bindings` (Angular's new signal-input `Binding[]` API, used upstream to
  set inputs on the dynamically-created component) removed — the Qwik-idiomatic equivalent is
  passing props directly to the content `component$`, which this port's `contentProps`
  mechanism already exists for (currently always `{}`, same unused-but-present state as
  `MatDialogWrapper`'s own `contentProps`).
- `MatBottomSheetRef.componentRef` (`ComponentRef<T>`) removed — no `ComponentRef` equivalent in Qwik.
- `MatBottomSheetRef.instance` kept as the upstream field NAME (unlike `MatDialogRef`'s own
  `componentInstance`), but is always `Signal<null>` in practice — nothing in this port's
  architecture ever assigns a rendered content component's instance to it (same pre-existing,
  not-newly-introduced limitation as `MatDialogRef.componentInstance`).
- `MatBottomSheetRef.backdropClick()` / `keydownEvents()` Observables → `MatBottomSheetConfig.onBackdropClick$` / `onKeydown$` / `onOutsidePointer$` QRLs (same deviation already established for `MatDialogConfig`).
- `MatBottomSheetRef.afterDismissed()` / `afterOpened()` methods → `afterDismissed` / `afterOpened` Promise properties.
- Escape/backdrop-click handling relocated from `MatBottomSheetRef`'s own constructor (upstream)
  to `useMatBottomSheet().open$` (service level) — this port bypasses the underlying CDK
  `Dialog`/`DialogRef` machinery those streams came from entirely (same as `useMatDialog()`
  bypasses qwik-cdk's `useDialog()`), so there is no `DialogRef.backdropClick`/`keydownEvents`
  to subscribe to in the first place. No DOM-visible difference.
- ~~`ref.disableClose` is a plain field consumers COULD mutate at runtime… mutating it after open
  has no effect~~ — **fixed 2026-11-03**: `useMatBottomSheet().open$`'s Escape/backdrop-click
  dispatcher closures now read `matRef.disableClose` live (not `merged.disableClose`, a one-time
  snapshot), matching upstream's own `MatBottomSheetRef` constructor exactly. Covered by
  `specs/material-bottom-sheet/backdrop-click-always.spec.ts`'s "mutating … after open" case.
- Hierarchical "currently open sheet" tracking (`MatBottomSheet._parentBottomSheet` /
  `_openedBottomSheetRef` per-injector-level) collapsed to one flat registry per
  `QwikCdkRoot` instance (a `WeakMap` keyed by the shared `QWIK_CDK` context object — see
  `mat-bottom-sheet.tsx`'s `BottomSheetRegistry` doc comment for why a `QwikMaterialProvider`-
  scoped context wouldn't work: provider context doesn't reach the overlay branch rendered by
  `<OverlayContainerOutlet>`, a sibling of the routed page under `<QwikCdkRoot>`, not a
  descendant of `<QwikMaterialProvider>`). No scenario in this port nests multiple
  `<QwikMaterialProvider>`s, so the flattening is unobservable here.
- `MatBottomSheet.ngOnDestroy()` removed (no service-destroy lifecycle hook in Qwik).
- ~~`closeOnNavigation` accepted … but not wired~~ — **fixed 2026-11-03**, see the dedicated
  entry below (same fix as `MatDialogConfig.closeOnNavigation`).
- NgModule `MatBottomSheetModule` removed.
- `MatBottomSheetHarness` deferred.
- SCSS theming mixin (`mat.bottom-sheet-theme`) not exposed until `qwik-material/core` lands.
  Only structural + prebuilt CSS ships (same as every other qwik-material entry point so far).

## DOM parity (angular-parity.spec.ts)

Driven by `docs/superpowers/specs/2026-10-27-qwik-material-dom-parity-remediation-design.md`
and verified against `src/qwik-cdk-parity-tests/specs/material-bottom-sheet/angular-parity.spec.ts`
(header comment documents every scenario and every verified DOM fact). Key structural facts
this port reproduces, all verified against upstream source + the live Angular dev-app (see the
parity spec's header for the full list):

- `<mat-bottom-sheet-container>` host carries BOTH `mat-bottom-sheet-container` (its own class)
  and `cdk-dialog-container` (inherited from the base `CdkDialogContainer` host binding that
  `MatBottomSheetContainer extends` upstream — Angular merges both components' static host
  class strings onto the one element; this port's JSX-composition equivalent lists both
  explicitly, same pattern as `MatDialogContainer`).
- `aria-modal` defaults to `"false"` — `MatBottomSheetConfig`'s own real upstream default,
  deliberately NOT copying `qwik-material/dialog`'s accepted `ariaModal` default-to-`true` drift
  (that drift is dialog-specific; it would be wrong here).
- Container `id="cdk-dialog-#"` always auto-generated with the `cdk-dialog-` prefix (not a
  bottom-sheet-specific prefix) — mirrors the fact that `MatBottomSheetConfig` has no `id` field
  at all; the underlying `Dialog.open()` always mints one when the caller doesn't supply one.
  `useMatBottomSheet().open$` generates it the same way `useMatDialog().open$` generates the
  overlay pane's `cdk-overlay-#` id — from the same shared `ctx.idCounter` sequence.
- Breakpoint classes (`mat-bottom-sheet-container-{medium,large,xlarge}`) via a new, minimal
  `qwik-cdk/layout` (`observeBreakpoints` + `Breakpoints`) — see its own `SYNC.md` for what's
  simplified relative to `BreakpointObserver`/`MediaMatcher`.
- `mat-bottom-sheet-container-animations-enabled` + exactly one of `-enter`/`-exit` (never both,
  and `-enter` is NOT cleared once applied — unlike `MatDialogContainer`'s transient MDC
  opening/open/closing classes, bottom sheet's `_animationState` is a persistent 3-state enum).
- `mat-exit=""` set via a direct, synchronous `setAttribute()` call inside the registered
  `exit()` handler — before Qwik's own class re-render even flushes, matching upstream's
  identical `setAttribute()`-before-`markForCheck()` ordering.
- Enter/exit driven by real `animationstart`/`animationend`/`animationcancel` DOM events against
  the ported CSS `@keyframes _mat-bottom-sheet-{enter,exit}` (not a `parseCssTime` + `setTimeout`
  approximation like `MatDialogContainer` uses) — matches upstream's own event-driven mechanism
  exactly, including the animations-disabled `_simulateAnimation()` fallback (fire start
  synchronously, done on a 0ms timer).
- Focus-trap anchors present in EVERY scenario (not just non-default `autoFocus`) — reuses
  `useFocusTrap` (qwik-cdk/a11y) exactly as `MatDialogContainer` does. `preventScroll` on the
  initial auto-focus move (upstream's `_trapFocus({preventScroll: true})` override) is NOT
  reproduced — it has no DOM-structure effect, only page-scroll behavior, which is out of this
  gate's scope.
- Overlay pane `maxWidth: '100%'` always applied (hardcoded in `MatBottomSheet.open()` upstream,
  not a config field) via the shared `OverlayConfig`/`OverlayHost` machinery — same mechanism
  `MatDialog` already proved out, just with `GlobalPositionStrategy.centerHorizontally().bottom('0')`
  instead of `.centerVertically()`.
- Backdrop class replacement semantics (`backdropClass` REPLACES `cdk-overlay-dark-backdrop`
  rather than adding alongside it) — free from the existing `createOverlayService`/`OverlayHost`
  implementation; no bottom-sheet-specific code needed.

## Scenario port log (mat-bottom-sheet-scenarios.spec.ts)

Source: `src/material/bottom-sheet/bottom-sheet.spec.ts` — 59 `it()` blocks across the top-level
`describe('MatBottomSheet')` plus 2 nested describes inside it (`passing in data`,
`disableClose option`, `hasBackdrop option`, `backdropClass option`, `focus management`) and 2
sibling top-level describes (`MatBottomSheet with parent MatBottomSheet`,
`MatBottomSheet with default options`, `MatBottomSheet with explicit injector provided`).

- Ported (service-level assertions against `createMatBottomSheetService`): 14
- Skipped (DOM-render — deferred to Playwright): 32
- Skipped (Angular-only: DI/TemplateRef/ViewContainerRef/Location/hierarchical injector/Bindings): 13
- Total test nodes in `mat-bottom-sheet-scenarios.spec.ts`: 59 (14 pass + 45 skip)

`mat-bottom-sheet-ref.spec.ts` and `mat-bottom-sheet.spec.ts` additionally unit-test
`createMatBottomSheetRef`/`createMatBottomSheetService` directly (id/config exposure, the
`REGISTER_ANIMATION_HANDLERS`/`TRIGGER_ENTER`/`MARK_OPENED`/`MARK_CLOSED` internal contract,
dismiss idempotency, the replace-sheet singleton flow) — 32 tests, not a 1:1 upstream mapping
(this port's internal animation-trigger contract has no direct upstream equivalent to port
tests from), kept separate from the scenario-log file so that file's bucket-per-upstream-test
shape stays legible against the original.

## Class count

Consumer-facing public API surface: **0 exported classes**. All types are `interface`s; all
constructors are `create*` factories. Verified by:

    grep -nE "^export class" src/qwik-material/bottom-sheet/public-api.ts src/qwik-material/bottom-sheet/index.ts

## Shared pieces added

- **`qwik-cdk/layout`** (new entry point): `Breakpoints` (verbatim data) + `observeBreakpoints()`
  (a minimal, SSR-safe, RxJS/DI-free stand-in for `BreakpointObserver.observe()`). See its own
  `README.md`/`SYNC.md`.
- **`qwik-material/list`'s `MatListItem`** gained an optional `onClick$` prop, forwarded onto
  whichever host tag `as` renders. Needed by the `basic` scenario's nav-list (each
  `<a mat-list-item>` action dismisses the enclosing bottom sheet on click, matching the real
  demo) — upstream attaches `(click)` directly in the consumer's own template, independent of
  the `MatListItem` directive's own metadata; a Qwik `component$` has no such "arbitrary extra
  listener on the host I render" affordance, so it's an explicit prop instead. Backward
  compatible (optional, no behavior change when omitted).
- **`qwik-material/dialog`'s `qwik-material-provider.tsx`** gained
  `matBottomSheetDefaults`/`matBottomSheetScrollStrategyFactory` props, following the exact
  established pattern of every other entry point's config props living there (same file already
  holds `matTabsConfig`, `matSidenavConfig`, etc.).

## `backdropClick` fires regardless of `disableClose`; `componentProps`/`setInput` (2026-11-03)

Same fixes as `qwik-material/dialog` (see its SYNC.md entry of the same name) ported here:

- `useMatBottomSheet().open$`'s outside-click handler now fires `onBackdropClick$` whenever
  there's a backdrop and the click is outside the sheet, unconditionally — previously nested
  inside the same `!disableClose` check gating `dismiss()`. Only the actual `dismiss()` call stays
  gated.
- `MatBottomSheetConfig.componentProps?: Record<string, unknown>` (seeds initial props on the
  opened component) and `MatBottomSheetRef.setInput(name, value)` (reactive update after open),
  built on `OverlayRef.updateProps()` — see `qwik-cdk/overlay/SYNC.md`. `contentProps` was
  previously hard-coded to `{}`. `MAT_BOTTOM_SHEET_DATA` is unaffected.

## `closeOnNavigation` wired (2026-11-03)

Same fix as `qwik-material/dialog`'s entry of the same name: `useMatBottomSheet().open$` now
registers every opened sheet with the shared `OverlayNavigationDispatcher`
(`qwik-cdk/overlay/SYNC.md`) whenever `closeOnNavigation !== false` (the default), dismissing it
on `popstate`/`hashchange` — not on every link click. Deregistered in the existing
`afterDismissed.then(...)` cleanup. Tested end-to-end in
`specs/material-bottom-sheet/close-on-navigation.spec.ts`.

## Pipeline

Run `pnpm test:qwik-material` from the repo root to verify the package (+ `pnpm test:qwik-cdk`
for the new `qwik-cdk/layout`, which has no specs of its own — exercised indirectly via this
port's Playwright specs).
