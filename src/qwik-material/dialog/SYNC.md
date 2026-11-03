# qwik-material/dialog sync log

Tracks the sync state between this port and `src/material/dialog/` upstream.
Every deviation from a verbatim copy is recorded here.

Last synced from angular/components commit: <unsynced — initial port>

## Upstream sync state

| File | Upstream path | Sync state | Notes |
|------|---------------|------------|-------|
| `scss/dialog/dialog.scss` | `src/material/dialog/dialog.scss` | synced with one deviation | `@use '@angular/cdk'` rewritten to `@use '../cdk-stub' as cdk` (sass.compile has no nodePackageImporter; only the high-contrast mixin is called via `cdk.*`) |
| `scss/dialog/_dialog-theme.scss` | `src/material/dialog/_dialog-theme.scss` | synced | byte-identical copy |
| `scss/dialog/_m2-dialog.scss` | `src/material/dialog/_m2-dialog.scss` | synced | byte-identical copy |
| `scss/dialog/_m3-dialog.scss` | `src/material/dialog/_m3-dialog.scss` | synced | byte-identical copy |
| `scss/dialog/_dialog-legacy-padding.scss` | `src/material/dialog/_dialog-legacy-padding.scss` | synced | byte-identical copy |

## Synced TypeScript/TSX files

Synced files (mapped from src/material/dialog/):
- mat-dialog-config.ts ← dialog-config.ts (initial port, spec-driven)
- mat-dialog-ref.ts ← dialog-ref.ts (initial port, spec-driven)
- mat-dialog-container.tsx ← dialog-container.ts + dialog-container.html (initial port, spec-driven)
- mat-dialog.ts ← dialog.ts (initial port, spec-driven)
- mat-dialog-title.tsx ← dialog-content-directives.ts (MatDialogTitle portion)
- mat-dialog-content.tsx ← dialog-content-directives.ts (MatDialogContent portion)
- mat-dialog-actions.tsx ← dialog-content-directives.ts (MatDialogActions portion)
- mat-dialog-close.tsx ← dialog-content-directives.ts (MatDialogClose portion)

## Intentionally not ported

- dialog-module.ts (NgModules don't exist in Qwik)
- dialog-container.html (folded into mat-dialog-container.tsx JSX)
- dialog.zone.spec.ts (NgZone-specific change-detection test — no Qwik analogue)
- testing/dialog-harness.ts + dialog-opener.ts (harness deferred; separate project)

## Open deviations

Open deviations (from spec §10):
- MatDialog.open(templateRef, …) removed (no TemplateRef in Qwik).
- MatDialogConfig.viewContainerRef / injector / componentFactoryResolver removed.
- MatDialogConfig.providers → MatDialogConfig.context (OverlayContextOverride[]).
- MatDialogRef.afterOpened(): Observable → afterOpened: Promise<void>.
- MatDialogRef.afterClosed(): Observable → afterClosed: Promise<R>.
- MatDialogRef.beforeClosed(): Observable → beforeClosed: Promise<R>.
- MatDialogRef.backdropClick(): Observable → MatDialogConfig.onBackdropClick$: QRL.
- MatDialogRef.keydownEvents(): Observable → MatDialogConfig.onKeydown$: QRL.
- MatDialog.afterOpened: Subject removed (derive from openDialogs signal).
- MatDialog.afterAllClosed: Observable removed (derive from openDialogs.value.length === 0).
- MatDialog.ngOnDestroy removed.
- MatDialogContainer._animationStateChanged: EventEmitter removed (internal event).
- MatDialogRef.componentRef: ComponentRef<T> removed.
- MatDialogRef.componentInstance: T → componentInstance: Signal<T | null>.
- NgModule MatDialogModule removed.
- Content directives are Qwik components, not directives.
- Angular Material core's _animationsDisabled() replaced by useAnimationsDisabled().
- MatDialogContainer extends CdkDialogContainer → JSX composition.
- MatDialogHarness deferred.
- SCSS theming mixin (mat.dialog-theme) not exposed until qwik-material/core lands. Only structural + prebuilt CSS ships.

## DOM parity remediation (2026-10-27)

Driven by `docs/superpowers/specs/2026-10-27-qwik-material-dom-parity-remediation-design.md`
and verified against `src/qwik-cdk-parity-tests/specs/material-dialog/angular-parity.spec.ts`.
Upstream reference: `src/material/dialog/{dialog,dialog-container,dialog-content-directives,
dialog-ref}.ts` at the commit this branch forked from.

Fixed (DOM structure — previously-invented/incorrect, now matches upstream):
- `MatDialogContainer`'s host now also carries the `cdk-dialog-container` class. Upstream's
  `MatDialogContainer extends CdkDialogContainer`, so Angular merges both components' host
  class bindings onto the one element (`mat-mdc-dialog-container mdc-dialog` +
  `cdk-dialog-container`); the Qwik port composes via JSX instead of inheritance, so this class
  has to be listed explicitly.
- `aria-modal` default restored to upstream's `false` (was `true` — see qwik-cdk/dialog/SYNC.md,
  same rationale: DOM parity overrides the earlier accepted deviation).
