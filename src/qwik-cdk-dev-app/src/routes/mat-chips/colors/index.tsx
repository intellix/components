import {component$} from '@builder.io/qwik';
import {MatChipSet} from '@angular-community/qwik-material/chips';

export default component$(() => (
  <>
    <div data-parity-root>
      <MatChipSet
        aria-label="Color variants"
        chips={[
          {key: 'default', content: 'Default'},
          {key: 'primary', content: 'Primary', color: 'primary'},
          {key: 'accent', content: 'Accent', color: 'accent'},
          {key: 'warn', content: 'Warn', color: 'warn'},
        ]}
      />
    </div>
    <main data-scenario-ready>ready</main>
  </>
));
