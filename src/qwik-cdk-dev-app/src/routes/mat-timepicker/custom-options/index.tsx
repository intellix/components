import {$, component$, useSignal} from '@qwik.dev/core';
import {MatFormField, MatLabel} from '@angular-community/qwik-material/form-field';
import {
  formatTimeForDisplay,
  MatTimepickerInput,
  MatTimepickerToggle,
  useMatTimepicker,
  type MatTimepickerOption,
  type MatTimepickerHandle,
} from '@angular-community/qwik-material/timepicker';

function time(hours: number, minutes: number): Date {
  return new Date(2024, 0, 15, hours, minutes, 0);
}

const customOptions: MatTimepickerOption<Date>[] = [
  {label: 'Breakfast', value: time(9, 0)},
  {label: 'Lunch', value: time(12, 0)},
  {label: 'Dinner', value: time(20, 0)},
];

// Mirrors src/dev-app/qwik-parity/timepicker.ts's TimepickerCustomOptions — [options] instead of
// [interval], empty start. Picking "Lunch" assigns its Date value, re-formatted to "12:00 PM"
// (never the custom label) — see timepicker-runtime.ts's `formatInputValue`.
export default component$(() => {
  const value = useSignal<Date | null>(null);
  const picker = useMatTimepicker<Date>({
    value: value.value,
    options: customOptions,
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
