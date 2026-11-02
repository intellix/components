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
 * Port of material.angular.dev's `date-range-picker-overview` docs example
 * (src/components-examples/material/datepicker/date-range-picker-overview/) — same
 * `<MatDateRangeInput>`/`<MatDateRangePicker>` shape as this port's own `mat-datepicker/
 * range-basic` mirror scenario, just with no fixed `startAt` (opens to today — see this
 * component's own notes on clock pinning in the parity spec).
 */
export default component$(() => {
  const range = useSignal<DateRange<Date>>({start: null, end: null});
  const picker = useMatDateRangePicker<Date>({
    onValueChange$: $((v: DateRange<Date>) => {
      range.value = v;
    }),
  }) as unknown as MatDateRangePickerHandle<unknown>;

  return (
    <date-range-picker-overview-example>
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
    </date-range-picker-overview-example>
  );
});
