import {$, component$, useSignal} from '@qwik.dev/core';
import {MatFormField, MatLabel} from '@angular-community/qwik-material/form-field';
import {
  formatTimeForDisplay,
  MatTimepickerInput,
  MatTimepickerToggle,
  useMatTimepicker,
  type MatTimepickerHandle,
} from '@angular-community/qwik-material/timepicker';

// Qwik port of material.angular.dev's `timepicker-overview` docs example — see
// src/components-examples/material/timepicker/timepicker-overview/timepicker-overview-example.
// {ts,html}. Rendered unmodified by the Angular dev-app at /qwik-parity/mat-timepicker/example
// (src/dev-app/qwik-parity/examples.ts). Host tag mirrors the example's own component selector
// (`timepicker-overview-example`). No form directive upstream (plain `[matTimepicker]` on a bare
// `<input>`, no `[formControl]`/`ngModel`) — confirmed live, the rendered `<mat-form-field>`
// carries none of the `ng-untouched`/`ng-pristine` classes the stepper-overview example's reactive
// form fields do, so `touched`/`dirty`/`formBound` are deliberately omitted here (contrast
// mat-timepicker/basic-toggle's own route, which DOES thread them for its own, form-bound
// scenario).

export default component$(() => {
  const value = useSignal<Date | null>(null);
  const picker = useMatTimepicker<Date>({
    value: value.value,
    onValueChange$: $((v: Date | null) => {
      value.value = v;
    }),
  }) as unknown as MatTimepickerHandle<unknown>;

  return (
    <timepicker-overview-example>
      <MatFormField
        label={<MatLabel>Pick a time</MatLabel>}
        control={
          <MatTimepickerInput
            picker={picker}
            value={formatTimeForDisplay(value.value) || undefined}
          />
        }
        iconSuffix={<MatTimepickerToggle picker={picker} />}
      />
    </timepicker-overview-example>
  );
});
