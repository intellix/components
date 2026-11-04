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
[Angular → Qwik notes](#angular-qwik-notes)).

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

Pass your own buttons as the `actions` prop of `<MatDatepicker>`/`<MatDateRangePicker>` to require
an explicit confirm before a calendar selection commits. Their click handlers call
`applyDatepickerSelection(picker)` / `cancelDatepickerSelection(picker)` (or
`cancelDateRangePickerSelection(picker)` for a range):

```tsx
<MatDatepicker
  picker={picker}
  actions={
    <>
      <MatButton onClick$={() => cancelDatepickerSelection(picker)}>Cancel</MatButton>
      <MatButton appearance="elevated" onClick$={() => applyDatepickerSelection(picker)}>
        Apply
      </MatButton>
    </>
  }
/>
```

<!-- example(datepicker-actions) -->

### Opening the calendar from code

Upstream's `picker.open()` / `picker.close()` are `openDatepickerPanel(picker, cdk)` /
`closeDatepickerPanel(picker)` (and `openDateRangePickerPanel(picker, cdk)` for a range), where
`cdk` is read once during render with `useContext(QWIK_CDK)` from `@angular-community/qwik-cdk`:

```tsx
const cdk = useContext(QWIK_CDK);
// e.g. open on focus, like an Angular template's (focus)="picker.open()"
<MatDatepickerInput picker={picker} onFocus$={() => openDatepickerPanel(picker, cdk)} />
```

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

Internationalization of the datepicker is configured via three aspects:

1.  The date locale.
2.  The date implementation (`DateAdapter`) the datepicker uses to parse/format/compare dates.
3.  The display and parse formats (`MAT_DATE_FORMATS`) used by the datepicker.

All three are provided together by one hook, `useMatDateAdapterProvider()` — call it once
app-wide near your app's root, or scoped to one subtree if called deeper (an inner call shadows
an outer one for its own descendants, the same way every other provider hook does).
`useMatDatepicker()`/`useMatDateRangePicker()`/`<MatCalendar>`/`<MatTimepickerInput>` all read
from the SAME contexts, so one `useMatDateAdapterProvider()` call configures the datepicker, the
date-range input, and the timepicker together.

#### Setting the locale

Pass `locale` to `useMatDateAdapterProvider()`:

```tsx
export default component$(() => {
  useMatDateAdapterProvider({locale: 'en-GB'});
  return <MyDatepickerPage />;
});
```

It's also possible to change the locale at runtime: read the same signal any date-aware
descendant resolves via `useDateLocale()` (exported from `@angular-community/qwik-material/core`)
and write to it directly — the Qwik-native equivalent of calling `DateAdapter.setLocale()`. Every
component that renders locale-sensitive text (month/weekday names, the calendar header's period
label) re-renders automatically, including an open calendar re-opened after the change:

```tsx
import {useDateLocale} from '@angular-community/qwik-material/core';

export default component$(() => {
  const locale = useDateLocale();
  return (
    <MatButton onClick$={$(() => { locale.value = 'fr'; })}>
      Switch to French
    </MatButton>
  );
});
```

<!-- example(datepicker-locale) -->

#### Choosing a date implementation and date format settings

This port ships one `DateAdapter` implementation: `NativeDateAdapter`, backed by the native
`Date` object and `Intl` for formatting (no Moment/Luxon/date-fns dependency). It's the default
for every date-aware component — nothing needs to be provided to use it.

```tsx
import {NativeDateAdapter, MAT_NATIVE_DATE_FORMATS} from '@angular-community/qwik-material/core';
```

`provideNativeDateAdapter()`'s equivalent here is simply *not calling*
`useMatDateAdapterProvider()` at all (or calling it without a `factory`/`formats` key) —
every date-aware component already resolves `NativeDateAdapter`/`MAT_NATIVE_DATE_FORMATS` with
no provider.

If you need custom parsing/formatting behavior (for example, an app whose users type dates as
`dd.mm.yyyy`), subclass `NativeDateAdapter` and override `parse()`/`format()` — every other
method (arithmetic, comparisons, locale-aware names, time parsing/formatting) is inherited for
free, so the same subclass works for the datepicker input, the date-range input, *and* the
timepicker:

