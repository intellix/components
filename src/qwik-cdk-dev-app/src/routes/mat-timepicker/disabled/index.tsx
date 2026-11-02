import {$, component$, useSignal} from '@qwik.dev/core';
import {MatFormField, MatLabel} from '@angular-community/qwik-material/form-field';
import {
  formatTimeForDisplay,
  MatTimepickerInput,
  MatTimepickerToggle,
  useMatTimepicker,
  type MatTimepickerHandle,
} from '@angular-community/qwik-material/timepicker';

function time(hours: number, minutes: number): Date {
  return new Date(2024, 0, 15, hours, minutes, 0);
}

// Mirrors src/dev-app/qwik-parity/timepicker.ts's TimepickerDisabled — [disabled]="true" on the
// input, preset value 10:00 AM. The toggle is auto-disabled too (see use-mat-timepicker.ts's
// doc comment: both read the SAME `picker.disabled` signal).
export default component$(() => {
  const value = useSignal<Date | null>(time(10, 0));
  const picker = useMatTimepicker<Date>({
    value: value.value,
    disabled: true,
    onValueChange$: $((v: Date | null) => {
      value.value = v;
    }),
  }) as unknown as MatTimepickerHandle<unknown>;
  const invalid = picker.parseError.value || picker.minError.value || picker.maxError.value;

  return (
    <>
      <div data-parity-root>
        <MatFormField
          style="width: 300px"
          label={<MatLabel>Pick a time</MatLabel>}
          touched={picker.touched.value}
          dirty={picker.dirty.value}
          invalid={invalid}
          control={
            <MatTimepickerInput
              picker={picker}
              formBound
              disabled
              value={formatTimeForDisplay(value.value) || undefined}
            />
          }
          iconSuffix={<MatTimepickerToggle picker={picker} />}
        />
        <p>Value: {value.value == null ? '' : String(value.value)}</p>
      </div>
      <main data-scenario-ready>ready</main>
    </>
  );
});
