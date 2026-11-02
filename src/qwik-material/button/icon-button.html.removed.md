# icon-button.html — removed

Upstream `src/material/button/icon-button.html` is inlined into
`mat-icon-button.tsx` as JSX per the qwik-material file-naming rule.
The upstream template has three elements:

1. `<span class="mat-mdc-button-persistent-ripple mdc-icon-button__ripple">` — rendered via `<PersistentRipple isFab={false}/>` plus an extra `.mdc-icon-button__ripple` class on the same span
2. `<span class="mat-focus-indicator">` — rendered via `<FocusIndicator/>`
3. `<span class="mat-mdc-button-touch-target">` — rendered via `<TouchTarget/>`

The icon itself is projected via the default `<Slot/>` — no separate label wrapper.