```tsx
import {$, component$} from '@qwik.dev/core';
import {
  NativeDateAdapter,
  useMatDateAdapterProvider,
  type MatDateFormats,
} from '@angular-community/qwik-material/core';

class DotDateAdapter extends NativeDateAdapter {
  override parse(value: unknown, parseFormat: unknown): Date | null {
    if (typeof value === 'string') {
      const match = value.trim().match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/);
      if (match) {
        const [, dd, mm, yyyy] = match;
        return this.createDate(Number(yyyy), Number(mm) - 1, Number(dd));
      }
    }
    return super.parse(value, parseFormat);
  }

  override format(date: Date, displayFormat: unknown): string {
    if (displayFormat === 'DD.MM.YYYY') {
      const dd = String(this.getDate(date)).padStart(2, '0');
      const mm = String(this.getMonth(date) + 1).padStart(2, '0');
      return `${dd}.${mm}.${this.getYear(date)}`;
    }
    return super.format(date, displayFormat);
  }
}

const DOT_DATE_FORMATS: MatDateFormats = {
  parse: {dateInput: 'DD.MM.YYYY'},
  display: {
    dateInput: 'DD.MM.YYYY',
    monthYearLabel: {year: 'numeric', month: 'short'},
    dateA11yLabel: {year: 'numeric', month: 'long', day: 'numeric'},
    monthYearA11yLabel: {year: 'numeric', month: 'long'},
  },
};

export default component$(() => {
  useMatDateAdapterProvider({
    factory: $((locale: string) => new DotDateAdapter(locale)),
    formats: DOT_DATE_FORMATS,
  });
  return <MyDatepickerPage />;
});
```

`factory` takes a **factory** (`QRL<(locale: string) => DateAdapter<D>>`), never a
live adapter instance — a class instance with methods can't be put into Qwik's serializable
resumable state, so every date-aware component resolves the factory into a fresh instance
wherever one is actually needed (parsing typed text, formatting a value to display) rather than
holding one across a render. This is transparent to you as a consumer; it only matters if you're
extending the port itself (see `datepicker/SYNC.md`'s "DateAdapter / MAT_DATE_FORMATS /
MAT_DATE_LOCALE / dateClass" section for the full design).

Not ported: alternate date-library adapters (`date-fns`/Luxon/Moment) — only the native
`Date`-based adapter (and your own subclasses of it) are supported.

#### Customizing the calendar header

Not ported — no `calendarHeaderComponent` equivalent; the calendar header is always the built-in
one.

#### Localizing labels and messages

Not ported — `MatDatepickerIntl`'s strings (e.g. the toggle's "Open calendar" label) have no
live-override mechanism yet.

#### Highlighting specific dates

If you want to apply one or more CSS classes to some dates in the calendar (e.g. to highlight a
holiday), pass `dateClass` to `useMatDatepicker()`/`useMatDateRangePicker()`. It accepts a `QRL`
function called with each date in the calendar (and which view it belongs to); any classes it
returns (a string, string array, `Set`, or a record of class name to boolean, same as
upstream's `ngClass`-compatible return value) are applied to that date's cell:

```tsx
const picker = useMatDatepicker<Date>({
  dateClass: $((cellDate: Date, view: 'month' | 'year' | 'multi-year') => {
    if (view === 'month' && cellDate.getDate() === 1) return 'month-start';
    return '';
  }),
});
```

<!-- example(datepicker-date-class) -->

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
- **Pluggable `DateAdapter`/`MAT_DATE_FORMATS`/locale, and `dateClass`, are ported** — see
  "Internationalization"/"Highlighting specific dates" above. `matDateAdapterFactory` is a `QRL`
  **factory**, not a live adapter instance (a class instance can't be put into Qwik's
  serializable resumable state); `useDateLocale()` returns a reactive `Signal<string>` in place
  of upstream's one-shot `MAT_DATE_LOCALE` DI token + imperative `setLocale()` call.
- **Not ported:** alternate date-library adapters (`date-fns`/Luxon/Moment — only
  `NativeDateAdapter`/its subclasses), localized `MatDatepickerIntl` strings,
  `yearSelected`/`monthSelected` outputs, comparison ranges, custom range selection strategies, a
  custom calendar header component, and the imperative `open()`/`close()`/`opened` API — see the
  relevant sections above and
  [Migrating from Angular Material](/guide/migrating-from-angular-material/).
- **No dev-mode throws** — an unsupported combination (e.g. `options`-shaped misuse) doesn't
  throw; it simply produces whatever DOM the data implies.
