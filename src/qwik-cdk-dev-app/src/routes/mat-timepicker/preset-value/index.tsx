import {$, component$, useSignal} from '@qwik.dev/core';
import {MatFormField, MatLabel} from '@angular-community/qwik-material/form-field';
import {
  formatTimeForDisplay,
  MatTimepickerInput,
  MatTimepickerToggle,
  useMatTimepicker,
} from '@angular-community/qwik-material/timepicker';

function time(hours: number, minutes: number): Date {
  return new Date(2024, 0, 15, hours, minutes, 0);
}

// Mirrors src/dev-app/qwik-parity/timepicker.ts's TimepickerPresetValue — value preset to
// 2:00 PM, opened by clicking the input directly (not the toggle).
export default component$(() => {
  const value = useSignal<Date | null>(time(14, 0));
  const picker = useMatTimepicker<Date>({
    value: value.value,
    onValueChange$: $((v: Date | null) => (value.value = v)),
  });
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
