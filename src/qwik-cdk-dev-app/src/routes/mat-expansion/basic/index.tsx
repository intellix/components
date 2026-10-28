import {$, component$, useSignal} from '@builder.io/qwik';
import {
  MatExpansionPanel,
  MatExpansionPanelHeader,
  MatPanelDescription,
  MatPanelTitle,
} from '@angular-community/qwik-material/expansion';

// Mirrors src/dev-app/qwik-parity/expansion.ts's ExpansionBasic. Angular's
// template has no [expanded] binding at all (purely internal toggle state);
// this route wires an expanded signal + onExpandedChange$ anyway so
// MatExpansionPanel's controlled-component contract is satisfied uniformly
// across every scenario — the Angular side's internal-vs-bound distinction
// doesn't change the OBSERVABLE DOM/behavior parity is judged on.
export default component$(() => {
  const expanded = useSignal(false);
  const opened = useSignal(false);

  return (
    <>
      <div data-parity-root>
        <MatExpansionPanel
          expanded={expanded.value}
          onExpandedChange$={$((v: boolean) => {
            expanded.value = v;
          })}
          onOpened$={$(() => {
            opened.value = true;
          })}
          onClosed$={$(() => {
            opened.value = false;
          })}
        >
          <MatExpansionPanelHeader q:slot="header">
            <MatPanelTitle q:slot="title">Personal data</MatPanelTitle>
            <MatPanelDescription q:slot="description">Type your name and age</MatPanelDescription>
          </MatExpansionPanelHeader>
          <p>This is the primary content of the panel.</p>
        </MatExpansionPanel>
        <p>Opened: {opened.value ? 'true' : 'false'}</p>
      </div>
      <main data-scenario-ready>ready</main>
    </>
  );
});
