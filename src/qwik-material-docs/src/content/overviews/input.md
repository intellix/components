`<MatInput>` is a component that renders a native `<input>`/`<textarea>` element styled to work
inside [`<MatFormField>`](/components/form-field/overview/) — the equivalent of upstream's
`matInput` directive, as a standalone polymorphic component (`as="input"` by default, or
`as="textarea"`).

<!-- example(input-overview) -->

### `<input>` and `<textarea>` attributes

Most native `<input>`/`<textarea>` attributes are available as plain props on `<MatInput>` —
`type`, `name`, `placeholder`, `maxLength`, `rows` (for `as="textarea"`), `required`,
`disabled`, `readOnly`, and so on.

### Supported `<input>` types

`type` is a plain string prop forwarded as-is to the native element — any value the browser
itself accepts works (`color`, `date`, `datetime-local`, `email`, `month`, `number`, `password`,
`search`, `tel`, `text`, `time`, `url`, `week`, …). Unlike upstream, this port does no dev-mode
validation of `type` (no equivalent of `getMatInputUnsupportedTypeError` — see
[Angular → Qwik notes](#angular-qwik-notes)), so there's no restricted list to consult.

### Form field features

A number of `<MatFormField>` features work with `<MatInput>` — error messages, hint text, prefix
& suffix, and theming. See the [form field documentation](/components/form-field/overview/) for
these.

### Placeholder

The placeholder is text shown when the `<MatFormField>` label is floating but the input is empty.
Set it via the `placeholder` prop.

### Changing when error messages are shown

Not ported — see [Migrating from Angular Material](/guide/migrating-from-angular-material/) and
the [select overview](/components/select/overview/)'s identical note on `errorStateMatcher`.
`<MatFormField>`'s error visibility uses a single, fixed formula (`invalid && touched`, see its
own Angular → Qwik notes) with no pluggable matcher — a consumer that needs errors to show
immediately, regardless of `touched`, can simply pass a permanently-`true` `touched` value of
their own instead.

### Auto-resizing `<textarea>` elements

Not ported — no `cdkTextareaAutosize` equivalent (the CDK `text-field` entry point this depends
on isn't part of this port's `qwik-cdk`).

### Responding to changes in the autofill state of an `<input>`

`MatInput` always renders the static `cdk-text-field-autofill-monitored` marker class, but the
live, `animationstart`-CSS-trick-based autofill *detection* behind it (`AutofillMonitor`) isn't
ported — no scenario in this port needs to react to real browser autofill.

### Accessibility

If the containing `<MatFormField>` has a label, it's automatically used as the input's
accessible label. If there's no floating label, add an `aria-label`, `aria-labelledby`, or your
own `<label for=...>`.

Any `<MatError>`/`<MatHint>` passed to `<MatFormField>` are automatically added to the input's
`aria-describedby`, and `aria-invalid` is automatically updated based on validity (suppressed
while the control is empty and `required`, matching upstream's own formula — see
`core/mat-form-field-control.ts`).

When conveying an error, don't rely solely on color — use an icon or text (e.g. "Error:") too.

## Angular → Qwik notes

- **No `ControlValueAccessor`/`NgControl`/`ErrorStateMatcher`.** Qwik has no forms system —
  `touched`/`dirty`/`invalid`/`required` are plain boolean props you compute yourself (see
  [useMatFormControl()](/components/form-field/api/) for a small built-in helper, or
  [Using with Formisch](/guide/using-with-formisch/) for a real form library). The default
  `ErrorStateMatcher` formula (`invalid && touched`) is hardcoded; `errorStateMatcher` itself
  isn't ported.
- **No native `<select>` mode.** `as` only offers `'input'`/`'textarea'` — a form field with a
  native `<select>` needs its own small control implementing `MatFormFieldControlProps` (see
  [Form Field → Custom form field controls](/components/form-field/overview/#custom-form-field-controls);
  `qwik-material-examples/select/_lib/native-select-control.tsx` is a worked example).
- **No dev-mode throws.** An unsupported `type` doesn't throw (see "Supported `<input>` types"
  above); there's no equivalent of upstream's `getMatInputUnsupportedTypeError`.
- **`cdkTextareaAutosize` and real autofill detection aren't ported** — see the two sections
  above.
- **`value` is a one-time snapshot, not a live reactive prop.** `<MatInput value={x}>` reads `x`
  once (to seed the SSR-correct initial DOM state); later changes flow through an imperative
  `useTask$` that sets the live DOM property directly (mirroring `MatCheckbox`'s proven
  `checked`/`indeterminate` fix) — this is invisible to a normal consumer (`onInput$` + your own
  signal is all you need), but matters if you're debugging why a plain prop re-render doesn't
  move the value.
