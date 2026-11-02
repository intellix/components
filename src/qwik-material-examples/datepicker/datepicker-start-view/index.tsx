import {$, component$, useSignal} from '@qwik.dev/core';
import {MatFormField, MatHint, MatLabel} from '@angular-community/qwik-material/form-field';
import {
  MatDatepicker,
  MatDatepickerInput,
  MatDatepickerToggle,
  formatDateForDisplay,
  useMatDatepicker,
  type MatDatepickerHandle,
} from '@angular-community/qwik-material/datepicker';

const START_DATE = new Date(1990, 0, 1);

/**
 * Port of material.angular.dev's `datepicker-start-view` docs example
 * (src/components-examples/material/datepicker/datepicker-start-view/) — `startView="year"` +
 * `startAt` fixed to 1990 (matches this port's own `mat-datepicker/start-view-year` mirror
 * scenario — 1990 keeps the calendar's displayed window clear of "today" so the test stays
 * deterministic with no clock pinning needed).
 */
export default component$(() => {
  const value = useSignal<Date | null>(null);
  const picker = useMatDatepicker<Date>({
    startAt: START_DATE,
    startView: 'year',
    onValueChange$: $((v: Date | null) => {
      value.value = v;
    }),
  }) as unknown as MatDatepickerHandle<unknown>;

  return (
    <datepicker-start-view-example>
      <MatFormField
        label={<MatLabel>Choose a date</MatLabel>}
        control={
          <MatDatepickerInput picker={picker} value={formatDateForDisplay(value.value) || undefined} />
        }
        hintStart={<MatHint>MM/DD/YYYY</MatHint>}
        iconSuffix={<MatDatepickerToggle picker={picker} />}
        infixContent={<MatDatepicker picker={picker} />}
      />
    </datepicker-start-view-example>
  );
});
