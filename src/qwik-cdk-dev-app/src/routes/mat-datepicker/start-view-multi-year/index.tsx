import {$, component$, useSignal} from '@qwik.dev/core';
import {MatFormField, MatLabel} from '@angular-community/qwik-material/form-field';
import {
  formatDateForDisplay,
  MatDatepicker,
  MatDatepickerInput,
  MatDatepickerToggle,
  useMatDatepicker,
  type MatDatepickerHandle,
} from '@angular-community/qwik-material/datepicker';

// A multi-year grid spans 24 years around the active year (see the contract's own DETERMINISM
// PITFALL note); 1990 keeps that whole window clear of "today" for the foreseeable future, unlike
// 2024's window.
const JAN_1_1990 = new Date(1990, 0, 1);

// Mirrors src/dev-app/qwik-parity/datepicker.ts's DatepickerStartViewMultiYear.
export default component$(() => {
  const value = useSignal<Date | null>(null);
  const picker = useMatDatepicker<Date>({
    startAt: JAN_1_1990,
    startView: 'multi-year',
    onValueChange$: $((v: Date | null) => {
      value.value = v;
    }),
  }) as unknown as MatDatepickerHandle<unknown>;

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
