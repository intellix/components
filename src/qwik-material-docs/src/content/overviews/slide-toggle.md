`<MatSlideToggle>` is an on/off control that can be toggled via clicking.

<!-- example(slide-toggle-overview) -->

The slide-toggle behaves similarly to a checkbox, though it does not support an `indeterminate`
state like `<MatCheckbox>`.

### Slide-toggle label
The slide-toggle label is provided as the content to the `<MatSlideToggle>` element.

If you don't want the label to appear next to the slide-toggle, you can use
[`aria-label`](https://www.w3.org/TR/wai-aria/states_and_properties#aria-label) or
[`aria-labelledby`](https://www.w3.org/TR/wai-aria/states_and_properties#aria-labelledby) to
specify an appropriate label.

### Use with forms
There is no Angular Forms integration in this port — see
[Angular → Qwik notes](#angular-qwik-notes) below for the controlled-component replacement.

### Accessibility

`<MatSlideToggle>` uses an internal `<button role="switch">` to provide an accessible experience.
This internal button receives focus and is automatically labelled by the text content of the
`<MatSlideToggle>` element. Avoid adding other interactive controls into the content of
`<MatSlideToggle>`, as this degrades the experience for users of assistive technology.

Always provide an accessible label via the `aria-label` or `aria-labelledby` prop for toggles
without descriptive text content.

```tsx
<MatSlideToggle aria-label={isSubscribedToEmailsMessage} />
```

## Angular → Qwik notes

- **No Angular Forms integration.** `ControlValueAccessor`/`Validator`
  (`NG_VALUE_ACCESSOR`/`NG_VALIDATORS`) have no Qwik equivalent — replaced by the
  controlled-component pattern: the consumer owns `checked` via a signal and passes it as a
  prop, reading changes back through `onChange$`/`onToggleChange$` QRL props (no `.emit()`
  `EventEmitter` API).
- **No imperative `focus()`/`toggle()` methods** — Qwik has no exported component-instance
  handle; drive all interaction through real clicks/Tab/Space.
- **`required` only drives `aria-required`** on the inner button — there's no native
  form-participation gap to replicate (the interactive element is a `<button>`, not an
  `<input>`, same as `MatButtonToggle`).
- **`color` kept as a plain `string`**, not a typed `ThemePalette` — matches upstream's own
  comment that the typed version "has no effect in M3 themes" anyway.
- **No RTL support** — the synced SCSS's `[dir='rtl']` rules are currently unreachable dead code.
- **Global defaults via `QwikMaterialProvider`**, not a `MAT_SLIDE_TOGGLE_CONFIG` injection
  token.
- **Harness not ported.**

**Known pre-existing DOM-parity gap:** the `slide-toggle-overview` docs example wraps each
`<mat-slide-toggle>` in a `<p>`. `<MatSlideToggle>`'s required inner markup includes a `<div>`
(shared with checkbox/radio), and per the HTML5 parsing algorithm a `<div>` start tag implicitly
closes any open `<p>` once the browser parses Qwik's SSR'd HTML — Angular's dev-app is pure CSR
(built via `Renderer2` DOM calls, never HTML-string parsing) so it never hits this rule. Tracked
as an `EXPECTED_FAILURES` entry in the parity suite, not a Qwik bug.
