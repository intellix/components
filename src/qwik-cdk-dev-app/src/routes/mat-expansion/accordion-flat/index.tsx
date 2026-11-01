import {$, component$, useSignal} from '@qwik.dev/core';
import {
  MatAccordion,
  MatExpansionPanel,
  MatExpansionPanelHeader,
  MatPanelTitle,
} from '@angular-community/qwik-material/expansion';

// Mirrors ExpansionAccordionFlat — displayMode='flat' accordion, two panels,
// both collapsed. Expanding never adds mat-expansion-panel-spacing.
export default component$(() => {
  const panel1Expanded = useSignal(false);
  const panel2Expanded = useSignal(false);

  return (
    <>
      <div data-parity-root>
        <MatAccordion displayMode="flat">
          <MatExpansionPanel
            expanded={panel1Expanded.value}
            onExpandedChange$={$((v: boolean) => {
              panel1Expanded.value = v;
            })}
          >
            <MatExpansionPanelHeader q:slot="header">
              <MatPanelTitle q:slot="title">Flat section 1</MatPanelTitle>
            </MatExpansionPanelHeader>
            <p>Content of flat section 1.</p>
          </MatExpansionPanel>
          <MatExpansionPanel
            expanded={panel2Expanded.value}
            onExpandedChange$={$((v: boolean) => {
              panel2Expanded.value = v;
            })}
          >
            <MatExpansionPanelHeader q:slot="header">
              <MatPanelTitle q:slot="title">Flat section 2</MatPanelTitle>
            </MatExpansionPanelHeader>
            <p>Content of flat section 2.</p>
          </MatExpansionPanel>
        </MatAccordion>
      </div>
      <main data-scenario-ready>ready</main>
    </>
  );
});
