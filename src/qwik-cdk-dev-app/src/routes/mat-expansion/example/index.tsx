import {$, component$, useSignal} from '@qwik.dev/core';
import {
  MatAccordion,
  MatExpansionPanel,
  MatExpansionPanelHeader,
  MatPanelDescription,
  MatPanelTitle,
} from '@angular-community/qwik-material/expansion';

// Qwik port of material.angular.dev's `expansion-overview` docs example — see
// src/components-examples/material/expansion/expansion-overview/expansion-overview-example.{ts,html}.
// Rendered unmodified by the Angular dev-app at /qwik-parity/mat-expansion/example
// (src/dev-app/qwik-parity/examples.ts). Host tag mirrors the example's own component selector
// (`expansion-overview-example`). The first panel has no `(opened)`/`(closed)` binding upstream
// either (purely internal toggle state) — wired to a local signal anyway so
// `<MatExpansionPanel>`'s controlled-component contract is satisfied uniformly, same as every
// other scenario in this dev-app (see mat-expansion/basic/index.tsx's identical note).
export default component$(() => {
  const panel1Expanded = useSignal(false);
  const panel2Expanded = useSignal(false);
  const panelOpenState = useSignal(false);

  return (
    <>
      <div data-parity-root>
        <expansion-overview-example>
          <MatAccordion>
            <MatExpansionPanel
              hideToggle
              expanded={panel1Expanded.value}
              onExpandedChange$={$((v: boolean) => {
                panel1Expanded.value = v;
              })}
            >
              <MatExpansionPanelHeader q:slot="header">
                <MatPanelTitle q:slot="title"> This is the expansion title </MatPanelTitle>
                <MatPanelDescription q:slot="description">
                  {' '}
                  This is a summary of the content{' '}
                </MatPanelDescription>
              </MatExpansionPanelHeader>
              <p>This is the primary content of the panel.</p>
            </MatExpansionPanel>
            <MatExpansionPanel
              expanded={panel2Expanded.value}
              onExpandedChange$={$((v: boolean) => {
                panel2Expanded.value = v;
              })}
              onOpened$={$(() => {
                panelOpenState.value = true;
              })}
              onClosed$={$(() => {
                panelOpenState.value = false;
              })}
            >
              <MatExpansionPanelHeader q:slot="header">
                <MatPanelTitle q:slot="title"> Self aware panel </MatPanelTitle>
                <MatPanelDescription q:slot="description">
                  Currently I am {panelOpenState.value ? 'open' : 'closed'}
                </MatPanelDescription>
              </MatExpansionPanelHeader>
              <p>I'm visible because I am open</p>
            </MatExpansionPanel>
          </MatAccordion>
        </expansion-overview-example>
      </div>
      <main data-scenario-ready>ready</main>
    </>
  );
});
