import {$, component$, useSignal} from '@builder.io/qwik';
import {MatFormField, MatLabel} from '@angular-community/qwik-material/form-field';
import {
  formatDateForDisplay,
  MatDatepicker,
  MatDatepickerInput,
  MatDatepickerToggle,
  useMatDatepicker,
} from '@angular-community/qwik-material/datepicker';

const JAN_15_2024 = new Date(2024, 0, 15);

// Mirrors src/dev-app/qwik-parity/datepicker.ts's DatepickerDisabled — [disabled]="true" with a
// preset [value], so the disabled contract is checked against a non-empty display too.
export default component$(() => {
  const value = useSignal<Date | null>(JAN_15_2024);
  const picker = useMatDatepicker<Date>({
    value: JAN_15_2024,
    disabled: true,
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
              disabled
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
