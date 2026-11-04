import {$, component$, useSignal} from '@qwik.dev/core';
import {MatFormField, MatLabel} from '@angular-community/qwik-material/form-field';
import {
  NativeDateAdapter,
  type MatDateFormats,
  useMatDateAdapterProvider,
} from '@angular-community/qwik-material/core';
import {
  MatDatepicker,
  MatDatepickerInput,
  MatDatepickerToggle,
  MatDateRangeInput,
  MatDateRangePicker,
  useMatDatepicker,
  useMatDateRangePicker,
  type DateRange,
  type MatDatepickerHandle,
  type MatDateRangePickerHandle,
} from '@angular-community/qwik-material/datepicker';
import {
  MatTimepickerInput,
  MatTimepickerToggle,
  useMatTimepicker,
  type MatTimepickerHandle,
} from '@angular-community/qwik-material/timepicker';

/**
 * Fixture for the pluggable-`DateAdapter` functional specs (`specs/material-datepicker/
 * functional.spec.ts`) — a bespoke scenario, not an upstream material.angular.dev example (see
 * `datepicker/SYNC.md`'s "DateAdapter / MAT_DATE_FORMATS / MAT_DATE_LOCALE / dateClass" section
 * for why: upstream's own `datepicker-formats` docs example uses Moment, not portable without
 * adding a Moment dependency this project doesn't otherwise need).
 *
 * `DotDateAdapter` subclasses the port's `NativeDateAdapter` (exported from
 * `@angular-community/qwik-material/core`) to accept/emit dates as `dd.mm.yyyy` — the task's own
 * worked example for "apps whose users type dates as dd.mm.yyyy". Only `parse()`/`format()` are
 * overridden; every other method (arithmetic, comparisons, locale-aware month/weekday names,
 * time parsing/formatting) is inherited unchanged, so the SAME adapter class works for the
 * datepicker input, the date-range input, AND the timepicker below — proving the one
 * `MAT_DATE_ADAPTER_FACTORY` / `MAT_DATE_FORMATS` provider wiring reaches every date-aware
 * control, not just the datepicker.
 */
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
      if (!this.isValid(date)) {
        throw Error('DotDateAdapter: Cannot format invalid date.');
      }
      const dd = String(this.getDate(date)).padStart(2, '0');
      const mm = String(this.getMonth(date) + 1).padStart(2, '0');
      return `${dd}.${mm}.${this.getYear(date)}`;
    }
    return super.format(date, displayFormat);
  }
}

/** `parse`/`display.dateInput` use the `'DD.MM.YYYY'` marker `DotDateAdapter.format()`/
 *  `.parse()` recognize (mirrors how a real Moment/Luxon-backed `MatDateFormats` uses a format
 *  LIBRARY's own format-string syntax instead of `Intl.DateTimeFormatOptions`) — every other
 *  field is unchanged from `MAT_NATIVE_DATE_FORMATS` (month/year labels stay `Intl`-based; the
 *  dot format only applies to the plain date-input text). `timeInput`'s `Intl.DateTimeFormatOptions`
 *  is deliberately a DIFFERENT shape from `MAT_NATIVE_DATE_FORMATS`'s own default (24-hour
 *  `HH:mm` instead of the default's 12-hour `h:mm a`) even though `DotDateAdapter` never
 *  overrides time FORMATTING logic itself — this makes a wrong (hardcoded-default-adapter/
 *  formats) initial-value render OBSERVABLY DIFFERENT from a correct (configured-formats) one
 *  for the timepicker fixture below too, the same way the dot date format already does for the
 *  datepicker/range-input fixtures. */
const DOT_DATE_FORMATS: MatDateFormats = {
  parse: {
    dateInput: 'DD.MM.YYYY',
    timeInput: null,
  },
  display: {
    dateInput: 'DD.MM.YYYY',
    timeInput: {hour: '2-digit', minute: '2-digit', hour12: false},
    monthYearLabel: {year: 'numeric', month: 'short'},
    dateA11yLabel: {year: 'numeric', month: 'long', day: 'numeric'},
    monthYearA11yLabel: {year: 'numeric', month: 'long'},
    timeOptionLabel: {hour: 'numeric', minute: 'numeric'},
  },
};

const PRESET_DATE = new Date(2024, 11, 5); // 5 December 2024 — dot-format: "05.12.2024"
const PRESET_RANGE_START = new Date(2024, 11, 5);
const PRESET_RANGE_END = new Date(2024, 11, 25);
const PRESET_TIME = new Date(2024, 11, 5, 14, 30); // 14:30 — 24h format: "14:30"

const DotDatepickerInputExample = component$(() => {
  const picker = useMatDatepicker<Date>({
    value: PRESET_DATE,
  }) as unknown as MatDatepickerHandle<unknown>;
  return (
    <MatFormField
      style="width: 300px"
      label={<MatLabel>Dot-format date</MatLabel>}
      control={<MatDatepickerInput picker={picker} id="dot-date-input" />}
      iconSuffix={<MatDatepickerToggle picker={picker} />}
      infixContent={<MatDatepicker picker={picker} />}
    />
  );
});

const DotDateRangeInputExample = component$(() => {
  const range = useSignal<DateRange<Date>>({start: PRESET_RANGE_START, end: PRESET_RANGE_END});
  const picker = useMatDateRangePicker<Date>({
    value: {start: PRESET_RANGE_START, end: PRESET_RANGE_END},
    onValueChange$: $((v: DateRange<Date>) => {
      range.value = v;
    }),
  }) as unknown as MatDateRangePickerHandle<unknown>;
  return (
    <MatFormField
      style="width: 300px"
      label={<MatLabel>Dot-format range</MatLabel>}
      control={
        <MatDateRangeInput
          picker={picker}
          startPlaceholder="Start date"
          endPlaceholder="End date"
          controlType="mat-date-range-input"
          disableAutomaticLabeling
        />
      }
      iconSuffix={<MatDatepickerToggle picker={picker} />}
      infixContent={<MatDateRangePicker picker={picker} />}
    />
  );
});

const DotTimepickerInputExample = component$(() => {
  const value = useSignal<Date | null>(PRESET_TIME);
  const picker = useMatTimepicker<Date>({
    value: PRESET_TIME,
    onValueChange$: $((v: Date | null) => {
      value.value = v;
    }),
  }) as unknown as MatTimepickerHandle<unknown>;
  return (
    <MatFormField
      style="width: 300px"
      label={<MatLabel>Pick a time</MatLabel>}
      control={<MatTimepickerInput picker={picker} id="dot-time-input" />}
      iconSuffix={<MatTimepickerToggle picker={picker} />}
    />
  );
});

export default component$(() => {
  useMatDateAdapterProvider({
    factory: $((locale: string) => new DotDateAdapter(locale)),
    formats: DOT_DATE_FORMATS,
  });
  return (
    <>
      <div data-parity-root>
        <DotDatepickerInputExample />
        <DotDateRangeInputExample />
        <DotTimepickerInputExample />
      </div>
      <main data-scenario-ready>ready</main>
    </>
  );
});
