import {$, component$, useSignal} from '@qwik.dev/core';
import {
  MatExpansionPanel,
  MatExpansionPanelHeader,
  MatPanelTitle,
} from '@angular-community/qwik-material/expansion';

// Mirrors ExpansionTogglePositionBefore — standalone panel, togglePosition='before'.
export default component$(() => {
  const expanded = useSignal(false);

  return (
    <>
      <div data-parity-root>
        <MatExpansionPanel
          togglePosition="before"
          expanded={expanded.value}
          onExpandedChange$={$((v: boolean) => {
            expanded.value = v;
          })}
        >
          <MatExpansionPanelHeader q:slot="header">
            <MatPanelTitle q:slot="title">Indicator before the title</MatPanelTitle>
          </MatExpansionPanelHeader>
          <p>Content with a leading expansion indicator.</p>
        </MatExpansionPanel>
      </div>
      <main data-scenario-ready>ready</main>
    </>
  );
});