- The overlay pane now gets `mat-mdc-dialog-panel` (`MatDialogRef`'s constructor calls
  `_ref.addPanelClass('mat-mdc-dialog-panel')`; `useMatDialog().open$` now does the equivalent
  `overlayRef.addPanelClass('mat-mdc-dialog-panel')` right after creating the overlay).
- `useMatDialog().open$` now always opens with a fresh, centered `GlobalPositionStrategy`
  (`createGlobalPositionStrategy().centerHorizontally().centerVertically()`), matching upstream
  `MatDialog.open()` — which ignores any CDK-level `positionStrategy` and always builds its own.
  Previously no `positionStrategy` was passed at all, so the overlay host never got
  `cdk-global-overlay-wrapper` / centering styles. `MatDialogRef.updatePosition(position)` now
  actually mutates this strategy (top/bottom/left/right or re-center) instead of being a no-op
  passthrough to `cdkRef.updatePosition()`; `useMatDialog().open$` calls
  `matRef.updatePosition(merged.position)` right after open, mirroring
  `MatDialog.open()`'s `providers` callback.
- `MatDialogContainer` now adds a `--mat-dialog-transition-duration` custom property while
  animations are enabled (enter duration while opening/open, exit duration while closing),
  matching `_startOpenAnimation()`/`_startExitAnimation()`'s `style.setProperty(...)` calls.
- `MatDialogContainer` now calls `useFocusTrap` (qwik-cdk/a11y) — it previously did no focus
  management at all. This is a **real behaviour fix**, not just a DOM-attribute fix: without it,
  Material dialogs never auto-focused on open or restored focus on close (the
  `specs/material-dialog/restore-focus.spec.ts` bug the task called out).
- `MatDialogClose` no longer renders a default `aria-label="Close dialog"` or a
  `class="mat-mdc-dialog-close"` — the real directive's host bindings are
  `'[attr.aria-label]': 'ariaLabel || null'` (no default) and `'[attr.type]': 'type'` only; it
  adds no class of its own (any styling comes from whatever other directive, e.g.
  `mat-icon-button`, the consumer also applies).
- `MatDialogWrapper` now passes `class="mat-mdc-dialog-component-host"` down to the content
  component as a prop (mirroring `MatDialogContainer.attachComponentPortal()`'s
  `ref.location.nativeElement.classList.add('mat-mdc-dialog-component-host')`). Qwik has no
  implicit per-component host element for the content component to receive this class on, so the
  content component must render its own root tag and apply the class itself — see the dev-app
  scenario bodies (`NgComponentHost` in `src/qwik-cdk-dev-app/src/scenarios/_mat-template.tsx`).

