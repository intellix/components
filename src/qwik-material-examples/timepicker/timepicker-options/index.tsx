import {$, component$, useSignal} from '@qwik.dev/core';
import {MatFormField, MatLabel} from '@angular-community/qwik-material/form-field';
import {
  MatTimepickerInput,
  MatTimepickerToggle,
  formatTimeForDisplay,
  useMatTimepicker,
  type MatTimepickerHandle,
  type MatTimepickerOption,
} from '@angular-community/qwik-material/timepicker';

const customOptions: MatTimepickerOption<Date>[] = [
  {label: 'Morning', value: new Date(2024, 0, 1, 9, 0, 0)},
  {label: 'Noon', value: new Date(2024, 0, 1, 12, 0, 0)},
  {label: 'Evening', value: new Date(2024, 0, 1, 22, 0, 0)},
];

/**
 * Port of material.angular.dev's `timepicker-options` docs example
 * (src/components-examples/material/timepicker/timepicker-options/) — three independent
 * pickers: a 45-minute interval, a 3.5-hour interval, and a custom option list. `interval` is a
 * plain string, same formats upstream accepts (see the overview's "Customizing the dropdown
 * options" section).
 */
export default component$(() => {
  const minutesValue = useSignal<Date | null>(null);
  const minutesPicker = useMatTimepicker<Date>({
    value: minutesValue.value,
    interval: '45min',
    onValueChange$: $((v: Date | null) => {
      minutesValue.value = v;
    }),
  }) as unknown as MatTimepickerHandle<unknown>;

  const hoursValue = useSignal<Date | null>(null);
  const hoursPicker = useMatTimepicker<Date>({
    value: hoursValue.value,
    interval: '3.5h',
    onValueChange$: $((v: Date | null) => {
      hoursValue.value = v;
    }),
  }) as unknown as MatTimepickerHandle<unknown>;

  const customValue = useSignal<Date | null>(null);
  const customPicker = useMatTimepicker<Date>({
    value: customValue.value,
    options: customOptions,
    onValueChange$: $((v: Date | null) => {
      customValue.value = v;
    }),
  }) as unknown as MatTimepickerHandle<unknown>;

  return (
    <timepicker-options-example>
      <h3>Interval examples</h3>

      <div>
        <MatFormField
          label={<MatLabel>Every 45 minutes</MatLabel>}
          control={
            <MatTimepickerInput
              picker={minutesPicker}
              value={formatTimeForDisplay(minutesValue.value) || undefined}
            />
          }
          iconSuffix={<MatTimepickerToggle picker={minutesPicker} />}
        />
      </div>

      <div>
        <MatFormField
          label={<MatLabel>Every 3.5 hours</MatLabel>}
          control={
            <MatTimepickerInput
              picker={hoursPicker}
              value={formatTimeForDisplay(hoursValue.value) || undefined}
            />
          }
          iconSuffix={<MatTimepickerToggle picker={hoursPicker} />}
        />
      </div>

      <h3>Custom list of options</h3>

      <div>
        <MatFormField
          label={<MatLabel>Pick a time of day</MatLabel>}
          control={
            <MatTimepickerInput
              picker={customPicker}
              value={formatTimeForDisplay(customValue.value) || undefined}
            />
          }
          iconSuffix={<MatTimepickerToggle picker={customPicker} />}
        />
      </div>
    </timepicker-options-example>
  );
});
