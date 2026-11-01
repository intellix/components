import {$, component$, useSignal} from '@qwik.dev/core';
import {
  MatAccordion,
  MatExpansionPanel,
  MatExpansionPanelHeader,
  MatPanelTitle,
} from '@angular-community/qwik-material/expansion';

// Mirrors ExpansionAccordionMulti — multi=true accordion, three panels, all
// collapsed initially. Opening one never auto-closes another.
export default component$(() => {
  const panel1Expanded = useSignal(false);
  const panel2Expanded = useSignal(false);
  const panel3Expanded = useSignal(false);

  return (
    <>
      <div data-parity-root>
        <MatAccordion multi>
          <MatExpansionPanel
            expanded={panel1Expanded.value}
            onExpandedChange$={$((v: boolean) => {
              panel1Expanded.value = v;
            })}
          >
            <MatExpansionPanelHeader q:slot="header">
              <MatPanelTitle q:slot="title">Alpha</MatPanelTitle>
            </MatExpansionPanelHeader>
            <p>Alpha content.</p>
          </MatExpansionPanel>
          <MatExpansionPanel
            expanded={panel2Expanded.value}
            onExpandedChange$={$((v: boolean) => {
              panel2Expanded.value = v;
            })}
          >
            <MatExpansionPanelHeader q:slot="header">
              <MatPanelTitle q:slot="title">Beta</MatPanelTitle>
            </MatExpansionPanelHeader>
            <p>Beta content.</p>
          </MatExpansionPanel>
          <MatExpansionPanel
            expanded={panel3Expanded.value}
            onExpandedChange$={$((v: boolean) => {
              panel3Expanded.value = v;
            })}
          >
            <MatExpansionPanelHeader q:slot="header">
              <MatPanelTitle q:slot="title">Gamma</MatPanelTitle>
            </MatExpansionPanelHeader>
            <p>Gamma content.</p>
          </MatExpansionPanel>
        </MatAccordion>
      </div>
      <main data-scenario-ready>ready</main>
    </>
  );
});
