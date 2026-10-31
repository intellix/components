import {$, component$, useSignal} from '@builder.io/qwik';
import {MatFormField, MatHint, MatLabel} from '@angular-community/qwik-material/form-field';
import {
  formatDateForDisplay,
  MatDatepicker,
  MatDatepickerInput,
  MatDatepickerToggle,
  useMatDatepicker,
} from '@angular-community/qwik-material/datepicker';

// Qwik port of material.angular.dev's `datepicker-overview` docs example — see
// src/components-examples/material/datepicker/datepicker-overview/datepicker-overview-example.
// {ts,html}. Rendered unmodified by the Angular dev-app at /qwik-parity/mat-datepicker/example
// (src/dev-app/qwik-parity/examples.ts). Host tag mirrors the example's own component selector
// (`datepicker-overview-example`). No `startAt`/initial value upstream either — the calendar
// opens on "today" (see use-mat-datepicker.ts's `startAt` doc comment), so opening it is only
// deterministic under the parity harness's Playwright clock emulation
// (specs/examples/angular-parity.spec.ts's `clockDate`), never by pinning a date here.
export default component$(() => {
  const value = useSignal<Date | null>(null);
  const picker = useMatDatepicker<Date>({
    onValueChange$: $((v: Date | null) => (value.value = v)),
  });

  return (
    <>
      <div data-parity-root>
        <datepicker-overview-example>
          <MatFormField
            label={<MatLabel>Choose a date</MatLabel>}
            control={
              <MatDatepickerInput
                picker={picker}
                value={formatDateForDisplay(value.value) || undefined}
              />
            }
            hintStart={<MatHint>MM/DD/YYYY</MatHint>}
            iconSuffix={<MatDatepickerToggle picker={picker} />}
            infixContent={<MatDatepicker picker={picker} />}
          />
        </datepicker-overview-example>
      </div>
      <main data-scenario-ready>ready</main>
    </>
  );
});
