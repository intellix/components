import {component$, useSignal} from '@qwik.dev/core';
import {
  MatFormField,
  MatLabel,
  useMatFormControl,
} from '@angular-community/qwik-material/form-field';
import {MatInput} from '@angular-community/qwik-material/input';

/**
 * Bespoke regression scenario: a component that reads a signal in its own body (so a change
 * re-runs the whole component, not just a JSX prop) while passing one of `useMatFormControl()`'s
 * QRLs to a control. `useMatFormControl()` used to reassign those QRLs on its store on every
 * render — a write to a store property this component had just read, so Qwik dropped the
 * re-render and `#count` never updated.
 */
export default component$(() => {
  const count = useSignal(0);
  const name = useMatFormControl();
  const label = `count ${count.value}`;
  return (
    <>
      <button id="increment" onClick$={() => count.value++}>
        Increment
      </button>
      <span id="count">{label}</span>
      <MatFormField
        label={<MatLabel>Name</MatLabel>}
        control={<MatInput value={name.value} onBlur$={name.markAsTouched$} />}
      />
      <main data-scenario-ready>ready</main>
    </>
  );
});
