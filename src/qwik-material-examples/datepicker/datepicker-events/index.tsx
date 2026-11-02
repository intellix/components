import {$, component$, useSignal, useStyles$} from '@qwik.dev/core';
import {MatFormField, MatHint, MatLabel} from '@angular-community/qwik-material/form-field';
import {
  MatDatepicker,
  MatDatepickerInput,
  MatDatepickerToggle,
  formatDateForDisplay,
  useMatDatepicker,
  type MatDatepickerHandle,
} from '@angular-community/qwik-material/datepicker';
import styles from './datepicker-events-example.css?inline';

/**
 * Port of material.angular.dev's `datepicker-events` docs example
 * (src/components-examples/material/datepicker/datepicker-events/) — upstream logs separate
 * `(dateInput)`/`(dateChange)` events; this port's `useMatDatepicker()` only has ONE
 * `onValueChange$`, fired for both (see the overview's own "Input and change events" section) —
 * logged here under a single `'input'` label rather than faking a second, never-actually-
 * independently-fired `'change'` entry. The default (no interaction) render is unaffected: the
 * events list starts empty either way.
 */
export default component$(() => {
  useStyles$(styles);
  const value = useSignal<Date | null>(null);
  const events = useSignal<string[]>([]);
  const picker = useMatDatepicker<Date>({
    onValueChange$: $((v: Date | null) => {
      value.value = v;
      events.value = [...events.value, `input: ${v ? String(v) : null}`];
    }),
  }) as unknown as MatDatepickerHandle<unknown>;

  return (
    <datepicker-events-example>
      <MatFormField
        label={<MatLabel>Input & change events</MatLabel>}
        control={
          <MatDatepickerInput picker={picker} value={formatDateForDisplay(value.value) || undefined} />
        }
        hintStart={<MatHint>MM/DD/YYYY</MatHint>}
        iconSuffix={<MatDatepickerToggle picker={picker} />}
        infixContent={<MatDatepicker picker={picker} />}
      />

      <div class="example-events">
        {events.value.map((e, i) => (
          <div key={i}>{e}</div>
        ))}
      </div>
    </datepicker-events-example>
  );
});
