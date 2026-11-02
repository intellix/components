import {component$} from '@qwik.dev/core';
import {
  MatExpansionPanel,
  MatExpansionPanelHeader,
  MatPanelDescription,
  MatPanelTitle,
} from '@angular-community/qwik-material/expansion';

// Mirrors ExpansionDisabled — standalone panel, disabled=true. Never
// toggles, regardless of what expanded is initialized to.
export default component$(() => (
  <>
    <div data-parity-root>
      <MatExpansionPanel disabled>
        <MatExpansionPanelHeader q:slot="header">
          <MatPanelTitle q:slot="title">Destination</MatPanelTitle>
          <MatPanelDescription q:slot="description">Type the country name</MatPanelDescription>
        </MatExpansionPanelHeader>
        <p>This panel cannot be toggled.</p>
      </MatExpansionPanel>
    </div>
    <main data-scenario-ready>ready</main>
  </>
));
