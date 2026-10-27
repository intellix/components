# Sync log: dialog
Last synced from angular/components commit: <unsynced>

Synced files:
- dialog-config.ts ← src/cdk/dialog/dialog-config.ts (initial port, qwik-cdk spec-driven)

Intentionally not ported:
- dialog-module.ts (NgModules don't exist in Qwik)
- dialog-container.html (placeholder for future tasks)

Open deviations:
- dialog.ts: `open()` does not accept TemplateRef (no TemplateRef in Qwik).
  Accepts a Qwik Component reference only.
- DialogConfig: `viewContainerRef` field removed (no ViewContainerRef in Qwik).
- DialogConfig: `providers` replaced by `context: OverlayContextOverride[]`
  (Angular DI vs Qwik contexts).
- DialogConfig: `bindings` field removed (Angular-specific Signal bindings via input).
- DialogConfig: `directives` field removed (no directives in Qwik).
- DialogConfig: `projectableNodes` field removed (no content projection API like Angular's).
- DialogRef: `closed: Observable<R>` → `Promise<R>` (idiomatic Qwik; one-shot event).
- DialogRef: `backdropClick: Observable` → `DialogConfig.onBackdropClick$: QRL`
  (avoid RxJS, surface in idiomatic shape).
- DialogRef: `keydownEvents: Observable` → `DialogConfig.onKeydown$: QRL` (same).
- DialogRef: `outsidePointerEvents: Observable` → `DialogConfig.onOutsidePointer$: QRL`
  (same).
- Dialog: `afterOpened: Subject` → `<QwikCdkRoot onDialogOpened$>` callback + `openDialogs`
  signal on the Dialog service (avoid RxJS, surface in idiomatic shape).
- Dialog: `afterAllClosed: Observable` → `<QwikCdkRoot onAllDialogsClosed$>` callback (same).

Fixed 2026-10-27 (DOM parity remediation — see
docs/superpowers/specs/2026-10-27-qwik-material-dom-parity-remediation-design.md; these
previously-accepted deviations are undone, DOM parity overrides the earlier judgment calls):
- DialogConfig: `ariaModal` default restored to upstream's `false` (was `true`).
  `CdkDialogContainer` applies `aria-modal={config.ariaModal ?? false}`.
- DialogConfig.autoFocus: `useFocusTrap` (qwik-cdk/a11y) now takes the full
  `'dialog' | 'first-tabbable' | 'first-heading' | string selector | boolean` union — matching
  CDK's `_trapFocus()` switch exactly, including `_forceFocus()`'s temporary `tabindex="-1"` for
  non-natively-focusable targets (e.g. `'first-heading'` landing on an `<h2>`). `autoFocus` is no
  longer simplified to a boolean.
- DialogConfig.restoreFocus: `restoreFocus: false` now actually opts out (passed through to
  `useFocusTrap({restoreFocus: config.restoreFocus !== false})`). String/`HTMLElement` values are
  still treated as "restore" (truthy) rather than restoring to that specific target — CDK's
  fine-grained restore-target selection is not ported.
- `CdkDialogContainer` now renders `<cdk-dialog-container>` (was a plain `<div>`), has
  `id={config.id}`, and no longer echoes `panelClass` onto its own class list (that belongs on
  the overlay *pane*, not the container — see qwik-cdk/overlay/SYNC.md).
- `Dialog.open()` (via `createDialogService`) now defaults `positionStrategy` to a centered
  `GlobalPositionStrategy` when the caller doesn't supply one, matching upstream
  `Dialog._getOverlayConfig()`. Previously no default was applied at all, so every dialog's
  overlay host never got `cdk-global-overlay-wrapper` / centering styles.
- Focus trap anchors now carry `cdk-visually-hidden` (in addition to `cdk-focus-trap-anchor`),
  matching `FocusTrap._createAnchor()`.

Scenario port log (dialog.spec.ts) — 38 ported / 53 skipped of 78 CDK source scenarios
(plus 13 extra service-level tests added beyond direct CDK equivalents):

Ported (service-level):
- "should close a dialog and get back a result" (CDK line 174)
- "should only emit the afterCloseEvent once when closed" (CDK line 187, adapted as Promise)
- "should close a dialog via the escape key" (CDK line 199)
- "should not close a dialog via the escape key if a modifier is pressed" (CDK line 210)
- "should track open dialogs via openDialogs signal" (CDK line 300 analogue)
- "should remove closed dialogs from openDialogs signal" (CDK line 310 analogue)
- "should report zero open dialogs when none are open" (CDK line 332 analogue)
- "should override the width of the overlay pane" (CDK line 340)
- "should override the height of the overlay pane" (CDK line 352)
- "should override the min-width of the overlay pane" (CDK line 364)
- "should override the max-width of the overlay pane" (CDK line 376)
- "should override the min-height of the overlay pane" (CDK line 399)
- "should override the max-height of the overlay pane" (CDK line 411)
- "should allow for the dimensions to be updated via updateSize" (CDK line 435)
- "should close all of the dialogs" (CDK line 475)
- "should invoke closed callback when dialog closes" (CDK line 545, adapted)
- "should be able to pass in data" (CDK line 590, via ref.config.data)
- "should default to null/undefined if no data is passed" (CDK line 604)
- "should start with a null componentInstance before DOM attach" (CDK line 622, adapted)
- "should close dialog and mark isOpen false" (CDK line 622, adapted)
- "should assign a unique id to each dialog" (CDK line 637)
- "should auto-generate ids that start with cdk-dialog-" (CDK line 637, pattern check)
- "should allow for the id to be overwritten" (CDK line 646)
- "should be able to find a dialog by id" (CDK line 656)
- "should return undefined for a dialog id that does not exist" (CDK line 656, inverse)
- "should throw when trying to open a dialog with the same id as another dialog" (CDK line 651)
- "should prevent closing via the escape key when disableClose is true" (CDK line 704)
- "should allow closing after disableClose is set to false" (CDK line 717)
- "should apply panelClass to the overlay entry panelClasses state" (CDK line 949, service-level)
- "should support adding a panel class after open" (CDK line 949, addPanelClass)
- "should support removing a panel class after open" (CDK line 949, removePanelClass)
- "should track openDialogs reactively: open adds, close removes" (extra)
- "should open multiple dialogs and close them individually" (extra)
- "should pass result through when closing" (extra)
- "should resolve closed with undefined when no result passed" (extra)
- "should not close an already-closed dialog again" (extra)
- "should use default config values when none provided" (extra)
- "should override default config with per-open config" (extra)

Skipped (DOM-render — deferred until JSDOM infra fix or Playwright covers):
- "should open a dialog with a component" (CDK line 63)
- "should be able to set aria-modal" (CDK line 82)
- "should open a dialog with a component and no ViewContainerRef" (CDK line 142)
- "should apply the configured role to the dialog element" (CDK line 156)
- "should apply the specified aria-describedby" (CDK line 165)
- "should close when clicking on the overlay backdrop" (CDK line 245)
- "should emit the backdropClick stream when clicking on the overlay backdrop" (CDK line 257)
- "should emit the keyboardEvent stream when key events target the overlay" (CDK line 282)
- "should be able to customize the position strategy" (CDK line 423)
- "should allow setting the layout direction" (CDK line 449)
- "should recapture focus to the first tabbable element when clicking on the backdrop" (CDK line 661)
- "should prevent closing via clicks on the backdrop" (CDK line 689)
- "should allow for the disableClose option to be updated while open" (DOM variant, CDK line 717)
- "should recapture focus … while closePredicate is blocking" (CDK line 892)
- "should have a backdrop" (CDK line 925)
- "should not have a backdrop" (CDK line 936)
- "should have custom panel class" (CDK line 949, DOM check only)
- "should have default backdrop class" (CDK line 962)
- "should have custom backdrop class" (CDK line 973)
- "should focus the first tabbable element of the dialog on open" (CDK line 990)
- "should focus the dialog element on open" (CDK line 1002)
- "should focus the first header element on open" (CDK line 1019)
- "should focus the first element that matches the css selector from autoFocus on open" (CDK line 1036)
- "should re-focus trigger element when dialog closes" (CDK line 1053)
- "should re-focus trigger element inside the shadow DOM when dialog closes" (CDK line 1079)
- "should allow the consumer to shift focus in afterClosed" (CDK line 1103)
- "should move focus to the container if there are no focusable elements in the dialog" (CDK line 1130)
- "should allow for focus restoration to be disabled" (CDK line 1140)
- "should allow for focus to be restored to an element matching a selector" (CDK line 1163)
- "should allow for focus to be restored to a specific DOM node" (CDK line 1185)
- "should be able to set a custom aria-label" (CDK line 1209)
- "should not set the aria-labelledby automatically if it has an aria-label" (CDK line 1220)

Skipped (Angular-only — no Qwik analogue):
- "should open a dialog with a template" (CDK line 93) — no TemplateRef in Qwik
- "should use injector from viewContainerRef for DialogInjector" (CDK line 118) — no ViewContainerRef
- "should use custom injector" (CDK line 133) — no Angular DI Injector.create
- "should close from a ViewContainerRef with OnPush change detection" (CDK line 222) — OnPush/ViewContainerRef
- "should inject the correct layout direction in the component instance" (CDK line 459) — Directionality inject
- "should fall back to injecting the global direction if none is passed by the config" (CDK line 467) — same
- "should complete the closed stream on destroy" (CDK line 576) — RxJS Observable.complete
- "should be able to apply bindings" (CDK line 612) — Angular-specific inputBinding()
- "should work when opening from a template" (CDK line 737) — TemplateRef
- "should fall back to node injector in template dialog" (CDK line 754) — template injector fallback

Skipped (deferred — not yet implemented):
- "should close all dialogs when the user goes forwards/backwards in history" (CDK line 491) — closeOnNavigation
- "should close all open dialogs when the location hash changes" (CDK line 508) — closeOnNavigation
- "should close the dialog when detached externally" (CDK line 523) — CloseScrollStrategy integration
- "should close all open dialogs on destroy" (CDK line 563) — Dialog service destroy lifecycle
- "should determine whether closing via the backdrop is allowed" (CDK line 776) — closePredicate not wired
- "should determine whether closing via the escape key is allowed" (CDK line 804) — same
- "should determine whether closing via the close method is allowed" (CDK line 831) — same
- "should not be closed by closeAll if not allowed by the predicate" (CDK line 859) — same
- "should close dialogs opened by a parent when calling closeAll on a child Dialog" (CDK line 1264) — multi-Dialog hierarchy
- "should close dialogs opened by a child when calling closeAll on a parent Dialog" (CDK line 1280) — same
- "should not close the parent dialogs, when a child is destroyed" (CDK line 1296) — same
- "should close the top dialog via the escape key" (CDK line 1312) — multi-Dialog hierarchy

Implementation fix applied in this task:
- dialog.tsx: added hasModifierKey() check to Escape key handler — closes only when no
  modifier keys are held, matching CDK dialog-ref.ts line 73 behaviour.

Total: 37 ported / 54 skipped of 78 CDK source scenarios (+ 13 extra service-level tests).

## Dispatchers created on demand (2026-10-27)

`useDialog().open$` and `useMatDialog().open$` used to return `null` when
`<QwikCdkRoot>`'s visible task had not yet created the overlay keyboard /
outside-click dispatchers. Visible tasks run in no guaranteed order, so a
dialog opened from another visible task intermittently never opened.
`ensureCdkDispatchers()` (`internals/ensure-dispatchers.ts`) now creates them on
first use; the root task reuses them and disposes them on teardown.
