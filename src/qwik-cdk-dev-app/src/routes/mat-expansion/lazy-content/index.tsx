import {$, component$, useSignal} from '@builder.io/qwik';
import {
  MatExpansionPanel,
  MatExpansionPanelContent,
  MatExpansionPanelHeader,
  MatPanelTitle,
} from '@angular-community/qwik-material/expansion';

// Mirrors ExpansionLazyContent — standalone panel starting collapsed; body
// content only renders once the panel opens for the first time, then stays
// rendered forever.
export default component$(() => {
  const panelExpanded = useSignal(false);

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
            <MatPanelTitle q:slot="title">Lazy-rendered content</MatPanelTitle>
          </MatExpansionPanelHeader>
          <MatExpansionPanelContent>
            <p>Rendered only after the panel opens for the first time.</p>
          </MatExpansionPanelContent>
        </MatExpansionPanel>
      </div>
      <main data-scenario-ready>ready</main>
    </>
  );
});
