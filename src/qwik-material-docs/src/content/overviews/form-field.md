`<MatFormField>` is a component used to wrap several qwik-material components and apply common
[text field](https://material.io/guidelines/components/text-fields.html) styles such as the
underline, floating label, and hint messages.

In this document, "form field" refers to the wrapper component `<MatFormField>` and "form field
control" refers to the component that the `<MatFormField>` is wrapping (e.g. the input, select,
etc.).

The following qwik-material components are designed to work inside a `<MatFormField>`:

- [`<MatInput>`](/components/input/overview/)
- [`<MatSelect>`](/components/select/overview/)

<!-- example(form-field-overview) -->

### Form field appearance variants

`MatFormField` supports two different appearance variants, set via the `appearance` prop: `fill`
and `outline`. The `fill` appearance displays the form field with a filled background box and an
underline, while the `outline` appearance shows the form field with a border all the way around.

Out of the box, if you don't specify an `appearance` it defaults to `fill`. This can be configured
app-wide through `<QwikMaterialProvider>`:

```tsx
<QwikMaterialProvider matFormFieldConfig={{appearance: 'outline'}}>
  {/* ... */}
</QwikMaterialProvider>
```

<!-- example(form-field-appearance) -->

### Floating label

The floating label is a text label displayed on top of the form field control when the control
doesn't contain any text. By default, when text is present the floating label floats above the
form field control. Pass it as the `label` prop, wrapped in `<MatLabel>`:

```tsx
<MatFormField label={<MatLabel>Name</MatLabel>} control={<MatInput />} />
```

If the control is marked `required`, an asterisk is appended to the label automatically. If
unwanted, disable it with the `hideRequiredMarker` prop on `<MatFormField>`.

The `floatLabel` prop changes the default floating behavior. Set it to `always` to float the label
even with no text present, or `auto` to restore the default behavior.

<!-- example(form-field-label) -->

The floating label behavior can also be set app-wide via `<QwikMaterialProvider
matFormFieldConfig={{floatLabel: 'always'}}>`.

### Hint labels

Hint labels are additional descriptive text that appears below the form field's underline. A
`<MatFormField>` can have up to two hint labels: one start-aligned, one end-aligned.

Pass a start hint via the `hintLabel` prop, or via the `hintStart`/`hintEnd` props (each a
`<MatHint>` element):

```tsx
<MatFormField
  label={<MatLabel>Email</MatLabel>}
  control={<MatInput />}
  hintStart={<MatHint>We'll never share your email.</MatHint>}
  hintEnd={<MatHint>Optional</MatHint>}
/>
```

<!-- example(form-field-hint) -->

### Error messages

Error messages can be shown under the form field underline via the `errors` prop (one or more
`<MatError>` elements). Errors are hidden initially and are only actually rendered once the
control's `touched` and `invalid` props both hold — the consumer still decides *what* to show
(e.g. picking a message based on which validator failed), same as Angular's own
`@if (control.invalid) { <mat-error>...</mat-error> }` pattern. `useMatFormControl()` (a small
built-in `value`/`touched`/`dirty` store — no validators of its own) pairs with the standalone
`matControlInvalid()`/`matRequiredValidator` helpers to compute `invalid`:

```tsx
import {useMatFormControl, matControlInvalid, matRequiredValidator} from '@angular-community/qwik-material/form-field';

const fc = useMatFormControl();
const invalid = matControlInvalid(fc, [matRequiredValidator]);

<MatFormField
  label={<MatLabel>Name</MatLabel>}
  touched={fc.touched}
  dirty={fc.dirty}
  invalid={invalid}
  control={
    <MatInput
      required
      formBound
      value={fc.value}
      touched={fc.touched}
      dirty={fc.dirty}
      invalid={invalid}
      onInput$={(_, el) => fc.setValue$(el.value)}
      onBlur$={fc.markAsTouched$}
    />
  }
  errors={invalid && fc.touched && <MatError>Name is required</MatError>}
/>
```

