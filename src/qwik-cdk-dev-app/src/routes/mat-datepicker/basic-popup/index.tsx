import {$, component$, useSignal} from '@qwik.dev/core';
import {MatFormField, MatLabel} from '@angular-community/qwik-material/form-field';
import {
  formatDateForDisplay,
  MatDatepicker,
  MatDatepickerInput,
  MatDatepickerToggle,
  useMatDatepicker,
} from '@angular-community/qwik-material/datepicker';

const JAN_1_2024 = new Date(2024, 0, 1);

// Mirrors src/dev-app/qwik-parity/datepicker.ts's DatepickerBasicPopup — fixed startAt, no
// initial value.
export default component$(() => {
  const value = useSignal<Date | null>(null);
  const picker = useMatDatepicker<Date>({
    startAt: JAN_1_2024,
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
