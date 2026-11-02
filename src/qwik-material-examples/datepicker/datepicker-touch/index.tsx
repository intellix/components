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
 * Port of material.angular.dev's `datepicker-touch` docs example
 * (src/components-examples/material/datepicker/datepicker-touch/) — `touchUi`, same as this
 * port's own `mat-datepicker/touch-ui` mirror scenario (see that route's own note: `touchUi`
 * must be bound as a hook option/property, not a bare attribute).
 */
export default component$(() => {
  const value = useSignal<Date | null>(null);
  const picker = useMatDatepicker<Date>({
    touchUi: true,
    onValueChange$: $((v: Date | null) => {
      value.value = v;
    }),
  }) as unknown as MatDatepickerHandle<unknown>;

  return (
    <datepicker-touch-example>
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
    </datepicker-touch-example>
  );
});
