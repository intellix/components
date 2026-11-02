import {$, component$, useSignal} from '@qwik.dev/core';
import {MatFormField, MatLabel} from '@angular-community/qwik-material/form-field';
import {
  MatTimepickerInput,
  MatTimepickerToggle,
  formatTimeForDisplay,
  useMatTimepicker,
  type MatTimepickerHandle,
} from '@angular-community/qwik-material/timepicker';

/**
 * Port of material.angular.dev's `timepicker-forms` docs example
 * (src/components-examples/material/timepicker/timepicker-forms/) — a `FormControl<Date | null>`
 * preset to a time, reporting `value`/`touched`/`dirty` back out. `touched`/`dirty` come
 * straight off `picker` itself (mirrors `mat-timepicker/min-max`'s own doc comment: a bare
 * `FormControl` has the same touched/dirty semantics as `[(ngModel)]`, no separate
 * `useMatFormControl()` needed).
 *
 * Upstream's own initial value is "today at 12:30" (`new Date()` + `setHours`) — NOT reproduced
 * literally: a value computed once during SSR (as this one is, via `useSignal`'s initializer)
 * resolves on the SERVER's real wall-clock time, which Playwright's `clockDate` emulation
 * (browser-only) can't reach — confirmed live (the `DATEPICKER_CLOCK` mechanism `mat-datepicker/
 * example`'s own calendar-popup "today" relies on only works because THAT "today" is computed
 * lazily, client-side, at a real post-hydration click). A fixed date keeps this example
 * deterministic the same way `mat-timepicker/preset-value`'s own mirror scenario already does.
 */
export default component$(() => {
  const value = useSignal<Date | null>(new Date(2024, 0, 15, 12, 30, 0));
  const picker = useMatTimepicker<Date>({
    value: value.value,
    onValueChange$: $((v: Date | null) => {
      value.value = v;
    }),
  }) as unknown as MatTimepickerHandle<unknown>;

  return (
    <timepicker-forms-example>
      <MatFormField
        label={<MatLabel>Pick a time</MatLabel>}
        touched={picker.touched.value}
        dirty={picker.dirty.value}
        invalid={false}
        control={
          <MatTimepickerInput
            picker={picker}
            formBound
            value={formatTimeForDisplay(value.value) || undefined}
          />
        }
        iconSuffix={<MatTimepickerToggle picker={picker} />}
      />

      <p>Value: {value.value ? String(value.value) : ''}</p>
      <p>Touched: {String(picker.touched.value)}</p>
      <p>Dirty: {String(picker.dirty.value)}</p>
    </timepicker-forms-example>
  );
});
