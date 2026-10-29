import {component$} from '@builder.io/qwik';
import {MatChipSet} from '@angular-community/qwik-material/chips';

export default component$(() => (
  <>
    <div data-parity-root>
      <MatChipSet
        aria-label="Fruit selection"
        chips={[
          {key: 'apple', content: 'Apple'},
          {key: 'banana', content: 'Banana', highlighted: true},
          {key: 'cherry', content: 'Cherry', disabled: true},
        ]}
      />
    </div>
    <main data-scenario-ready>ready</main>
  </>
));