Fixed (real behaviour bugs, not just DOM — found via the pre-existing failing Qwik-only specs
`specs/material-dialog/{backdrop-and-escape,close-with-result,restore-focus,animation}.spec.ts`):
- **Escape / backdrop click did not close the dialog, and `afterClosed` never resolved.** Root
  cause: `MatDialogRef.close()` set `state.value = MatDialogState.CLOSING` on a *plain*
  `{value}` object, not a real Qwik signal (`createMatDialogRef` is called from inside a QRL,
  where Qwik hooks like `useSignal`/`useTask$` can't run) — so `MatDialogContainer`'s exit-
  animation `useTask$(({track}) => track(() => matDialogRef.state.value))` never re-ran; nothing
  observed the write. Fixed by removing that reactive dependency entirely: `close()` now calls a
  `requestClose` callback that `MatDialogContainer` installs on mount via a new internal
  `[REGISTER_CLOSE_HANDLER]` method on `MatDialogRef` (same pattern as the existing
  `[MARK_OPENED]`/`[MARK_CLOSED]` internal contract). The container's real `phase` signal (a
  genuine `useSignal` local to that component) drives the exit animation + eventual
  `[MARK_CLOSED]()` call directly, with no cross-QRL-boundary signal dependency.
- Same root cause broke `OverlayRef.detachBackdrop()`'s effect on the rendered backdrop — see
  qwik-cdk/overlay/SYNC.md's "Backdrop reactivity after mount" entry. `MatDialogRef.close()` now
  calls `deps.cdkRef.detachBackdrop?.()` immediately (before delegating to `requestClose`),
  mirroring upstream's `MatDialogRef.close()` → `_containerInstance._animationStateChanged`
  ('closing') → `_ref.overlayRef.detachBackdrop()` chain (collapsed here since qwik-material
  doesn't use RxJS): the backdrop starts fading out as soon as `close()` is called, independent
  of the pane's own exit animation.

## `backdropClick` fires regardless of `disableClose`; `componentProps`/`setInput` (2026-11-03)

Two real bugs/gaps found porting an app's "discard changes?" confirmation flow and dynamic-input
use case:

- **`onBackdropClick$` only fired when `!disableClose`.** Upstream `MatDialogRef.backdropClick()`
  (the real Observable) always emits on every backdrop click, REGARDLESS of `disableClose` — apps
  subscribe to it separately from the ref's own auto-close logic to show a confirmation dialog even
  when the primary dialog can't be dismissed by clicking outside it. `useMatDialog().open$`'s
  outside-click handler previously nested the `onBackdropClick$` call inside the same
  `!merged.disableClose` check that gates `matRef.close()`. Fixed: the callback now fires whenever
  there's a backdrop (`hasBackdrop !== false`) and the click is an outside click, unconditionally;
  only the actual `close()` call is still gated.
- **`MatDialogRef.disableClose` didn't exist as a live field.** Upstream `MatDialogRef` has its own
  public `disableClose: boolean | undefined` field (copied from `config.disableClose` at
  construction), read LIVE by the Escape/backdrop-click handlers on every event — this is what
  upstream's own "should allow for the disableClose option to be updated while open" test mutates
  (`dialogRef.disableClose = false`). This port had no such field; the Escape/backdrop handlers read
  `merged.disableClose` (a closure over the open-time config) instead. Added `disableClose` to
  `MatDialogRef`, initialised from `config.disableClose`; the handlers in `useMatDialog().open$` now
  read `matRef.disableClose` live. `mat-dialog-scenarios.spec.ts`'s "should allow for the
  disableClose option to be updated while open" (previously `it.skip`'d as DOM-render-only) is now
  covered by `specs/material-dialog/backdrop-click-always.spec.ts`.
- **`MatDialogConfig.componentProps` / `MatDialogRef.setInput`.** `contentProps` passed to the
  opened component was hard-coded to `{}` — there was no way to pass data to the content component
  other than `MAT_DIALOG_DATA`. Added `config.componentProps?: Record<string, unknown>` (seeds the
  initial props) and `MatDialogRef.setInput(name, value)` (merges a single prop and pushes the
  result through the overlay reactively — Qwik's replacement for upstream's
  `dialogRef.componentInstance.x = …` / `ComponentRef.setInput`, neither of which apply to a Qwik
  `component$`). Built on `OverlayRef.updateProps()` — see `qwik-cdk/overlay/SYNC.md`. `MAT_DIALOG_DATA`
  is unaffected (orthogonal mechanism). Tested in `mat-dialog-ref.spec.ts` (merge logic) and
  `specs/material-dialog/set-input.spec.ts` (end-to-end reactivity).

## Stub inventory

Stubs are compile-time stand-ins for Angular Material (and CDK) internals that qwik-material has not yet ported. Each stub emits the minimum symbols needed for the dialog SCSS chain to compile; they do **NOT** reproduce upstream behavior. When the corresponding upstream module is eventually ported, the stub should be removed and its callers updated to `@use` the real module.

- `scss/_cdk-stub.scss` — stands in for `@angular/cdk`
- `scss/core/style/_variables.scss` — stands in for `@angular/material/core/style/variables`
- `scss/core/style/_sass-utils.scss` — stands in for `@angular/material/core/style/sass-utils`
- `scss/core/style/_elevation.scss` — stands in for `@angular/material/core/style/elevation`
- `scss/core/theming/_inspection.scss` — stands in for `@angular/material/core/theming/inspection`
- `scss/core/typography/_typography.scss` — stands in for `@angular/material/core/typography/typography`
- `scss/core/tokens/_m2-utils.scss` — stands in for `@angular/material/core/tokens/m2-utils`
- `scss/core/tokens/_token-utils.scss` — stands in for `@angular/material/core/tokens/token-utils`
- `scss/core/tokens/_m3-utils.scss` — stands in for `@angular/material/core/tokens/m3-utils`
- `scss/core/tokens/m3/_md-sys-elevation.scss` — stands in for `@angular/material/core/tokens/m3/md-sys-elevation`
- `scss/core/tokens/m3/_md-sys-state.scss` — stands in for `@angular/material/core/tokens/m3/md-sys-state`
- `scss/core/tokens/m3/_md-sys-color.scss` — stands in for `@angular/material/core/tokens/m3/md-sys-color`
- `scss/core/tokens/m3/_md-sys-shape.scss` — stands in for `@angular/material/core/tokens/m3/md-sys-shape`
- `scss/core/tokens/m3/_md-sys-typescale.scss` — stands in for `@angular/material/core/tokens/m3/md-sys-typescale`
- `scss/core/tokens/m3/_md-sys-motion.scss` — stands in for `@angular/material/core/tokens/m3/md-sys-motion`
- `scss/core/tokens/m3/_theme.scss` — stands in for `@angular/material/core/tokens/m3/theme`

## Remove-when-ported checklist

Each stub represents work deferred to a later qwik-material port. When the corresponding upstream module is ported into qwik-material proper (e.g. `qwik-material/core`), the stub can be removed and its callers updated to `@use` the real module.

- [ ] Remove `scss/_cdk-stub.scss` when `@angular/cdk` ports
- [ ] Remove `scss/core/style/_variables.scss` when `@angular/material/core/style/variables` ports
- [ ] Remove `scss/core/style/_sass-utils.scss` when `@angular/material/core/style/sass-utils` ports
- [ ] Remove `scss/core/style/_elevation.scss` when `@angular/material/core/style/elevation` ports
- [ ] Remove `scss/core/theming/_inspection.scss` when `@angular/material/core/theming/inspection` ports
- [ ] Remove `scss/core/typography/_typography.scss` when `@angular/material/core/typography/typography` ports
- [ ] Remove `scss/core/tokens/_m2-utils.scss` when `@angular/material/core/tokens/m2-utils` ports
- [ ] Remove `scss/core/tokens/_token-utils.scss` when `@angular/material/core/tokens/token-utils` ports
- [ ] Remove `scss/core/tokens/_m3-utils.scss` when `@angular/material/core/tokens/m3-utils` ports
- [ ] Remove `scss/core/tokens/m3/_md-sys-elevation.scss` when `@angular/material/core/tokens/m3/md-sys-elevation` ports
- [ ] Remove `scss/core/tokens/m3/_md-sys-state.scss` when `@angular/material/core/tokens/m3/md-sys-state` ports
- [ ] Remove `scss/core/tokens/m3/_md-sys-color.scss` when `@angular/material/core/tokens/m3/md-sys-color` ports
- [ ] Remove `scss/core/tokens/m3/_md-sys-shape.scss` when `@angular/material/core/tokens/m3/md-sys-shape` ports
- [ ] Remove `scss/core/tokens/m3/_md-sys-typescale.scss` when `@angular/material/core/tokens/m3/md-sys-typescale` ports
- [ ] Remove `scss/core/tokens/m3/_md-sys-motion.scss` when `@angular/material/core/tokens/m3/md-sys-motion` ports
- [ ] Remove `scss/core/tokens/m3/_theme.scss` when `@angular/material/core/tokens/m3/theme` ports

## Prebuilt CSS deviation

qwik-material's `dialog-prebuilt.css` currently ships **structural styles only** (from `dialog.scss`), NOT the theme mixin from `_dialog-theme.scss`. The theme mixin depends on the full Angular Material theming DSL which is out of scope until `qwik-material/core` lands. Consumers who need themed output must `@use` `_dialog-theme.scss` from `scss/dialog/` manually until a `qwik-material/core` prebuilt theme entry lands. This deviation will be echoed in Task 20's finalization.

`dialog-prebuilt.scss` briefly also shipped a `:root` block hardcoding 13 `--mat-sys-*` literals plus 2 `--mat-dialog-*` literals (an old M3 baseline) alongside the structural `@use`. Removed 2026-10-30 (see core/SYNC.md "Default theme") — those literals always won over a consumer's real theme, since a custom property's `var()` resolves where it's *declared* (`:root`), not where it's read. The one default theme now ships from `core/default-theme.scss` via `core-prebuilt.css`.

## Scenario port log (mat-dialog-scenarios.spec.ts)

Source: `src/material/dialog/dialog.spec.ts` — 120 `it()` source lines (11 of those are inside
`runContentElementTests()` which is called twice, giving 131 Angular test executions).

- Ported (service-level assertions against `createMatDialogService`): 16
- Skipped (DOM-render — deferred to Playwright): 77
- Skipped (Angular-only: DI/TemplateRef/NgZone/ChangeDetection/SpyLocation/ngOnDestroy): 39
- Extra Material-only tests (§5 fields + openDialogs signal tracking): 14
- Total test nodes in mat-dialog-scenarios.spec.ts: 146 (30 pass + 116 skip)
- Angular it() source count: 120 (131 executions counting the `runContentElementTests` double-call)

Note: the 16 + 77 + 39 = 132 buckets vs. 131 expected Angular executions differ by 1 because
"should be able to find a dialog by id" was split into two vitest cases (found + unknown-id),
giving one extra ported node. Not double-counted; just a fine-grained expansion of one Angular test.

## Class count

Consumer-facing public API surface: **0 exported classes**. All types are
`interface`s; all constructors are `create*` factories. `MatDialogState` is
an `enum` (not a class). Verified by:

    grep -nE "^export class" src/qwik-material/dialog/public-api.ts src/qwik-material/index.ts src/qwik-material/dialog/index.ts

## Pipeline

Run `pnpm test:qwik-material` from the repo root to verify the package.

## Additions from qwik-material/button port

The following stubs were added by the button port SCSS copy step (Task 2). They live alongside the dialog-port stubs listed above in `## Stub inventory`.

| Stub path                                              | Upstream path                                                         |
| ------------------------------------------------------ | --------------------------------------------------------------------- |
| `scss/core/style/_layout-common.scss`                  | `@angular/material/core/style/layout-common`                          |
| `scss/core/style/_vendor-prefixes.scss`                | `@angular/material/core/style/vendor-prefixes`                        |
| `scss/core/style/_private.scss`                        | `@angular/material/core/style/private`                                |
| `scss/core/focus-indicators/_private.scss`             | `@angular/material/core/focus-indicators/private`                     |
| `scss/core/theming/_theming.scss`                      | `@angular/material/core/theming/theming`                              |
| `scss/progress-spinner/_progress-spinner-theme.scss`   | `@angular/material/progress-spinner/progress-spinner-theme`           |

## `MatDialogContent` gains a `class` prop (2026-11-02, docs-example port)

`dialog-content`'s docs example (src/components-examples/material/dialog/dialog-content/,
ported to `src/qwik-cdk-dev-app/src/routes/examples/dialog-content/`) writes
`<mat-dialog-content class="mat-typography">` — a common Material pattern for enabling
typography styles within a dialog body. `MatDialogContent` took no props at all, so any `class`
written on it was silently dropped (no component in this file read it). Added an optional
`class?: string | ReadonlyArray<string>` prop, merged onto the host alongside the two structural
classes. Upstream needs no dedicated `@Input` for this either — it's just Angular's normal
`[class]`/static-attribute merging on any host element, which a Qwik component has no equivalent
of without an explicit prop (same category as `MatInput`'s `aria-label` gap found porting
`tooltip-delay`, see `qwik-material/input/SYNC.md`).

