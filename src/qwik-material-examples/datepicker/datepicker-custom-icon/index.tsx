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
import {MatIcon} from '@angular-community/qwik-material/icon';

/**
 * Port of material.angular.dev's `datepicker-custom-icon` docs example
 * (src/components-examples/material/datepicker/datepicker-custom-icon/) — `<mat-datepicker-toggle>`
 * projecting a `<mat-icon matDatepickerToggleIcon>` becomes `<MatDatepickerToggle>`'s `icon`
 * prop, same "named prop, not projected content" convention as everywhere else in this port.
 */
export default component$(() => {
  const value = useSignal<Date | null>(null);
  const picker = useMatDatepicker<Date>({
    onValueChange$: $((v: Date | null) => {
      value.value = v;
    }),
  }) as unknown as MatDatepickerHandle<unknown>;

  return (
    <datepicker-custom-icon-example>
      <MatFormField
        class="example-full-width"
        label={<MatLabel>Choose a date</MatLabel>}
        control={
          <MatDatepickerInput picker={picker} value={formatDateForDisplay(value.value) || undefined} />
        }
        hintStart={<MatHint>MM/DD/YYYY</MatHint>}
        iconSuffix={
          <MatDatepickerToggle picker={picker} icon={<MatIcon>keyboard_arrow_down</MatIcon>} />
        }
        infixContent={<MatDatepicker picker={picker} />}
      />
    </datepicker-custom-icon-example>
  );
});
