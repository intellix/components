import {component$} from '@builder.io/qwik';
import {MatCheckbox} from '@angular-community/qwik-material/checkbox';

// Uncontrolled: no `checked` prop at all, matching the Angular scenario's
// `<mat-checkbox [aria-label]="'Enable notifications'">` with no `[checked]`
// binding — the checkbox self-manages via its internal signal.
export default component$(() => {
  return (
    <>
      <div data-parity-root>
        <MatCheckbox aria-label="Enable notifications" />
      </div>
      <main data-scenario-ready>ready</main>
    </>
  );
});