## Real bug fixed: `enterAnimationDuration`/`exitAnimationDuration: '0ms'` race (2026-11-02, docs-example port)

Found porting `dialog-animations`'s docs example (src/components-examples/material/dialog/
dialog-animations/) — its "without animation" trigger sets `enterAnimationDuration:
exitAnimationDuration: '0ms'`, the first scenario in this port to exercise a literal zero
duration. `mat-dialog-container.tsx`'s open/close animation state machine scheduled the
class-set (`requestAnimationFrame`) and the class-clear (`setTimeout(..., enterMs/exitMs)`) as
two INDEPENDENT, parallel timers. With a 0ms duration, the `setTimeout` (a macrotask) could fire
before the `requestAnimationFrame` callback ever ran (rAF runs at the next repaint, which has no
guaranteed ordering against a 0ms timeout either way) — clearing `openingClass`/`closingClass`
before the rAF's `= true` write, which then had nothing left to clear it. Net effect: live in
the browser, `mdc-dialog--opening` stayed on the container FOREVER for a 0ms-duration dialog
(confirmed via the `examples/dialog-animations` parity scenario, caught by
`specs/examples-misc/angular-parity.spec.ts`'s `dialog-animations (interaction 1)`). Fixed by
nesting each `setTimeout` INSIDE its corresponding `requestAnimationFrame` callback, guaranteeing
the clear always runs after the set, for any duration including 0.

## `closeOnNavigation` wired; `MatDialog.afterAllClosed$` added (2026-11-03)

- `MatDialogConfig.closeOnNavigation` (default `true`) was accepted but never consulted.
  `useMatDialog().open$` now registers every opened dialog with the new
  `OverlayNavigationDispatcher` (`qwik-cdk/overlay/SYNC.md`) whenever `closeOnNavigation !==
  false`, closing it on `popstate`/`hashchange` — NOT on every link click (no router dependency
  to tell a router's own `pushState` call apart from any other). Deregistered in the existing
  `afterClosed.then(...)` cleanup. Tested end-to-end in
  `specs/material-dialog/close-on-navigation.spec.ts` (`history.pushState` + `history.back()`,
  and a real `hashchange`).
- `MatDialog.afterAllClosed$(callback): QRL<() => void>` added — the Qwik-idiomatic replacement
  for upstream's `MatDialog.afterAllClosed` Observable (emits whenever the open-dialog count
  reaches zero; this port's equivalent is a callback-registration method returning an
  unsubscribe QRL, since a one-shot `Promise` — this port's usual Observable replacement — can't
  represent something that fires more than once). Backed by a plain `useSignal<QRL<() =>
  void>[]>` of registered callbacks, invoked from the same `afterClosed.then(...)` handler that
  already maintains `openDialogs`, right after the filtered array becomes empty. Tested in
  `specs/material-dialog/after-all-closed.spec.ts` (opens two dialogs, closes them individually —
  the callback must fire only once, after the SECOND close, not the first).

## Context reaches dialog content (2026-11-03)

`qwik-material-provider.tsx` gained `useQwikMaterialContextSnapshot()`: snapshots every one of
its own ~33 configuration contexts (`QWIK_MATERIAL_CONTEXT_IDS`, kept in that same file so the
two can't silently drift) that resolves to something other than a module-local sentinel — i.e.
every one actually provided somewhere above the call site. `useMatDialog()` calls this at hook-
call time (inside the OPENER's own render) and passes the result through as
`overlayConfig.context` (automatically-carried entries first, then `MatDialogConfig.context` —
the pre-existing, previously-never-wired generic opt-in — so an explicit per-open override always
wins on a conflicting `ContextId`). The actual re-providing happens generically inside
`qwik-cdk/overlay`'s `OverlayHost` — see its own SYNC.md entry ("`OverlayConfig.context` —
context reaching overlay content") for the full mechanism and why it has to work this way (the
dialog's content renders as a sibling of the opener, not a descendant of whatever
`<QwikMaterialProvider>` the opener itself sees). Tested end-to-end in
`specs/material-dialog/context-inheritance.spec.ts` (a `MatFormField` inside the dialog picks up
`appearance: 'outline'` from a provider wrapping the whole route) and that same spec file's
"config.context opts in an app context into the dialog content" case (the generic opt-in, for an
app's own, non-qwik-material context, via the `mat-dialog/custom-context-opt-in` dev-app route).

## Real bug: scroll strategy lost after resume (2026-11-03, found working on qwik-material/menu's scroll-strategy task)

`useMatDialog()`'s `scrollStrategyFactory` (resolved via `useContext(MAT_DIALOG_SCROLL_STRATEGY,
…)` during the hook's OWN render, then captured directly in the `open$` QRL defined at that same
point) does NOT survive into `open$` once it's actually invoked after a REAL SSR→CSR resume
boundary — which every genuine page load goes through. Confirmed live: before this fix,
`open$`'s `if (!merged.scrollStrategy && scrollStrategyFactory) { merged.scrollStrategy =
scrollStrategyFactory(); }` silently did NOTHING post-resume (`scrollStrategyFactory` reads back
`undefined`), leaving `merged.scrollStrategy` (and therefore `overlayConfig.scrollStrategy`)
`undefined` — meaning **background scroll was never blocked while ANY dialog was open**, not
just when a custom factory was configured. This is a real regression from upstream's actual
default behavior (`MatDialog` always blocks background scroll via `MAT_DIALOG_SCROLL_STRATEGY`'s
own default, `createBlockScrollStrategy()`), previously unnoticed because nothing asserted on
`<html>`'s own classes — every DOM-parity check compares the dialog's OWN markup, which this
side effect doesn't touch.

See `qwik-material/menu/SYNC.md`'s "scroll strategy lost after resume" entry for the full
root-cause write-up (same bug, found while wiring an analogous feature for menus) — there's no
cheap workaround for `useContext()` not being callable again from inside the already-invoked
QRL (confirmed live: throws `Code(Q10)`).

Fixed HERE for the default (unconfigured) case only: `open$` now ALWAYS falls back to a fresh
`createBlockScrollStrategy()`, created inline inside the QRL itself (not captured from the lost
context read), whenever `merged.scrollStrategy` is still unset by the time it's needed — instead
of only doing so when the (usually-undefined-post-resume) `scrollStrategyFactory` happens to be
truthy. A CUSTOM `matDialogScrollStrategyFactory` is still silently lost after resume — same
documented, not-yet-fixed customization gap as `qwik-material/menu`'s (a proper fix needs a
`QRL<() => ScrollStrategy>` factory type and an async `open$`). Tested in
`specs/material-dialog/scroll-blocking.spec.ts` (background scroll IS blocked after a real page
load + open, confirmed via the `cdk-global-scrollblock` class `BlockScrollStrategy.enable()`
adds to `<html>`).
