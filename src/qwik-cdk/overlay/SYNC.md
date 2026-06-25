# Overlay — CDK Sync Notes

## Ported files

| Qwik file | CDK source | Notes |
|-----------|-----------|-------|
| `overlay-config.ts` | `src/cdk/overlay/overlay-config.ts` | Verbatim port. Angular-specific `@angular/core` imports dropped. `NoopScrollStrategy` default for `scrollStrategy` dropped (not ported yet — Task 14+). Class-level property defaults (`hasBackdrop`, `panelClass`, `backdropClass`, `disposeOnNavigation`) removed so the class is plain-data with no runtime dependencies. `Direction`/`Directionality` imported from `../bidi/directionality` instead of `@angular/cdk/bidi`. `usePopover` field retained (future use). |
| `position/connected-position.ts` | `src/cdk/overlay/position/connected-position.ts` | Verbatim copy. `ConnectedPosition` interface added from `flexible-connected-position-strategy.ts` (it belongs with connected-position types). |
| `position/position-strategy.ts` | `src/cdk/overlay/position/position-strategy.ts` | Forward-declaration pattern — uses `PositionStrategyOverlayHandle` instead of `OverlayRef` (which doesn't exist until Task 16). `getPopoverInsertionPoint` added for popover support. |
| `scroll/scroll-strategy.ts` | `src/cdk/overlay/scroll/scroll-strategy.ts` | Forward-declaration pattern — uses `ScrollStrategyOverlayHandle` instead of `OverlayRef`. `getMatScrollStrategyAlreadyAttachedError` helper omitted (can be added alongside concrete strategies). |
| `overlay-context.ts` | n/a (Qwik-specific) | `OverlayContextOverride<T>` type for passing Qwik context values into overlay component trees. |

## Deferred

- Concrete scroll strategies (`NoopScrollStrategy`, `BlockScrollStrategy`, etc.) — Task 14+
- Concrete position strategies (`FlexibleConnectedPositionStrategy`, etc.) — Task 15+
- `OverlayRef` — Task 16
- Once `OverlayRef` exists, `PositionStrategyOverlayHandle` / `ScrollStrategyOverlayHandle` can be merged or replaced with the real type.

---

## Scenario port log (Task 28)

### overlay-container.spec.ts (3 ported / 4 skipped of 7 total CDK scenarios)

Ported (direct-class):
- add/remove css classes from container element (direct API)
- getContainerElement finds existing .cdk-overlay-container in DOM
- getContainerElement returns null when no container exists

Skipped (Angular-only):
- should remove the overlay container element from the DOM on destruction (ngOnDestroy lifecycle)
- should remove overlay containers from the server (platform="server" node scan in DI init)
- should remove overlay containers from other unit tests (platform="test" Karma cleanup)
- should not remove extra containers that were created on the browser (corollary)

---

### overlay.spec.ts (30 ported / 10 skipped of ~70+ total CDK scenarios)

Ported (service-level via createOverlayService registry harness):
- create() returns OverlayRef instance
- create() pushes entry into registry
- create() increments registry entry count
- each created overlay gets unique id
- dispose() removes entry from registry
- panelClass config propagates to entry state
- multiple panelClasses stored as array
- numeric width converted to px string
- string width stored as-is
- numeric/string height stored correctly
- zero width stored as 0px
- minWidth/maxWidth/minHeight/maxHeight numeric → px
- addPanelClass adds class to entry state
- removePanelClass removes class
- addPanelClass does not throw for empty string
- removePanelClass does not throw for empty string
- addPanelClass with array adds all classes
- addPanelClass is idempotent
- addPanelClass does not throw after dispose
- updateSize sets width/height in entry state
- OverlayRef.config returns original OverlayConfig
- overlay.position() returns builder with global() method
- overlay.position() returns builder with flexibleConnectedTo() method

Skipped (DOM-render — requires ComponentPortal/Qwik rendering):
- should load a component into an overlay
- should disable pointer events of the pane element if detached
- should ensure most-recently-attached overlay is on top
- should clear out all DOM element references on dispose
- should add and remove the overlay host as attached/detached
- should do nothing when trying to attach a disposed overlay

Skipped (Angular-only):
- should take the default direction from the global Directionality
- should set the direction
- should be able to dispose an overlay on navigation (Location service)
- should detach a component-based overlay when the view is destroyed

---

### flexible-connected-position-strategy.spec.ts (14 ported / 9 skipped of ~120+ total CDK scenarios)

Ported (pure-JS API surface):
- constructs without error given an origin element
- withPositions sets the preferred positions
- withPositions returns the strategy for chaining
- withLockedPosition / withGrowAfterOpen / withFlexibleDimensions / withPush /
  withViewportMargin / withDefaultOffsetX / withDefaultOffsetY all return strategy (chaining)
- STANDARD_DROPDOWN_BELOW_POSITIONS has expected entry count
- STANDARD_DROPDOWN_ADJACENT_POSITIONS has expected entry count
- attach() does not throw with a valid handle
- should throw when attempting to attach to a second overlay
- dispose() does not throw
- should not throw when trying to apply after being disposed
- dispose() twice does not throw
- detach() clears the overlay ref without error

Skipped (DOM-render — geometry APIs return zeros in happy-dom; math covered by Playwright in Tasks 29/30):
- All ~110+ geometry/pixel-position scenarios (positioning, fallback, bounding box, viewport
  margin, flexible dimensions, push, scroll containers, positionChanges signal, etc.)

---

### global-position-strategy.spec.ts (15 ported / 9 skipped of ~30 total CDK scenarios)

Ported (direct DOM element assertion via host/pane stubs):
- wraps overlay pane in cdk-global-overlay-wrapper element on attach
- centerHorizontally applies margin-left auto on apply
- position to (top, left) with offset
- position to (bottom, right) with offset
- not set any alignment by default
- center the element (H + V)
- center with offsets
- make element position: static
- overwrite previously applied positioning
- not throw when attempting to apply after dispose
- clean up after dispose
- reset horizontal position when width is 100%
- reset vertical position when height is 100%
- not reset horizontal position when width is 100% but maxWidth is set
- position overlay to start/end in LTR

Skipped (DOM-render — requires computed direction from CSS cascade):
- invert justify-content when using left in RTL
- invert justify-content when using right in RTL
- center with offset in RTL
- start/end positioning in RTL

Skipped (deferred — width()/height() are no-ops in qwik-cdk):
- take width/height from overlay config (via position strategy)
- update overlay size when setting through position strategy

Skipped (DOM-render — requires real overlay container):
- remove parent wrapper from DOM on dispose

---

### block-scroll-strategy.spec.ts (6 ported / 7 skipped of 9 total CDK scenarios)

Ported (direct DOM class manipulation):
- sets cdk-global-scrollblock class when enabled
- removes cdk-global-scrollblock when disabled
- enable() is idempotent
- disable() is safe when not enabled
- restores previously-set inline styles after disable
- enable/disable cycle can be repeated

Skipped (DOM-render — window.scroll() / getBoundingClientRect() not functional in happy-dom):
- toggle scroll blocking along y axis
- toggle scroll blocking along x axis
- should not do anything if page is not scrollable
- should not do anything if page is not scrollable while zoomed out
- should add cdk-global-scrollblock while zoomed in
- should keep the content width
- should not clobber user-defined scroll-behavior

---

### close-scroll-strategy.spec.ts (6 ported / 5 skipped of 6 total CDK scenarios)

Ported (direct-class lifecycle):
- should throw if attached to more than one overlay
- enable() registers a scroll listener without throwing
- disable() removes the scroll listener without error
- calling disable() twice does not throw
- calling enable() twice is idempotent
- detach() clears the overlay ref without error

Skipped (DOM-render — real scroll events / CDK ScrollDispatcher required):
- should detach the overlay as soon as the user scrolls
- should not detach if the scrollable is inside the overlay
- should not attempt to detach the overlay after it has been detached
- should be able to reposition the overlay up to a certain threshold before closing
- should not close if the user starts scrolling away and comes back

---

### reposition-scroll-strategy.spec.ts (6 ported / 4 skipped of 6 total CDK scenarios)

Ported (direct-class lifecycle):
- should throw if attached to more than one overlay
- enable() registers a scroll listener without throwing
- disable() removes scroll listener without error
- calling disable() when not enabled does not throw
- calling enable() twice is idempotent
- detach() cleans up without error

Skipped (DOM-render — real scroll events / getBoundingClientRect() required):
- should update the overlay position when the page is scrolled
- should not be updating the position after the overlay is detached
- should not be updating the position after the overlay is destroyed
- should be able to close the overlay once it is out of view

---

### overlay-keyboard-dispatcher.spec.ts (9 ported / 6 skipped of 11 total CDK scenarios)

Ported (direct-class real DOM events):
- routes keydown to topmost attached overlay
- routes keydown to per-ref handler from add(ref, handlers)
- should track keyboard overlays in order as attached and detached
- should dispatch keydown to the most recently attached overlay
- should not add the same keyboard overlay to the stack multiple times
- should skip overlays that do not have keydown event handlers
- should not dispatch to overlay whose eventPredicate does not allow the event
- remove() cleans up from _attachedOverlays
- dispose() detaches global keydown listener without error

Skipped (DOM-render — requires ComponentPortal):
- should not dispatch keyboard events when propagation is stopped

Skipped (Angular-only):
- should complete the keydown stream on dispose (RxJS Subject.complete())
- should stop emitting events to detached overlays (ComponentPortal)
- should stop emitting events to disposed overlays (ComponentPortal)
- should not run change detection (ApplicationRef.tick())
- should dispose of the global keyboard event handler correctly (spy on addEventListener)

---

### overlay-outside-click-dispatcher.spec.ts (10 ported / 9 skipped of 16 total CDK scenarios)

Ported (direct-class real DOM events):
- routes outside click to per-ref handler from add(ref, handlers)
- should track outside click overlays in order as attached and detached
- should not add the same outside click overlay to the stack multiple times
- should dispatch the click event when click is on element outside the overlay
- should not dispatch the click event when click is on element inside the overlay
- should dispatch when pointer-down starts outside and click releases outside
- should not dispatch when pointer-down starts inside the overlay
- should not dispatch to overlays whose eventPredicate does not allow the event
- remove() cleans up from _attachedOverlays
- dispose() detaches global listeners without error

Skipped (Angular-only — ComponentPortal and ApplicationRef.tick()):
- should dispatch mouse click events to all attached overlays
- should dispatch auxiliary button click events
- should dispatch events even when propagation is stopped
- should dispose of the global click event handler correctly (spy on addEventListener)
- should not throw when closing out related components via outsidePointerEvents emitter
- change detection: should not run if no portal attached
- change detection: should not run if no outsidePointerEvents observers
- change detection: should run if click outside overlay with observers

---

### Summary

| File | Ported | Skipped | Source scenarios |
|------|--------|---------|-----------------|
| overlay-container.spec.ts | 3 | 4 | 7 |
| overlay.spec.ts | 30 | 10 | ~70+ |
| flexible-connected-position-strategy.spec.ts | 14 | 9 | ~120+ |
| global-position-strategy.spec.ts | 15 | 9 | ~30 |
| block-scroll-strategy.spec.ts | 6 | 7 | 9 |
| close-scroll-strategy.spec.ts | 6 | 5 | 6 |
| reposition-scroll-strategy.spec.ts | 6 | 4 | 6 |
| overlay-keyboard-dispatcher.spec.ts | 9 | 6 | 11 |
| overlay-outside-click-dispatcher.spec.ts | 10 | 9 | 16 |
| **Total** | **99** | **63** | **~275+** |
