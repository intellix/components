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
 * Port of material.angular.dev's `datepicker-value` docs example
 * (src/components-examples/material/datepicker/datepicker-value/) — three fields all showing
 * "today" (`new Date()`/`new Date().toISOString()`/a plain `[value]` binding mirroring the
 * first field's control). The 3rd field (`[value]="date.value"`, no `[formControl]`/`(ngModel)`)
 * is a plain one-way display, not wired to its own `onValueChange$` — nothing in this port's
 * contract ever reassigns it after mount.
 *
 * A fixed date stands in for upstream's literal `new Date()` — a value computed once during SSR
 * (as this one is, via `useSignal`'s initializer) resolves on the SERVER's real wall-clock time,
 * which Playwright's `clockDate` emulation (browser-only) can't reach, unlike the CLIENT-side
 * "today" `mat-datepicker/example`'s own calendar popup computes at a real post-hydration click
 * (where `DATEPICKER_CLOCK` DOES work) — see `mat-timepicker/timepicker-forms`'s identical
 * finding. The parity spec still pins the Angular side's clock to the same date
 * (`DATEPICKER_VALUE_CLOCK`) so its own real `new Date()` resolves to the identical moment.
 */
export default component$(() => {
  const today = new Date(2024, 0, 15, 10, 0, 0);

  const date = useSignal<Date | null>(today);
  const picker1 = useMatDatepicker<Date>({
    value: today,
    onValueChange$: $((v: Date | null) => {
      date.value = v;
    }),
  }) as unknown as MatDatepickerHandle<unknown>;

  const serializedDate = useSignal<string>(today.toISOString());
  const picker2 = useMatDatepicker<Date>({
    value: new Date(serializedDate.value),
  }) as unknown as MatDatepickerHandle<unknown>;

  const picker3 = useMatDatepicker<Date>({
    value: date.value,
  }) as unknown as MatDatepickerHandle<unknown>;

  return (
    <datepicker-value-example>
      <MatFormField
        label={<MatLabel>Angular forms</MatLabel>}
        touched={false}
        dirty={false}
        invalid={false}
        control={
          <MatDatepickerInput
            picker={picker1}
            formBound
            value={formatDateForDisplay(date.value) || undefined}
          />
        }
        hintStart={<MatHint>MM/DD/YYYY</MatHint>}
        iconSuffix={<MatDatepickerToggle picker={picker1} />}
        infixContent={<MatDatepicker picker={picker1} />}
      />

      <MatFormField
        label={<MatLabel>Angular forms (w/ deserialization)</MatLabel>}
        touched={false}
        dirty={false}
        invalid={false}
        control={
          <MatDatepickerInput
            picker={picker2}
            formBound
            value={formatDateForDisplay(new Date(serializedDate.value)) || undefined}
          />
        }
        hintStart={<MatHint>MM/DD/YYYY</MatHint>}
        iconSuffix={<MatDatepickerToggle picker={picker2} />}
        infixContent={<MatDatepicker picker={picker2} />}
      />

      <MatFormField
        label={<MatLabel>Value binding</MatLabel>}
        control={
          <MatDatepickerInput picker={picker3} value={formatDateForDisplay(date.value) || undefined} />
        }
        hintStart={<MatHint>MM/DD/YYYY</MatHint>}
        iconSuffix={<MatDatepickerToggle picker={picker3} />}
        infixContent={<MatDatepicker picker={picker3} />}
      />
    </datepicker-value-example>
  );
});
