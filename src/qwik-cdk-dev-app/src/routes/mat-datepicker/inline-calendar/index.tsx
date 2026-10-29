import {$, component$, useSignal} from '@builder.io/qwik';
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
          onUserSelect$={$((value: Date | null) => {
            selected.value = value;
          })}
        />
        <p>Selected: {formatSelected(selected.value)}</p>
      </div>
      <main data-scenario-ready>ready</main>
    </>
  );
});
