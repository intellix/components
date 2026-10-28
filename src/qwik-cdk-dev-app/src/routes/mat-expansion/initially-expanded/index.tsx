import {$, component$, useSignal} from '@builder.io/qwik';
import {
  MatExpansionPanel,
  MatExpansionPanelHeader,
  MatPanelTitle,
} from '@angular-community/qwik-material/expansion';

// Mirrors ExpansionInitiallyExpanded — standalone panel starting expanded.
export default component$(() => {
  const panelExpanded = useSignal(true);

  return (
    <>
      <div data-parity-root>
        <MatExpansionPanel
          expanded={panelExpanded.value}
          onExpandedChange$={$((v: boolean) => {
            panelExpanded.value = v;
          })}
        >
          <MatExpansionPanelHeader q:slot="header">
            <MatPanelTitle q:slot="title">Billing address</MatPanelTitle>
          </MatExpansionPanelHeader>
          <p>Visible immediately because the panel starts expanded.</p>
        </MatExpansionPanel>
        <p>Expanded: {panelExpanded.value ? 'true' : 'false'}</p>
      </div>
      <main data-scenario-ready>ready</main>
    </>
  );
});
