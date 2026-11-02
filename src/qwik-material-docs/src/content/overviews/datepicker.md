The datepicker allows users to enter a date either through text input, or by choosing a date from
the calendar. It is made up of several components and a shared `picker` handle that work
together.

<!-- example(datepicker-overview) -->

### Connecting a datepicker to an input

A datepicker is composed of a `<MatDatepickerInput>` and a calendar pop-up, connected through a
shared handle from `useMatDatepicker<D>()` — called once by a common ancestor, since Qwik has no
dependency-injection mechanism to connect several separate elements the way Angular's template
reference variables do.

There is also an optional `<MatDatepickerToggle>` for opening the calendar.

This works either on its own or as part of a `<MatFormField>`, with the toggle as a prefix or
suffix:

```tsx
const value = useSignal<Date | null>(null);
const picker = useMatDatepicker<Date>({
  onValueChange$: $((v: Date | null) => (value.value = v)),
});

<MatFormField
  label={<MatLabel>Choose a date</MatLabel>}
  control={
    <MatDatepickerInput picker={picker} value={formatDateForDisplay(value.value) || undefined} />
  }
  hintStart={<MatHint>MM/DD/YYYY</MatHint>}
  iconSuffix={<MatDatepickerToggle picker={picker} />}
  infixContent={<MatDatepicker picker={picker} />}
/>;
```

If you want to customize the toggle's icon, pass the `icon` prop:

<!-- example(datepicker-custom-icon) -->

### Date range selection

For a range of dates, use `<MatDateRangeInput>` with `useMatDateRangePicker<D>()` and
`<MatDateRangePicker>`/`<MatDatepickerToggle>` — the same shared-handle shape as the single-date
case, just with a `DateRange<D>` value instead of a `D`:

```tsx
const range = useSignal<DateRange<Date>>({start: null, end: null});
const picker = useMatDateRangePicker<Date>({
  onValueChange$: $((v: DateRange<Date>) => (range.value = v)),
});

<MatFormField
  label={<MatLabel>Enter a date range</MatLabel>}
  control={<MatDateRangeInput picker={picker} range={range.value} />}
  iconSuffix={<MatDatepickerToggle picker={picker} />}
  infixContent={<MatDateRangePicker picker={picker} />}
/>;
```

<!-- example(date-range-picker-overview) -->

### Date range input forms integration

Qwik has no bundled forms module — wire `useMatFormControl()`-style `touched`/`dirty` tracking (or
a real form library, see [Using with Formisch](/guide/using-with-formisch/)) around the shared
`range` signal yourself, the same way every other control in this port handles form state.

<!-- example(date-range-picker-forms) -->

### Setting the calendar starting view

`startView` (`'month'` | `'year'` | `'multi-year'`) sets which view the calendar first opens to;
`startAt` overrides which month/year/decade it opens to (defaults to the current value, or
today).

<!-- example(datepicker-start-view) -->

### Setting the selected date

