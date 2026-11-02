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

## Open deviations

- FlexibleConnectedPositionStrategy: `positionChanges: Observable<ConnectedOverlayPositionChange>` (CDK) →
  `getPositionChanges(): {value: ConnectedOverlayPositionChange | null}` (qwik-cdk). RxJS eliminated;
  read current change via `.value`. Callers needing a stream can `useTask$(() => track(strategy.getPositionChanges()))`.

---

### flexible-connected-position-strategy.spec.ts (43 ported / 2 skipped of ~120+ total CDK scenarios)

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

Ported (withPopoverLocation / getPopoverInsertionPoint, 6 tests — 2026-10-28, tooltip port):
- defaults to / explicit 'global' → null insertion point
- 'inline' with an Element origin → returns the origin
- 'inline' with a Point origin → null (no Element to anchor to)
- {type: 'parent', element} → returned unchanged
- switching location back to 'global' clears a previously-set 'inline'

**`withPopoverInsertionOrigin(element)` — new, not part of upstream CDK, added
2026-10-29 (select port).** Upstream has no concept of this: a consumer there
only ever has ONE origin (its own `_preferredOverlayOrigin`-equivalent) for
both the position strategy's math AND the popover's insertion point.
`qwik-material/select` genuinely needs these to differ on a select's very
first open (confirmed live: the panel's real pixel position always matches
the form-field wrapper's rect, even on the first open, while the panel's DOM
insertion point is the trigger on that SAME first open — see
`qwik-material/select/SYNC.md`'s "First-open vs. later-open" section for the
full story). When set, `getPopoverInsertionPoint()` returns this element
instead of `setOrigin()`'s own one, for `'inline'` location only; omitting it
(every consumer but select, currently) keeps the exact prior behavior.

