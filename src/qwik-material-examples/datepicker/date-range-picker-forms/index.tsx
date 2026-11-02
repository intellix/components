import {$, component$, useSignal} from '@qwik.dev/core';
import {MatFormField, MatHint, MatLabel} from '@angular-community/qwik-material/form-field';
import {
  MatDateRangeInput,
  MatDateRangePicker,
  MatDatepickerToggle,
  useMatDateRangePicker,
  type DateRange,
  type MatDateRangePickerHandle,
} from '@angular-community/qwik-material/datepicker';

/**
 * Port of material.angular.dev's `date-range-picker-forms` docs example
 * (src/components-examples/material/datepicker/date-range-picker-forms/) — `FormGroup({start,
 * end})`'s `<p>Selected range: {{range.value | json}}</p>` becomes `JSON.stringify(range.value,
 * null, 2)` (Angular's `JsonPipe` also 2-space-indents). The real template's
 * `matStartDateInvalid`/`matEndDateInvalid` error checks have no equivalent here —
 * `MatDateRangePickerHandle.parseError` is always `false` (no scenario in this port types an
 * unparseable range; see that field's own doc comment) — omitted rather than faked.
 */
export default component$(() => {
  const range = useSignal<DateRange<Date>>({start: null, end: null});
  const picker = useMatDateRangePicker<Date>({
    onValueChange$: $((v: DateRange<Date>) => {
      range.value = v;
    }),
  }) as unknown as MatDateRangePickerHandle<unknown>;

  return (
    <date-range-picker-forms-example>
      <MatFormField
        label={<MatLabel>Enter a date range</MatLabel>}
        control={
          <MatDateRangeInput
            picker={picker}
            startPlaceholder="Start date"
            endPlaceholder="End date"
            controlType="mat-date-range-input"
            disableAutomaticLabeling
          />
        }
        hintStart={<MatHint>MM/DD/YYYY – MM/DD/YYYY</MatHint>}
        iconSuffix={<MatDatepickerToggle picker={picker} />}
        infixContent={<MatDateRangePicker picker={picker} />}
      />

      <p>Selected range: {JSON.stringify(range.value, null, 2)}</p>
    </date-range-picker-forms-example>
  );
});
