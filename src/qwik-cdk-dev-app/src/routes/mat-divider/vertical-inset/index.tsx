import {component$} from '@builder.io/qwik';
import {MatDivider} from '@angular-community/qwik-material/divider';

export default component$(() => (
  <>
    <div style={{display: 'flex', alignItems: 'stretch', height: '80px'}}>
      <span>Left</span>
      <MatDivider vertical inset />
      <span>Right</span>
    </div>
    <main data-scenario-ready>ready</main>
  </>
));
