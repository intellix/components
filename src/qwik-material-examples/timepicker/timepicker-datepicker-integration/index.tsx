import {$, component$, useSignal, useStyles$} from '@qwik.dev/core';
import {MatFormField, MatLabel} from '@angular-community/qwik-material/form-field';
import {
  MatDatepicker,
  MatDatepickerInput,
  MatDatepickerToggle,
  formatDateForDisplay,
  useMatDatepicker,
  type MatDatepickerHandle,
} from '@angular-community/qwik-material/datepicker';
import {
  MatTimepickerInput,
  MatTimepickerToggle,
  formatTimeForDisplay,
  useMatTimepicker,
  type MatTimepickerHandle,
} from '@angular-community/qwik-material/timepicker';
import styles from './timepicker-datepicker-integration-example.css?inline';

/**
 * Port of material.angular.dev's `timepicker-datepicker-integration` docs example
 * (src/components-examples/material/timepicker/timepicker-datepicker-integration/) — a
 * datepicker and a timepicker bound to the SAME shared value: picking a date sets the date
 * portion (preserving any existing time); picking/typing a time sets the time portion
 * (preserving any existing date). Neither hook has a live dependency on the other — just two
 * independent `onValueChange$` callbacks writing into one signal, per the overview's own
 * "Integration with MatDatepicker" section. `[(ngModel)]="value"` on both inputs means
 * `formBound`/`touched={false}`/`dirty={false}`/`invalid={false}` on both (no validators, so
 * always valid; neither ever becomes touched/dirty with no interaction) — same hardcoded
 * resulting-state convention `select-form`'s own `<form>` wrapper uses.
 */
function withDate(existing: Date | null, date: Date | null): Date | null {
  if (!date) return existing;
  if (!existing) return date;
  const next = new Date(date);
  next.setHours(
    existing.getHours(),
    existing.getMinutes(),
    existing.getSeconds(),
    existing.getMilliseconds(),
  );
  return next;
}

function withTime(existing: Date | null, time: Date | null): Date | null {
  if (!time) return existing;
  if (!existing) return time;
  const next = new Date(existing);
  next.setHours(time.getHours(), time.getMinutes(), time.getSeconds(), time.getMilliseconds());
  return next;
}

export default component$(() => {
  useStyles$(styles);
  const value = useSignal<Date | null>(null);

  const datepicker = useMatDatepicker<Date>({
    onValueChange$: $((d: Date | null) => {
      value.value = withDate(value.value, d);
    }),
  }) as unknown as MatDatepickerHandle<unknown>;

  const timepicker = useMatTimepicker<Date>({
    onValueChange$: $((t: Date | null) => {
      value.value = withTime(value.value, t);
    }),
  }) as unknown as MatTimepickerHandle<unknown>;

  return (
    <timepicker-datepicker-integration-example>
      <MatFormField
        label={<MatLabel>Meeting date</MatLabel>}
        touched={false}
        dirty={false}
        invalid={false}
        control={
          <MatDatepickerInput
            picker={datepicker}
            formBound
            value={formatDateForDisplay(value.value) || undefined}
          />
        }
        iconSuffix={<MatDatepickerToggle picker={datepicker} />}
        infixContent={<MatDatepicker picker={datepicker} />}
      />

      <MatFormField
        label={<MatLabel>Meeting time</MatLabel>}
        touched={false}
        dirty={false}
        invalid={false}
        control={
          <MatTimepickerInput
            picker={timepicker}
            formBound
            value={formatTimeForDisplay(value.value) || undefined}
          />
        }
        iconSuffix={<MatTimepickerToggle picker={timepicker} />}
      />

      <p>Value: {value.value ? String(value.value) : ''}</p>
    </timepicker-datepicker-integration-example>
  );
});
