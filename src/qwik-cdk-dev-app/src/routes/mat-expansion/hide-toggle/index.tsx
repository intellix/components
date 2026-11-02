import {$, component$, useSignal} from '@qwik.dev/core';
import {
  MatExpansionPanel,
  MatExpansionPanelHeader,
  MatPanelTitle,
} from '@angular-community/qwik-material/expansion';

// Mirrors ExpansionHideToggle — standalone panel, hideToggle=true. Unlike
// 'disabled', toggling still works; only the indicator is hidden.
export default component$(() => {
  const expanded = useSignal(false);

  return (
    <>
      <div data-parity-root>
        <MatExpansionPanel
          hideToggle
          expanded={expanded.value}
          onExpandedChange$={$((v: boolean) => {
            expanded.value = v;
          })}
        >
          <MatExpansionPanelHeader q:slot="header">
            <MatPanelTitle q:slot="title">No indicator</MatPanelTitle>
          </MatExpansionPanelHeader>
          <p>Content without an expansion indicator.</p>
        </MatExpansionPanel>
      </div>
      <main data-scenario-ready>ready</main>
    </>
  );
});
