import {$, component$, useSignal} from '@qwik.dev/core';
import {MatFormField, MatLabel} from '@angular-community/qwik-material/form-field';
import {
  MatTimepickerInput,
  MatTimepickerToggle,
  formatTimeForDisplay,
  useMatTimepicker,
  type MatTimepickerHandle,
} from '@angular-community/qwik-material/timepicker';
import {MatIcon} from '@angular-community/qwik-material/icon';

/**
 * Port of material.angular.dev's `timepicker-custom-icon` docs example
 * (src/components-examples/material/timepicker/timepicker-custom-icon/) — `<mat-timepicker-toggle>`
 * projecting a `<mat-icon matTimepickerToggleIcon>` becomes `<MatTimepickerToggle>`'s `icon` prop
 * (see that component's own doc comment — a named prop, not `<Slot>`-projected content, same
 * "content passed as a prop" convention as everywhere else in this port).
 */
export default component$(() => {
  const value = useSignal<Date | null>(null);
  const picker = useMatTimepicker<Date>({
    value: value.value,
    onValueChange$: $((v: Date | null) => {
      value.value = v;
    }),
  }) as unknown as MatTimepickerHandle<unknown>;

  return (
    <timepicker-custom-icon-example>
      <MatFormField
        label={<MatLabel>Pick a time</MatLabel>}
        control={
          <MatTimepickerInput
            picker={picker}
            value={formatTimeForDisplay(value.value) || undefined}
          />
        }
        iconSuffix={
          <MatTimepickerToggle picker={picker} icon={<MatIcon>keyboard_arrow_down</MatIcon>} />
        }
      />
    </timepicker-custom-icon-example>
  );
});
