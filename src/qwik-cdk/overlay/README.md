# @angular-community/qwik-cdk/overlay

Qwik port of [@angular/cdk/overlay](https://github.com/angular/components/tree/main/src/cdk/overlay).
Exports `OverlayConfig`, `OverlayRef`, the `Overlay` service factory (`createOverlayService`/`useOverlay`/`OVERLAY`), `OverlayContainer`/`DefaultOverlayContainer`, `OverlayContainerOutlet`, the `OverlayRegistry` types, position strategies (`GlobalPositionStrategy`, `FlexibleConnectedPositionStrategy`, `OverlayPositionBuilder`), scroll strategies (`Noop`, `Block`, `Close`, `Reposition`) + `ScrollStrategyOptions`, and the overlay dispatchers (`OverlayKeyboardDispatcher`, `OverlayOutsideClickDispatcher`).
DOM ownership is moved into `<OverlayContainerOutlet>` (rendered by `<QwikCdkRoot>`); `OverlayRef` is a pure handle that mutates registry signals. See SYNC.md for porting deviations.
