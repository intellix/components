import {$, component$, useSignal} from '@qwik.dev/core';
import {MatCalendar} from '@angular-community/qwik-material/datepicker';

const JAN_1_2024 = new Date(2024, 0, 1);

// Mirrors src/dev-app/qwik-parity/datepicker.ts's DatepickerInlineCalendar — a bare
// `<mat-calendar>`, no form field/popup at all. `DatePipe 'M/d/yyyy'` formatting (no leading
// zeros) is reproduced by hand below — chosen upstream specifically to avoid a platform/
// timezone-dependent `Date.prototype.toString()` string.
function formatSelected(value: Date | null): string {
  if (!value) return '(none)';
  return `${value.getMonth() + 1}/${value.getDate()}/${value.getFullYear()}`;
}

export default component$(() => {
  const selected = useSignal<Date | null>(null);

  return (
    <>
      <div data-parity-root>
        <MatCalendar
          startAt={JAN_1_2024}
          selected={selected.value}
          // v2: like the Handle<D> casts elsewhere in this directory, `<MatCalendar>`
          // (exported via the erased-generic component$<MatCalendarProps>) only ever
          // types `onUserSelect$` as `(date: unknown) => void`. Leaving `value`
          // unannotated lets it infer `unknown` from that contextual type instead of
          // mismatching against `Date | null`.
          onUserSelect$={$(value => {
            selected.value = value as Date | null;
          })}
        />
        <p>Selected: {formatSelected(selected.value)}</p>
      </div>
      <main data-scenario-ready>ready</main>
    </>
  );
});
