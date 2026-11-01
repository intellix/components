import {component$} from '@qwik.dev/core';
import {MatChipSet} from '@angular-community/qwik-material/chips';

export default component$(() => (
  <>
    <div data-parity-root>
      <MatChipSet
        aria-label="Contact selection"
        chips={[
          {
            key: 'kara',
            content: 'Kara',
            avatar: 'K',
            removeButton: {content: '×', 'aria-label': 'Remove Kara'},
          },
          {
            key: 'jeremy',
            content: 'Jeremy',
            trailingIcon: '★',
          },
        ]}
      />
    </div>
    <main data-scenario-ready>ready</main>
  </>
));