Ported (geometry, mocked `getBoundingClientRect()` — 13 tests, 2026-10-28, tooltip port; see the
spec file's header comment for why happy-dom's lack of real layout doesn't actually block this):
- exact position bottom-left of origin, LTR
- exact position top-right of origin, LTR
- exact position honouring RTL (origin.start → its right edge)
- falls back to the next preferred position when the first overflows
- bounding-box sizing for the default (flexible-dimensions) path
- bounding-box width shrinks by the configured viewport margin
- picks the greatest-area flexible fit when nothing fits completely (via a `minWidth` config)
- pushes on-screen when nothing fits and canPush is true
- does not push (uses the fallback as-is) when canPush is false
- applies position.panelClass to the overlay pane
- sets transform-origin on descendants matched by withTransformOriginOn
- reports scroll-clipping against a withScrollableContainers() container
- emits a positionChanges value with the chosen connectionPair after apply()

Skipped (no isolated equivalent in this port — see each test's own comment):
- recompute-on-scroll via a real ScrollDispatcher (qwik-cdk has none; scroll-driven
  repositioning itself is covered by reposition-scroll-strategy.ts + its own spec)
- Safari's zoomed-viewport negative-container-rect quirk (needs a real zoomed browser)

---

### global-position-strategy.spec.ts (15 ported / 9 skipped of ~30 total CDK scenarios)

Ported (direct DOM element assertion via host/pane stubs):
- adds cdk-global-overlay-wrapper class to the host element on attach (2026-10-27: matches
  upstream exactly — no longer a separate child wrapper, see "DOM parity remediation" above)
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

Skipped (N/A as of 2026-10-27 — qwik-cdk no longer creates a parent wrapper; the vitest spec's
"should clean up after itself when disposed" test covers dispose() cleanup directly):
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
| flexible-connected-position-strategy.spec.ts | 43 | 2 | ~120+ |
| global-position-strategy.spec.ts | 15 | 9 | ~30 |
| block-scroll-strategy.spec.ts | 6 | 7 | 9 |
| close-scroll-strategy.spec.ts | 6 | 5 | 6 |
| reposition-scroll-strategy.spec.ts | 6 | 4 | 6 |
| overlay-keyboard-dispatcher.spec.ts | 9 | 6 | 11 |
| overlay-outside-click-dispatcher.spec.ts | 10 | 9 | 16 |
| popover-insertion.spec.ts (new, no CDK equivalent) | 13 | 0 | n/a |
| **Total** | **141** | **56** | **~275+** |

---

## DOM parity remediation (2026-10-27)

Driven by `docs/superpowers/specs/2026-10-27-qwik-material-dom-parity-remediation-design.md`
and verified against `src/qwik-cdk-parity-tests/specs/cdk-dialog/angular-parity.spec.ts` +
`specs/material-dialog/angular-parity.spec.ts`. Upstream reference: `src/cdk/overlay/overlay.ts`,
`overlay-ref.ts`, `backdrop-ref.ts`, `position/global-position-strategy.ts` at the commit this
branch forked from (`a9e5967ae`).

Fixed (previously invented structure, now matches upstream):
- **Host element**: dropped the invented `div.cdk-overlay-host[data-overlay-id]`. The host now
  carries `class="cdk-overlay-popover"` + `popover="manual"` when the Popover API is available
  (feature-detected via `'showPopover' in document.body`, same as `createOverlayRef`), plus
  `dir="ltr"`/`"rtl"`. `GlobalPositionStrategy.attach()` adds `cdk-global-overlay-wrapper` to this
  SAME host element (no extra child wrapper — see below).
- **Pane**: gets `id="cdk-overlay-N"` (the overlay's own id) and `cdk-overlay-pane`; no longer
  missing `position: static` (now applied via `GlobalPositionStrategy.apply()` once attached).
- **Backdrop**: `OverlayConfig.backdropClass` now defaults to `'cdk-overlay-dark-backdrop'` when
  not supplied (`createOverlayService.create()`), matching the upstream `OverlayConfig` class
  default that qwik-cdk's plain-data interface couldn't express.
- **`GlobalPositionStrategy`**: no longer creates a child `.cdk-global-overlay-wrapper` div and
  moves the pane into it. It now adds the wrapper class directly to `handle.hostElement` and
  reads/writes its styles there, matching upstream exactly. `global-position-strategy.spec.ts`
  updated to assert on `ref.hostElement` instead of a child wrapper lookup.
- **Position-strategy attach timing**: `OverlayRef._onAttached()` now calls
  `positionStrategy.attach(ref)` itself (previously `createOverlayRef()` called `attach()` at
  construction time, before `OverlayHost` had rendered real host/pane DOM nodes — `handle
  .hostElement`/`handle.overlayElement` were always `null` at that point, so the strategy's
  `attach()` silently no-opped and `apply()` could never do anything).
- **`OverlayContainerOutlet`**: the `.cdk-overlay-container` element now follows upstream
  `OverlayContainer.getContainerElement()`'s lazy-create-once-then-keep-forever lifecycle instead
  of unmounting whenever the open-overlay count reaches zero. A new `overlayContainerCreated`
  signal on `QwikCdkInternals` (set the first time any overlay is pushed to the registry) gates
  this; before the first overlay, the container doesn't exist at all, matching Angular.
- **Backdrop reactivity after mount**: `OverlayEntryState`'s fields (`backdropShowing`,
  `backdropDetached`, `panelClasses`, size fields) are plain `{value}` carriers, not real Qwik
  signals — the entry is built inside a QRL (`createOverlayService.create()`), where Qwik hooks
  can't run, so nothing observes a later `.value` write. This was invisible for state set *before*
  `OverlayHost`'s first render (the common case), but broke `OverlayRef.detachBackdrop()` (new —
  see below), which fires well after mount. Fixed by having `OverlayHost` own real
  `useSignal()`s for `backdropShowing`/`backdropDetached`, registered with the `OverlayRef` via a
  new third `_onAttached(host, pane, visuals)` parameter (`OverlayVisualCallbacks`). The backdrop
  fade-in (previously a bare `queueMicrotask` in `create()`) moved into `_onAttached()` so it goes
  through the same real-signal path. **Not** generalised to the other `OverlayEntryState` fields
  (`panelClasses`, size) — no current scenario calls `addPanelClass`/`updateSize` after initial
  open, so they remain correct-on-first-render-only; a future consumer that does call them
  post-open from outside the component tree would hit the same non-reactivity bug.
- **`OverlayRef.detachBackdrop()`**: new method, mirroring upstream. Fades/detaches the backdrop
  independently of the rest of the overlay (`detach()` now calls it too, as upstream does).
  Needed so Material dialogs — which delay the pane's own removal for an exit animation — can
  start the backdrop fading immediately on close, before the pane's animation finishes.

Open deviations (unchanged by this pass):
- `updateSize` called on an `OverlayRef` *after* its `OverlayHost` has mounted doesn't reactively
  update the rendered pane (see above) — no scenario currently exercises this, so it's left as a
  known gap rather than fixed here. (`addPanelClass`/`removePanelClass` had the same gap; fixed
  2026-10-28, see below.)

## `FlexibleConnectedPositionStrategy` + reposition scroll strategy (2026-10-28, tooltip port)

Both were already ported (see "Ported files" table above — predates this pass, built as shared
overlay infrastructure ahead of their first real consumer). This pass is `qwik-material/tooltip`
actually exercising `FlexibleConnectedPositionStrategy.apply()` end-to-end in a browser for the
first time (previous consumers — dialog, snack-bar, bottom-sheet — all use
`GlobalPositionStrategy`); that surfaced two real bugs in shared code, both fixed here, neither
specific to tooltip:

- **`addPanelClass`/`removePanelClass` after mount didn't reactively update the rendered pane** —
  the exact bug this file's own "Open deviations" note above already predicted ("a future
  consumer that does call them post-open from outside the component tree would hit the same
  non-reactivity bug"). `FlexibleConnectedPositionStrategy._applyPosition()` calls
  `overlayRef.addPanelClass()`/`removePanelClass()` to add `mat-mdc-tooltip-panel-{above,below,
  left,right}` — always *after* `OverlayHost` has already mounted (its position is only known
  once `apply()` runs, which happens inside `_onAttached()`, called by `OverlayHost` itself).
  Fixed the same way `backdropShowing`/`backdropDetached` already were: added
  `setPanelClasses(classes)` to `OverlayVisualCallbacks` (`overlay-ref.ts`), `OverlayHost` now
  owns a real `useSignal()` for panel classes (`overlay-host.tsx`) instead of reading
  `entry.state.panelClasses.value` directly, and `OverlayRef.addPanelClass`/`removePanelClass`
  call the new `visuals?.setPanelClasses(next)` in addition to updating `entry.state` (kept for
  any other reader of `OverlayEntryState` directly).
- **Popover insertion point was computed but never used.** `PositionStrategy.
  getPopoverInsertionPoint()` and `FlexibleConnectedPositionStrategy.withPopoverLocation()`
  existed, but nothing in `OverlayRef`/`OverlayHost` ever called the former — every popover-mode
  overlay stayed inside `.cdk-overlay-container` regardless of `withPopoverLocation('inline' |
  {type: 'parent', …})`, unlike upstream's `OverlayRef._attachHost()`. No current consumer
  (tooltip always uses `'global'`) needs the other two locations, but `mat-select`'s
  `cdk-connected-overlay` does (`'inline'`, anchoring its popover right next to the trigger it
  opens from) — needed by the upcoming select/autocomplete/datepicker ports this strategy was
  built to share. Added `position/popover-insertion.ts`
  (`resolvePopoverInsertionPoint`/`applyPopoverInsertionPoint`, pure functions — see their own
  doc comments) and wired them into `OverlayHost`'s existing `useVisibleTask$`, right after
  `_onAttached()`: for a popover overlay whose strategy resolves a non-`'global'` insertion
  point, the host (already declaratively rendered as a child of `.cdk-overlay-container` — Qwik
  has no imperative "render into this other DOM node" primitive the way upstream's vanilla-DOM
  `_attachHost()` does) is physically reparented via plain DOM APIs (`insertionPoint.after(host)`
  / `parent.appendChild(host)`), mirroring upstream's one-time move. Qwik's event delegation
  (qwikloader resolves the actual target dynamically at dispatch time, not via a subscription
  fixed at listener-attach time) means this reparent doesn't break any already-wired `on:*`
  handlers on the moved subtree. Covered by `position/popover-insertion.spec.ts`'s pure-function
  unit tests (no live dev-app scenario needs it yet — no tooltip scenario uses a non-`'global'`
  location, and it's shared infrastructure for components not yet ported).
- Also added ~13 real geometry tests to `flexible-connected-position-strategy.spec.ts` using
  `vi.spyOn(el, 'getBoundingClientRect')` + a mocked viewport (exact positioning in LTR/RTL,
  fallback-position selection, viewport margin, flexible-dimension bounding-box sizing, push,
  panel-class application, transform-origin, scroll-clipping, the `positionChanges` signal) and
  6 for `withPopoverLocation`/`getPopoverInsertionPoint` — see that spec file's header comment
  for why the file's original "happy-dom can't do real layout" skip rationale didn't actually
  block mocking the one method (`getBoundingClientRect`) everything else derives from.

## Reparented hosts never actually got torn down (2026-10-29, select port's parity pass)

The note above ("no live dev-app scenario needs it yet") undersold the risk: the reparenting
itself worked (confirmed by `mat-select`'s panel appearing in the right place), but **detaching**
a reparented overlay did not — `mat-select` is the first consumer to exercise a full
open-then-CLOSE cycle for a non-`'global'` popover in a real browser, and closing left the panel
permanently stuck in the live DOM (confirmed live: `.cdk-overlay-popover` still a child of
`<mat-select>`, `.cdk-overlay-container` simultaneously showing 0 children). Root cause:
`OverlayRef.detach()` only ever did `registry.remove(entry.id)`, relying on
`OverlayContainerOutlet`'s list-keyed `ctx.entries.value.map(...)` re-render to find and remove
the corresponding `<OverlayHost>` — which only knows how to look where it ORIGINALLY rendered the
node (inside `.cdk-overlay-container`); once `applyPopoverInsertionPoint` has physically moved it
elsewhere, that lookup finds nothing, so Qwik correctly clears its own container-side bookkeeping
(hence the "0 children" observation) without ever reaching into the orphaned subtree to tear it
down — confirmed live: the detached `MatSelectPanel` kept re-rendering (still subscribed to its
`exiting` signal) well after `detach()` ran.

Fixed in `overlay-ref.ts`/`overlay-host.tsx`: `OverlayHost` now owns a real `detached` signal
(the same `useSignal` + `visuals`-callback pattern `backdropShowing`/`panelClasses` already use,
for the same "`entry.state.*` is a non-reactive plain carrier" reason) and conditionally returns
`null` once it flips true — a component's own per-render output change is torn down via a direct
node reference Qwik still holds, unaffected by where that node currently lives, unlike the
parent's list-keyed removal. `OverlayRef` gained `_onReparented()`, called by `OverlayHost`
exactly when `applyPopoverInsertionPoint` actually relocated the host (never for `'global'`),
which flips `detach()` onto a `visuals.setDetached(true)` path instead of the plain
`registry.remove()`. Confirmed live that `setDetached(true)` and `registry.remove()` can't run in
the same synchronous tick either — the array-shrink observably wins that race, leaving nothing
subscribed to react to the `detached` write — so the registry removal is deferred one
`setTimeout(…, 0)` tick past it (a `queueMicrotask` was tried first and still lost). Both changes
are gated on `reparented` (`false` for every `'global'` consumer — tooltip/menu/dialog), so
`detach()`'s prior synchronous contract, and the unit tests pinning it (`overlay.spec.ts`'s
`dispose() removes the entry from the registry`), are unaffected. See
`qwik-material/select/SYNC.md`'s own write-up for the full root-cause narrative and the two other
(select-local) bugs fixed in the same pass.

## Qwik v2 regression: the above fix's own teardown transition crashes (2026-11-01)

The "Reparented hosts never actually got torn down" fix above (`detach()`'s
`visuals.setDetached(true)` → `OverlayHost` conditional-null-return path) worked correctly under
Qwik v1 (confirmed: 484/484 then 567/568 full-suite runs). Under `@qwik.dev/core` 2.0.0-rc.4 it
throws instead of silently failing: `NotFoundError: Failed to execute 'insertBefore' on 'Node':
the node before which the new node is to be inserted is not a child of this node`, from inside
Qwik's own renderer — confirmed live via a fine-grained Playwright poll (20ms steps) down to the
exact ~100ms mark `mat-select`'s panel exit animation (`_mat-select-exit`, 100ms linear)
completes and `finish()` (select-runtime.ts's `closeSelectPanel`) calls `detachOverlay` →
`ref.detach()`.

Root cause: re-rendering a component specifically to make it return `null` — the whole mechanism
this fix relies on — no longer tolerates the component's DOM node having been externally
relocated (`applyPopoverInsertionPoint`'s raw `Element.after()` call) under v2's vnode-based
renderer. The v1-era guarantee this fix's own comment claimed ("Qwik's per-component diff
handles [this] via a direct node reference, unaffected by where that node currently lives") no
longer holds.

Fixed (minimally — kept the `_onReparented`/`setDetached` wiring in place rather than ripping it
out, in case a future consumer needs it, but no longer calls `visuals.setDetached(true)` for the
reparented case): `detach()` now removes the reparented host element itself, imperatively
(`hostEl?.remove()`), BEFORE the same already-existing deferred (`setTimeout(…, 0)`) registry-
array removal. `OverlayHost` still unmounts correctly, one tick later, via the ordinary list-
shrink path — except now there's no DOM node left at that point for Qwik's own diff to need to
reconcile against a relocated position, so the list-shrink's own node-removal (which, per the
ORIGINAL 2026-10-29 bug this section's parent documents, can't find a relocated node anyway) is
simply a no-op on an already-gone node instead of the entry point for a renderer crash.
Confirmed live: repeated open → close → reopen → close cycles on the same `mat-select` instance
all succeed cleanly with zero console errors, panel count correctly reaching 0 and recovering to
1 on every cycle.

See `qwik-material/select/SYNC.md`'s own "Qwik v2 regressions" section for the full consumer-side
narrative (this was one of two stacked root causes found there) and
`qwik-material/menu/SYNC.md`'s "Qwik v2 regression" section for the SEPARATE "same JSXNode
object rendered a second time, even within the same mount" bug category this is NOT an instance
of (confirmed: `MatSelectPanel`'s `option.content` here is a plain string in every current
select scenario, ruled out directly by removing its only reactive dependency and reproducing the
SAME crash unchanged).
