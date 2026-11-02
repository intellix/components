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
 * Port of material.angular.dev's `datepicker-min-max` docs example
 * (src/components-examples/material/datepicker/datepicker-min-max/) — `min`/`max` 20 years in
 * the past / 1 year in the future, relative to "today". No clock pinning needed: the default
 * (empty, closed) render is identical regardless of the exact bound dates — they only affect
 * the (not rendered here) open calendar's disabled cells.
 */
export default component$(() => {
  const currentYear = new Date().getFullYear();
  const minDate = new Date(currentYear - 20, 0, 1);
  const maxDate = new Date(currentYear + 1, 11, 31);

  const value = useSignal<Date | null>(null);
  const picker = useMatDatepicker<Date>({
    min: minDate,
    max: maxDate,
    onValueChange$: $((v: Date | null) => {
      value.value = v;
    }),
  }) as unknown as MatDatepickerHandle<unknown>;

  return (
    <datepicker-min-max-example>
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
    </datepicker-min-max-example>
  );
});
