import {$, component$, useSignal} from '@qwik.dev/core';
import {
  MatExpansionPanel,
  MatExpansionPanelHeader,
  MatPanelTitle,
} from '@angular-community/qwik-material/expansion';

// Mirrors ExpansionHeaderHeights — standalone panel, starts collapsed. The
// *header* (not the panel) sets expandedHeight/collapsedHeight.
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
          <MatExpansionPanelHeader q:slot="header" expandedHeight="64px" collapsedHeight="32px">
            <MatPanelTitle q:slot="title">Custom header heights</MatPanelTitle>
          </MatExpansionPanelHeader>
          <p>Header height changes between collapsed and expanded.</p>
        </MatExpansionPanel>
      </div>
      <main data-scenario-ready>ready</main>
    </>
  );
});
