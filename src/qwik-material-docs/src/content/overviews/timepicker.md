The Angular Material Timepicker allows users to set the time portion of a date object either by
typing it in or by selecting it from a list of pre-defined options.

<!-- example(timepicker-overview) -->

### Connecting a timepicker to an input

A timepicker is composed of a `<MatTimepickerInput>` and a dropdown panel, connected through a
shared `picker` handle from `useMatTimepicker<D>()` — called once by a common ancestor, since
Qwik has no dependency-injection mechanism to connect three separate elements the way Angular's
template-reference-variable binding does. There's also an optional `<MatTimepickerToggle>` for
opening the dropdown.

The input and toggle can be used either on their own or as part of a `<MatFormField>`:

```tsx
const value = useSignal<Date | null>(null);
const picker = useMatTimepicker<Date>({
  onValueChange$: $((v: Date | null) => (value.value = v)),
});

<MatFormField
  label={<MatLabel>Pick a time</MatLabel>}
  control={
    <MatTimepickerInput
      picker={picker}
      formBound
      value={formatTimeForDisplay(value.value) || undefined}
    />
  }
  iconSuffix={<MatTimepickerToggle picker={picker} />}
/>;
```

### Timepicker forms integration

Qwik has no bundled forms module — `useMatTimepicker()`'s `value`/`onValueChange$` is the whole
contract. Pair it with [useMatFormControl()](/components/form-field/api/) (or a real form
library — see [Using with Formisch](/guide/using-with-formisch/)) for `touched`/`dirty` tracking,
the same way every other form control in this port does.

<!-- example(timepicker-forms) -->

### Integration with `MatDatepicker`

A datepicker and a timepicker can operate over the same value: bind the datepicker's
`onValueChange$` to set the date portion and the timepicker's to set the time portion of the same
signal (or compose both into one `Date`). Since neither hook has a live dependency on the other,
there's no special wiring beyond reading/writing the same consumer-owned state from both.

<!-- example(timepicker-datepicker-integration) -->

### Input validation

`useMatTimepicker()` exposes `parseError`/`minError`/`maxError` signals — read them directly (no
`matTimepickerParse`-style string error code, no `ControlValueAccessor` validator object) to
decide whether to mark the field invalid:

```tsx
const invalid = picker.parseError.value || picker.minError.value || picker.maxError.value;
```

`min`/`max` are passed as hook options and only ever accept a `D` (a `Date`) directly — unlike
upstream's `matTimepickerMin`/`Max`, which also accept a time string at the template level, this
port expects the consumer to parse a string themselves first.

<!-- example(timepicker-validation) -->

### Customizing the dropdown options

By default the dropdown shows options at 30 minute intervals. Pass `interval` (a string — same
formats upstream accepts: `"90m"`, `"5h"`, `"75 min"`, …) to `useMatTimepicker()` to change it, or
`options` (a plain `MatTimepickerOption<D>[]`) for full control — the two are mutually exclusive.
The default interval can be set app-wide via `<QwikMaterialProvider
matTimepickerConfig={{interval: '90 minutes'}}>`.

<!-- example(timepicker-options) -->

### Customizing the toggle icon

`<MatTimepickerToggle>` renders a clock icon by default. Pass the `icon` prop to customize it:

```tsx
<MatTimepickerToggle picker={picker} icon={<MatIcon>schedule</MatIcon>} />
```

<!-- example(timepicker-custom-icon) -->

### Internationalization

The timepicker uses the same `DateAdapter`/`MAT_DATE_FORMATS`/locale abstraction
[`MatDatepicker`](/components/datepicker/overview/) does — see that page's own
"Internationalization" section for the full writeup (locale, choosing/subclassing a
`DateAdapter`, format settings). `<QwikMaterialProvider matDateAdapterFactory={...}
matDateFormats={...} matDateLocale="...">` configures `useMatTimepicker()` the same way it
configures `useMatDatepicker()` — placed once near your app's root, or scoped to a subtree, both
controls under it resolve the SAME adapter/formats/locale. A custom `DateAdapter` subclass that
only overrides date `parse()`/`format()` (the common case, e.g. accepting `dd.mm.yyyy`) leaves
time parsing/formatting unaffected, since those methods are inherited unchanged from
`NativeDateAdapter`.

Only the native `Date`-based adapter (and your own subclasses of it) is supported — no
alternate date-library adapters (`date-fns`/Luxon/Moment).

### Accessibility

The timepicker implements the ARIA combobox pattern: the input carries `role="combobox"`, the
dropdown `role="listbox"`, and each option `role="option"`. The listbox is labelled from the
containing `<MatFormField>` by default; outside one, set `ariaLabel`/`ariaLabelledby` on
`useMatTimepicker()`'s options.

## Angular → Qwik notes

- **A shared `picker` handle, not template-reference-variable DI.** `useMatTimepicker<D>()` is
  called once by a common ancestor and passed as a `picker` prop to `<MatTimepickerInput>`/
  `<MatTimepickerToggle>` — see the first section above for why (no Qwik equivalent to Angular's
  cross-element template-variable binding).
- **`formBound`/`value`/`disabled` are required duplication on `<MatTimepickerInput>`** whenever
  the usage is form-bound: `formBound` (literal `true`), `value`
  (`formatTimeForDisplay(picker.value.value) || undefined`), and `disabled` must all be passed so
  `<MatFormField>`'s *static* introspection of the control's props sees the right values at first
  render — see [Form Field → Angular → Qwik notes](/components/form-field/overview/#angular-qwik-notes).
- **No `onTouched$`/`onDirty$` props on `<MatTimepickerInput>`** — the picker tracks
  `touched`/`dirty` internally (`picker.touched`/`picker.dirty`), read directly rather than via a
  callback.
- **Pluggable `DateAdapter`/`MAT_DATE_FORMATS`/locale are ported** (shared with
  [`MatDatepicker`](/components/datepicker/overview/)'s own `<QwikMaterialProvider>` config) —
  see "Internationalization" above.
- **Not ported:** alternate date-library adapters (`date-fns`/Luxon/Moment), and
  `ngDevMode`-gated constructor validation (mismatched `options`+`interval`, an empty `options`
  array, a missing `DateAdapter` provider) — see
  [Migrating from Angular Material](/guide/migrating-from-angular-material/).