Since the errors occupy the same space as the hints, the hints are hidden when the errors are
shown. Multiple error messages can be rendered at once if desired, but `<MatFormField>` only
reserves enough space to display one error message at a time.

<!-- example(form-field-error) -->

### Prefix & suffix

Custom content can be included before and after the control, as a prefix or suffix, via four
props: `iconPrefix` / `textPrefix` / `iconSuffix` / `textSuffix`. The icon variants wrap an icon;
the text variants are aligned with the control's own text baseline.

```tsx
<MatFormField
  label={<MatLabel>Amount</MatLabel>}
  textPrefix={<MatTextPrefix>$</MatTextPrefix>}
  iconSuffix={<MatIconSuffix><MatIcon>sell</MatIcon></MatIconSuffix>}
  control={<MatInput />}
/>
```

<!-- example(form-field-prefix-suffix) -->

### Custom form field controls

In addition to the controls qwik-material provides, any component can act as a `<MatFormField>`
control, the same way `<MatInput>`/`<MatSelect>` do — see `core/mat-form-field-control.ts`'s
`MatFormFieldControlProps` contract for what a custom control needs to implement
(`touched`/`dirty`/`invalid`/`empty`/`focused`, etc.).

### Theming

The form field's color follows `<MatFormField>`'s own `color` prop (`'primary'` by default,
also accepting `'accent'`/`'warn'`), which it forwards to its control. As with every
qwik-material component, the underlying colors themselves come from the page's
`--mat-sys-*` design tokens — see [Theming](/guide/theming/).

### Accessibility

By itself, `MatFormField` doesn't apply any additional accessibility treatment to a control.
However, several of its optional features interact with the control inside it.

When you provide a label via the `label` prop, `MatFormField` automatically associates it with
the control via a native `<label>` element, using the `for` attribute to reference the control's
id.

If a floating label is specified, it's automatically used as the label for the control. If no
floating label is specified, label the control yourself — an `ariaLabel`/`ariaLabelledBy` prop on
the control, or your own `<label for=...>`.

When you provide hints or errors, `MatFormField` automatically adds their ids to the control's
`aria-describedby`. Additionally, `MatError` applies `aria-live="polite"` by default so assistive
technology announces errors as they appear.

## Angular → Qwik notes

- **Everything Angular projects as nested children becomes an explicit prop.** Angular nests
  `<mat-label>`, `<mat-hint>`, `<mat-error>`, and the control itself as *children* of
  `<mat-form-field>`; qwik-material passes all of them as **props** instead:
  `label` / `hintStart` / `hintEnd` / `hintLabel` / `errors` / `control` /
  `iconPrefix` / `textPrefix` / `iconSuffix` / `textSuffix`. The element types you pass as those
  props' values (`<MatLabel>`, `<MatHint>`, `<MatError>`, `<MatIconPrefix>`, …) are unchanged.
- **`touched` / `dirty` / `invalid` are explicit props on both `<MatFormField>` and its
  `control`,** not read off an injected `NgControl`/`FormControl` — qwik-material has no bundled
  form library, so you own this state yourself (see
  [useMatFormControl()](/components/form-field/api/) for a small built-in helper, or
  [Using with Formisch](/guide/using-with-formisch/) for a real form library).
- **`MatPrefix`/`MatSuffix` are split into four components** — `MatIconPrefix`, `MatTextPrefix`,
  `MatIconSuffix`, `MatTextSuffix` — instead of upstream's single directive with three selector
  spellings (`matPrefix`/`matIconPrefix`/`matTextPrefix` all mapping to one `MatPrefix` class).
- **No error is thrown for a missing control.** A `<MatFormField>` with no `control` prop just
  renders without one, rather than throwing `mat-form-field must contain a MatFormFieldControl`.
- **`appearance="outline"` combined with a prefix/suffix doesn't adjust the notch width** the way
  upstream's `getBoundingClientRect`-based offset calculation does — no current scenario in this
  port combines the two, so the outline notch may not perfectly clear long prefix/suffix content
  in that specific combination.
