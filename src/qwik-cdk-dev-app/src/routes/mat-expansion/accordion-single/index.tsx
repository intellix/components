import {$, component$, useSignal} from '@qwik.dev/core';
import {
  MatAccordion,
  MatExpansionPanel,
  MatExpansionPanelHeader,
  MatPanelTitle,
} from '@angular-community/qwik-material/expansion';

// Mirrors ExpansionAccordionSingle — default accordion (multi=false), panel
// 1 starts expanded. Clicking a header auto-closes the other one.
export default component$(() => {
  const panel1Expanded = useSignal(true);
  const panel2Expanded = useSignal(false);

  return (
    <>
      <div data-parity-root>
        <MatAccordion>
          <MatExpansionPanel
            expanded={panel1Expanded.value}
            onExpandedChange$={$((v: boolean) => {
              panel1Expanded.value = v;
            })}
          >
            <MatExpansionPanelHeader q:slot="header">
              <MatPanelTitle q:slot="title">Section 1</MatPanelTitle>
            </MatExpansionPanelHeader>
            <p>Content of section 1.</p>
          </MatExpansionPanel>
          <MatExpansionPanel
            expanded={panel2Expanded.value}
            onExpandedChange$={$((v: boolean) => {
              panel2Expanded.value = v;
            })}
          >
            <MatExpansionPanelHeader q:slot="header">
              <MatPanelTitle q:slot="title">Section 2</MatPanelTitle>
            </MatExpansionPanelHeader>
            <p>Content of section 2.</p>
          </MatExpansionPanel>
        </MatAccordion>
      </div>
      <main data-scenario-ready>ready</main>
    </>
  );
});
