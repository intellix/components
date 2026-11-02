import {$, component$, useSignal} from '@qwik.dev/core';
import {MatFormField, MatLabel} from '@angular-community/qwik-material/form-field';
import {
  formatTimeForDisplay,
  MatTimepickerInput,
  MatTimepickerToggle,
  useMatTimepicker,
  type MatTimepickerHandle,
} from '@angular-community/qwik-material/timepicker';

// Mirrors src/dev-app/qwik-parity/timepicker.ts's TimepickerBasicToggle — empty start, default
// (30-minute) interval, opened/closed via the toggle button.
export default component$(() => {
  const value = useSignal<Date | null>(null);
  const picker = useMatTimepicker<Date>({
    value: value.value,
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
