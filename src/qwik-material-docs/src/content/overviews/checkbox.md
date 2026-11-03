`<MatCheckbox>` provides the same functionality as a native `<input type="checkbox">` enhanced
with Material Design styling and animations.

<!-- example(checkbox-overview) -->

### Checkbox label

The checkbox label is provided as the content to the `<MatCheckbox>` element. The label can be
positioned before or after the checkbox by setting the `labelPosition` prop to `'before'` or
`'after'`.

If you don't want the label to appear next to the checkbox, you can use
[`aria-label`](https://www.w3.org/TR/wai-aria/states_and_properties#aria-label) or
[`aria-labelledby`](https://www.w3.org/TR/wai-aria/states_and_properties#aria-labelledby) to
specify an appropriate label.

### Use with forms

There is no Angular Forms integration in this port — `<MatCheckbox>` is a controlled component:
pass `checked`/`indeterminate` as props and read changes back through `onChange$`.

```tsx
<MatCheckbox checked={checked.value} onChange$={e => (checked.value = e.checked)}>
  Subscribe to emails
</MatCheckbox>
```

A form library can still drive the `ng-touched`/`ng-untouched`, `ng-pristine`/`ng-dirty`,
`ng-valid`/`ng-invalid` classes Angular's `NgControlStatus` would add to `<mat-checkbox
formControlName="...">` — pass `formBound` plus `touched`/`dirty`/`invalid` (booleans you
compute yourself) and `onTouched$` (called on blur, same timing as upstream's `_onTouched()`):

```tsx
<MatCheckbox
  checked={field.checked.value}
  formBound
  touched={field.touched.value}
  dirty={field.dirty.value}
  invalid={field.invalid.value}
  onChange$={e => {
    field.dirty.value = true;
    field.checked.value = e.checked;
  }}
  onTouched$={() => (field.touched.value = true)}
>
  I agree to the terms
</MatCheckbox>
```

See [Using with Formisch](/guide/using-with-formisch/) for a worked example with a real form
library.

<!-- example(checkbox-reactive-forms) -->

### Indeterminate state

`<MatCheckbox>` supports an `indeterminate` state, similar to the native
`<input type="checkbox">`. While the `indeterminate` prop is true, it will render as
indeterminate regardless of the `checked` value. Any interaction with the checkbox by a user
(i.e., clicking) will remove the indeterminate state.

### Click action config

When a user clicks the `<MatCheckbox>`, the default behavior is to toggle the `checked` value and
set `indeterminate` to `false`. This behavior can be customized with the `clickAction` field of
`MatCheckboxConfig`, provided through `<QwikMaterialProvider>`:

```tsx
<QwikMaterialProvider matCheckboxConfig={{clickAction: 'noop'}}>
  <App />
</QwikMaterialProvider>
```

The possible values are:

#### `noop`

Do not change the `checked` value or `indeterminate` value. Developers have the power to
implement customized click actions.

#### `check`

Toggle `checked` value of the checkbox, ignore `indeterminate` value. If the checkbox is in
`indeterminate` state, the checkbox will display as an `indeterminate` checkbox regardless the
`checked` value.

#### `check-indeterminate`

Default behavior of `<MatCheckbox>`. Always set `indeterminate` to `false` when user clicks the
`<MatCheckbox>`. This matches the behavior of native `<input type="checkbox">`.

### Accessibility

`<MatCheckbox>` uses an internal `<input type="checkbox">` to provide an accessible experience.
This internal checkbox receives focus and is automatically labelled by the text content of the
`<MatCheckbox>` element. Avoid adding other interactive controls into the content of
`<MatCheckbox>`, as this degrades the experience for users of assistive technology.

Always provide an accessible label via the `aria-label` or `aria-labelledby` prop for checkboxes
without descriptive text content.

```tsx
<MatCheckbox aria-label={isSubscribedToEmailsMessage} />
```

Additionally, `<MatCheckbox>` supports the following accessibility props:

- **`aria-expanded`**: Indicates whether the checkbox controls the visibility of another element.
- **`aria-controls`**: Specifies the id of the element that the checkbox controls.
- **`aria-owns`**: Specifies the id of the element that the checkbox visually owns.

## Angular → Qwik notes

- **No Angular Forms integration.** `ControlValueAccessor`/`Validator` have no Qwik equivalent;
  `required` is reflected as a plain attribute only, with no validation behavior. `formBound`/
  `touched`/`dirty`/`invalid`/`onTouched$` mirror upstream's `NgControlStatus` host classes +
  `_onBlur()` → `_onTouched()` timing (see "Use with forms" above) — but `invalid` is always a
  plain boolean YOU compute, never derived from a real validator the way upstream's `Validator`
  interface would.
- **Hybrid controlled/uncontrolled `checked`/`indeterminate`.** A parent that keeps rebinding the
  prop (`checked={checked.value}` + `onChange$`) stays in sync every render; a parent that omits
  the prop entirely gets a fully self-managed checkbox, matching upstream's "no `[checked]`
  binding" uncontrolled path.
- **`checked`/`indeterminate` are set imperatively via a ref, never as a plain JSX prop,
  internally** — both are DOM *properties* with no reliable HTML attribute equivalent. This is an
  internal implementation detail; the public `checked`/`indeterminate` props behave the same as
  any other prop from a consumer's point of view. One visual-only gap: a checkbox that starts
  `checked`/`indeterminate` and is never interacted with won't show the native CSS
  checked/indeterminate pseudo-class styling until the first click (the `mdc-checkbox--selected`
  class and `aria-checked="mixed"` attribute are correct from first paint regardless).
- **`MatCheckboxChange`'s `source` field dropped** — the `onChange$` payload is just
  `{checked: boolean}` (no component-instance handle to hand back).
- **Global defaults via `QwikMaterialProvider`**, not an `MAT_CHECKBOX_DEFAULT_OPTIONS` injection
  token.
- **Harness not ported.**
