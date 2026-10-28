import {component$} from '@builder.io/qwik';
import {MatChipListbox} from '@angular-community/qwik-material/chips';

export default component$(() => (
  <>
    <div data-parity-root>
      <MatChipListbox
        aria-label="Priority"
        aria-orientation="vertical"
        options={[
          {key: 'low', value: 'low', content: 'Low'},
          {key: 'medium', value: 'medium', content: 'Medium'},
          {key: 'high', value: 'high', content: 'High', selected: true},
        ]}
      />
    </div>
    <main data-scenario-ready>ready</main>
  </>
));
