import {$, component$, useSignal} from '@builder.io/qwik';
import {MatFormField, MatLabel} from '@angular-community/qwik-material/form-field';
import {
  MatDateRangeInput,
  MatDateRangePicker,
  MatDatepickerToggle,
  useMatDateRangePicker,
  type DateRange,
} from '@angular-community/qwik-material/datepicker';

const JAN_1_2024 = new Date(2024, 0, 1);

// Mirrors src/dev-app/qwik-parity/datepicker.ts's DatepickerRangeBasic — [startAt] fixed (pins
// the displayed month regardless of selection state).
export default component$(() => {
  const range = useSignal<DateRange<Date>>({start: null, end: null});
  const picker = useMatDateRangePicker<Date>({
    startAt: JAN_1_2024,
    onValueChange$: $((v: DateRange<Date>) => (range.value = v)),
  });

  return (
    <>
      <div data-parity-root>
        <MatFormField
          style="width: 300px"
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
          iconSuffix={<MatDatepickerToggle picker={picker} />}
          infixContent={<MatDateRangePicker picker={picker} />}
        />
      </div>
      <main data-scenario-ready>ready</main>
    </>
  );
});
