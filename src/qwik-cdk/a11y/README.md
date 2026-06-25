# @angular-community/qwik-cdk/a11y

Qwik port of [@angular/cdk/a11y](https://github.com/angular/components/tree/main/src/cdk/a11y) (focused subset for Dialog).
Exports `_IdGenerator` (stable cross-SSR IDs), `InteractivityChecker`, `InputModalityDetector`, `FocusMonitor`, `FocusTrap`, and the `useFocusTrap` hook with their context IDs and `use*` helpers.
The `LiveAnnouncer`, `cdkAriaLive` directive, `cdkTrapFocus` directive, and `FocusKeyManager`/`ActiveDescendantKeyManager` are deferred. See SYNC.md for porting deviations.
