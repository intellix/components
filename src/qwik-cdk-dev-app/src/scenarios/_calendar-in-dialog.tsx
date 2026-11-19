import {$, component$, useSignal} from '@qwik.dev/core';
import {MatButton, useMatButtonStyles} from '@angular-community/qwik-material/button';
import {MatCalendar} from '@angular-community/qwik-material/datepicker';
import {useMatDialog} from '@angular-community/qwik-material/dialog';
import {NgComponentHost} from './_mat-template';

const JAN_1_2024 = new Date(2024, 0, 1);

const CalendarBody = component$<{class?: string}>(props => (
  <NgComponentHost class={props.class}>
    <MatCalendar startAt={JAN_1_2024} />
  </NgComponentHost>
));

/**
 * A hand-written `mdc-button` host that registers the button CSS NOT as its first hook — what
 * the README says not to do: Qwik keys a `useStyles$` `<style>` by hook index too, so this
 * registers a byte-identical second copy of the button CSS, appended to `<head>` after
 * everything registered before it.
 */
const HandWrittenButton = component$(() => {
  const label = useSignal('Hand-written');
  useMatButtonStyles();
  return (
    <button class="mat-mdc-button-base mdc-button mat-mdc-button hand-written">
      {label.value}
    </button>
  );
});

/**
 * Qwik-only (no Angular counterpart) — `specs/material-core/component-styles.spec.ts`: a dialog
 * holding a `MatCalendar`, so the datepicker CSS is first registered in the browser. The
 * datepicker CSS overrides the button CSS at equal specificity (`.mat-calendar-period-button {
 * min-width: 0 }` over `.mdc-button`'s 64px), which inside the one `qwik-material` layer only
 * document order settles. `serverButton`: the dialog opens from a server-rendered `MatButton`
 * (button CSS in the page before the calendar's); otherwise from a native `<button>` (the
 * calendar brings the button CSS itself).
 */
export const CalendarInDialog = component$<{serverButton: boolean}>(props => {
  const dialog = useMatDialog();
  const showHandWritten = useSignal(false);
  const open$ = $(() => dialog.open$(CalendarBody, {hasBackdrop: false}));
  return (
    <>
      <div data-parity-root>
        {props.serverButton ? (
          <MatButton class="open-calendar" onClick$={open$}>
            Open calendar
          </MatButton>
        ) : (
          <button class="open-calendar" onClick$={open$}>
            Open calendar
          </button>
        )}
        <button class="show-hand-written" onClick$={() => (showHandWritten.value = true)}>
          Show a hand-written button
        </button>
        {showHandWritten.value && <HandWrittenButton />}
      </div>
      <main data-scenario-ready>ready</main>
    </>
  );
});
