# button.html — removed

Upstream `src/material/button/button.html` is inlined into `mat-button.tsx`
as JSX per the qwik-material file-naming rule. The upstream template has
five elements:

1. `<span class="mat-mdc-button-persistent-ripple">` — rendered via `<PersistentRipple isFab={false}/>`
2. `<ng-content select=".material-icons:not([iconPositionEnd])...">` — collapsed into the default `<Slot/>` for v1 (icon-position slot deferred; see SYNC.md)
3. `<span class="mdc-button__label"><ng-content></ng-content></span>` — inlined as `<span class="mdc-button__label"><Slot/></span>`
4. `<span class="mat-focus-indicator">` — rendered via `<FocusIndicator/>`
5. `<span class="mat-mdc-button-touch-target">` — rendered via `<TouchTarget/>`

The `[progressIndicator]` slot and its container are omitted (deferred per
design spec §8 deviation #3).
