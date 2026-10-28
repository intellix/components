import {$, component$, useSignal} from '@builder.io/qwik';
import {
  MatActionRow,
  MatExpansionPanel,
  MatExpansionPanelHeader,
  MatPanelTitle,
} from '@angular-community/qwik-material/expansion';

// Mirrors ExpansionActionRow — standalone panel starting expanded, with two
// plain (non-matButton, deliberately) buttons in a mat-action-row that each
// close the panel by setting the SAME signal the panel's `expanded` prop
// reads — exactly like Angular's two-way `[(expanded)]="panelExpanded"`
// plus `(click)="panelExpanded = false"` on the buttons.
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
            <MatPanelTitle q:slot="title">Confirm changes</MatPanelTitle>
          </MatExpansionPanelHeader>
          <p>This is the primary content of the panel.</p>
          <MatActionRow q:slot="actionRow">
            <button
              type="button"
              onClick$={$(() => {
                panelExpanded.value = false;
              })}
            >
              CANCEL
            </button>
            <button
              type="button"
              onClick$={$(() => {
                panelExpanded.value = false;
              })}
            >
              SAVE
            </button>
          </MatActionRow>
        </MatExpansionPanel>
      </div>
      <main data-scenario-ready>ready</main>
    </>
  );
});
