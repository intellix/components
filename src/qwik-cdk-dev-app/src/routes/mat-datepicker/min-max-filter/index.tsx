import {$, component$, useSignal} from '@builder.io/qwik';
import {MatFormField, MatLabel} from '@angular-community/qwik-material/form-field';
import {
  formatDateForDisplay,
  MatDatepicker,
  MatDatepickerInput,
  MatDatepickerToggle,
  useMatDatepicker,
} from '@angular-community/qwik-material/datepicker';

const JAN_10_2024 = new Date(2024, 0, 10);
const JAN_15_2024 = new Date(2024, 0, 15);
const JAN_20_2024 = new Date(2024, 0, 20);

// Mirrors src/dev-app/qwik-parity/datepicker.ts's DatepickerMinMaxFilter — [min]/[max] (Jan
// 10-20) + matDatepickerFilter (no weekends) together; see that file's DISABLED CELLS note for
// the exact enabled/disabled map.
export default component$(() => {
  const value = useSignal<Date | null>(null);
  const picker = useMatDatepicker<Date>({
    startAt: JAN_15_2024,
    min: JAN_10_2024,
    max: JAN_20_2024,
    dateFilter: $((d: Date | null) => {
      const day = (d || new Date()).getDay();
      return day !== 0 && day !== 6;
    }),
    onValueChange$: $((v: Date | null) => (value.value = v)),
  });

  return (
    <>
      <div data-parity-root>
        <MatFormField
          style="width: 300px"
          label={<MatLabel>Choose a date</MatLabel>}
          control={
            <MatDatepickerInput
              picker={picker}
              value={formatDateForDisplay(value.value) || undefined}
            />
          }
          iconSuffix={<MatDatepickerToggle picker={picker} />}
          infixContent={<MatDatepicker picker={picker} />}
        />
      </div>
      <main data-scenario-ready>ready</main>
    </>
  );
});