`useMatDatepicker<D>()`'s `value`/`onValueChange$` always deal in `D` — a plain `Date`, since this
port's `DateAdapter` is fixed to the native implementation (see
[Internationalization](#internationalization) below). As with any other control, it works with
whatever form-state approach you choose.

<!-- example(datepicker-value) -->

### Date validation

`min`/`max` hook options enforce bounds on both the input and the calendar (disabling out-of-range
dates, and preventing navigation past them).

<!-- example(datepicker-min-max) -->

`dateFilter` (a `QRL<(date: D | null) => boolean>`) validates individual dates without blocking
calendar navigation past them — for example, to allow only weekdays.

<!-- example(datepicker-filter) -->

Read `picker.parseError`/`minError`/`maxError`/`filterError` signals directly to decide what to
show — there's no bundled `ErrorStateMatcher`/validator-object equivalent (see
[Angular → Qwik notes](#angular--qwik-notes)).

### Input and change events

Not ported as a separate pair — `useMatDatepicker()` has a single `onValueChange$`, fired for
both typing/blurring a valid value and choosing a date from the calendar (upstream's
`(dateInput)`/`(dateChange)` are two distinct events with slightly different firing rules; this
port doesn't distinguish them).

<!-- example(datepicker-events) -->

### Disabling parts of the datepicker

`disabled` is a `useMatDatepicker()` option; pass it independently to `<MatDatepickerInput>`/
`<MatDatepickerToggle>` if you want to disable typing but allow calendar selection, or vice versa.

<!-- example(datepicker-disabled) -->

### Confirmation action buttons

Pass `actions` content to `<MatDatepicker>`/`<MatDateRangePicker>` (rendered via
`<MatDatepickerActions>`, with `<MatDatepickerCancelButton>`/`<MatDatepickerApplyButton>` inside)
to require an explicit confirm before a calendar selection commits.

<!-- example(datepicker-actions) -->

### Comparison ranges

Not ported — no `comparisonStart`/`comparisonEnd` equivalent on `<MatDateRangeInput>` (no
scenario in this port exercises a comparison range).

### Customizing the date selection logic

Not ported — no `MatDateRangeSelectionStrategy`/injection-token equivalent for custom range
preview/selection behavior.

### Touch UI mode

Pass `touchUi` to open the calendar in a larger, touch-friendlier dialog instead of a popup.

<!-- example(datepicker-touch) -->

### Manually opening and closing the calendar

Not ported through the public API — there's no `picker.open()`/`.close()` method or `opened`
property a consumer can call directly; the calendar only opens via `<MatDatepickerToggle>` or by
focusing/typing into `<MatDatepickerInput>`.

### Using `mat-calendar` inline

`<MatCalendar>` works the same standalone as inside a popup.

<!-- example(datepicker-inline-calendar) -->

### Internationalization

Not ported — this port's `DateAdapter` is fixed to a single process-wide `en-US` native
implementation. There's no live locale switching, no `MAT_DATE_LOCALE`/`setLocale()`, and no
alternate date-library adapters (`date-fns`/Luxon/Moment) — only the native `Date`-based adapter
upstream's own `provideNativeDateAdapter` wires up. `MAT_DATE_FORMATS` likewise isn't
configurable.

#### Customizing the calendar header

Not ported — no `calendarHeaderComponent` equivalent; the calendar header is always the built-in
one.

#### Highlighting specific dates

Not ported — no `dateClass` equivalent (no per-date custom CSS classes).

### Accessibility

The datepicker pop-up uses the `role="dialog"` pattern; the calendar itself implements
`role="grid"`. Always provide an accessible label for the input (`<MatLabel>`, `aria-label`, or
`aria-labelledby`), and communicate the expected date format via a hint.

`<MatDatepickerInput>`/`<MatDatepickerToggle>` both apply `aria-haspopup` to their native elements.

#### Keyboard interaction

| Keyboard shortcut | Action |
|---|---|
| <kbd>Alt</kbd> + <kbd>Down Arrow</kbd> | Open the calendar pop-up |
| <kbd>Escape</kbd> | Close the calendar pop-up |

In month view:

| Shortcut | Action |
|---|---|
| <kbd>Left Arrow</kbd> | Go to previous day |
| <kbd>Right Arrow</kbd> | Go to next day |
| <kbd>Up Arrow</kbd> | Go to same day in the previous week |
| <kbd>Down Arrow</kbd> | Go to same day in the next week |
| <kbd>Home</kbd> | Go to the first day of the month |
| <kbd>End</kbd> | Go to the last day of the month |
| <kbd>Page up</kbd> | Go to the same day in the previous month |
| <kbd>Alt</kbd> + <kbd>Page up</kbd> | Go to the same day in the previous year |
| <kbd>Page Down</kbd> | Go to the same day in the next month |
| <kbd>Alt</kbd> + <kbd>Page Down</kbd> | Go to the same day in the next year |
| <kbd>Enter</kbd> | Select current date |

## Angular → Qwik notes

- **A shared `picker` handle, not template-reference-variable DI.** `useMatDatepicker<D>()`/
  `useMatDateRangePicker<D>()` are called once by a common ancestor and passed as a `picker` prop
  to `<MatDatepickerInput>`/`<MatDateRangeInput>`/`<MatDatepickerToggle>`/`<MatDatepicker>`/
  `<MatDateRangePicker>` — see the first section above.
- **No `ControlValueAccessor`/bundled forms.** `touched`/`dirty`/`invalid` are plain props you
  compute yourself (see [useMatFormControl()](/components/form-field/api/), or
  [Using with Formisch](/guide/using-with-formisch/)).
- **`(dateInput)`/`(dateChange)` collapse into one `onValueChange$`** — see "Input and change
  events" above.
- **Not ported:** live locale switching, alternate date-library adapters, configurable
  `MAT_DATE_FORMATS`, `yearSelected`/`monthSelected` outputs, comparison ranges, custom range
  selection strategies, a custom calendar header component, `dateClass`, and the imperative
  `open()`/`close()`/`opened` API — see the relevant sections above and
  [Migrating from Angular Material](/guide/migrating-from-angular-material/).
- **No dev-mode throws** — an unsupported combination (e.g. `options`-shaped misuse) doesn't
  throw; it simply produces whatever DOM the data implies.
