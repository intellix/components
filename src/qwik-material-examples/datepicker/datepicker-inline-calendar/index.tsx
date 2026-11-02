import {$, component$, useSignal, useStyles$} from '@qwik.dev/core';
import {MatCalendar} from '@angular-community/qwik-material/datepicker';
import {MatCard} from '@angular-community/qwik-material/card';
import styles from './datepicker-inline-calendar-example.css?inline';

/**
 * Port of material.angular.dev's `datepicker-inline-calendar` docs example
 * (src/components-examples/material/datepicker/datepicker-inline-calendar/) — a bare
 * `<mat-calendar>` inside a card, no form field/popup at all. Same `<MatCalendar>` usage as this
 * port's own `mat-datepicker/inline-calendar` mirror scenario.
 */
export default component$(() => {
  useStyles$(styles);
  const selected = useSignal<Date | null>(null);

  return (
    <datepicker-inline-calendar-example>
      <MatCard class="demo-inline-calendar-card">
        <MatCalendar
          selected={selected.value}
          onUserSelect$={$(value => {
            selected.value = value as Date | null;
          })}
        />
      </MatCard>
      <p>Selected date: {selected.value ? String(selected.value) : ''}</p>
    </datepicker-inline-calendar-example>
  );
});
