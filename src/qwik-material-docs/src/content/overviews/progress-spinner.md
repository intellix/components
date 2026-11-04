`<MatProgressSpinner>` and `<MatSpinner>` are circular indicators of progress and activity.

<!-- example(progress-spinner-overview) -->

### Progress mode
The progress-spinner supports two modes, "determinate" and "indeterminate". `<MatSpinner>` is a
separate component with the same DOM shape as `<MatProgressSpinner mode="indeterminate">`.

| Mode          | Description                                                                      |
|---------------|------------------------------------------------------------------------------------|
| determinate   | Standard progress indicator, fills from 0% to 100%                               |
| indeterminate | Indicates that something is happening without conveying a discrete progress      |

The default mode is "determinate". In this mode, the progress is set via the `value` prop, which
can be a whole number between 0 and 100.

In "indeterminate" mode, the `value` prop is ignored.

### Accessibility

`<MatProgressSpinner>` implements the ARIA `role="progressbar"` pattern. By default, the spinner
sets `aria-valuemin` to `0` and `aria-valuemax` to `100`. Avoid changing these values, as this may
cause incompatibility with some assistive technology.

Always provide an accessible label via the `aria-label` or `aria-labelledby` prop for each
spinner.

## Angular → Qwik notes

- **`<MatSpinner>` is a distinct, first-class component, not a `const` alias.** Upstream exports
  `MatSpinner` as `class MatSpinner extends MatProgressSpinner` (really just an alias with a
  different default `mode`/selector); Qwik can't sniff a host tag name at construction time like
  that, so `MatSpinner` is its own component sharing an internal render helper with
  `MatProgressSpinner`, rendering `<mat-spinner>` with `mode="indeterminate"` by default.
  Both custom-element tags (`<mat-progress-spinner>` and `<mat-spinner>`) are preserved.
- **`ThemePalette` narrowed to `'primary' | 'accent' | 'warn'`** as `MatProgressSpinnerColor`.
- **No `MatIconRegistry`-style template-outlet trick** — the internal circle markup reused across
  the determinate/indeterminate render paths is a small internal helper component, not an
  `NgTemplateOutlet`.
- **`.mat-progress-spinner-reduced-motion` class omitted** — the `@media (prefers-reduced-motion:
  reduce)` CSS rule handles this without a client-side `matchMedia` check.
- **Global defaults via a hook (`useMatProgressSpinnerProvider()`)**, not an `MAT_PROGRESS_SPINNER_CONFIG` injection
  token; no separate `_forceAnimations` escape hatch (`matAnimationsDisabled` context already
  covers it).
- **Harness not ported.**
