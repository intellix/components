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

/**
 * Port of material.angular.dev's `datepicker-filter` docs example
 * (src/components-examples/material/datepicker/datepicker-filter/) — `dateFilter` rejects
 * Saturday/Sunday, same predicate as this port's own `mat-datepicker/min-max-filter` mirror
 * scenario (the filter half of it).
 */
export default component$(() => {
  const value = useSignal<Date | null>(null);
  const picker = useMatDatepicker<Date>({
    dateFilter: $((d: Date | null) => {
      const day = (d || new Date()).getDay();
      return day !== 0 && day !== 6;
    }),
    onValueChange$: $((v: Date | null) => {
      value.value = v;
    }),
  }) as unknown as MatDatepickerHandle<unknown>;

  return (
    <datepicker-filter-example>
      <MatFormField
        class="example-full-width"
        label={<MatLabel>Choose a date</MatLabel>}
        control={
          <MatDatepickerInput picker={picker} value={formatDateForDisplay(value.value) || undefined} />
        }
        hintStart={<MatHint>MM/DD/YYYY</MatHint>}
        iconSuffix={<MatDatepickerToggle picker={picker} />}
        infixContent={<MatDatepicker picker={picker} />}
      />
    </datepicker-filter-example>
  );
});
