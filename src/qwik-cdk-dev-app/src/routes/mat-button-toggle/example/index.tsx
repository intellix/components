import {component$, useSignal} from '@builder.io/qwik';
import {
  MatButtonToggleGroup,
  MatButtonToggle,
} from '@angular-community/qwik-material/button-toggle';

// Port of src/components-examples/material/button-toggle/button-toggle-overview
// (button-toggle-overview-example.html/.ts) — material.angular.dev's "Basic
// button-toggles" example. No CSS file upstream. Upstream's group has no
// [value]/(change) binding at all (fully self-managed); ported as a
// controlled signal, matching every other /mat-button-toggle/* route's
// convention — the initial (nothing-selected) DOM is identical either way.
export default component$(() => {
  const fontStyle = useSignal<string | undefined>(undefined);

  return (
    <>
      <div data-parity-root>
        <button-toggle-overview-example>
          <MatButtonToggleGroup
            name="fontStyle"
            aria-label="Font Style"
            value={fontStyle.value}
            onChange$={(v: unknown) => {
              fontStyle.value = v as string | undefined;
            }}
          >
            <MatButtonToggle value="bold">Bold</MatButtonToggle>
            <MatButtonToggle value="italic">Italic</MatButtonToggle>
            <MatButtonToggle value="underline">Underline</MatButtonToggle>
          </MatButtonToggleGroup>
        </button-toggle-overview-example>
      </div>
      <main data-scenario-ready>ready</main>
    </>
  );
});
