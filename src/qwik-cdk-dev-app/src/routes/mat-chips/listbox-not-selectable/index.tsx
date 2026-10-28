import {component$} from '@builder.io/qwik';
import {MatChipListbox} from '@angular-community/qwik-material/chips';

export default component$(() => (
  <>
    <div data-parity-root>
      <MatChipListbox
        selectable={false}
        aria-label="Read-only tags"
        options={[
          {key: 'a', content: 'Tag A'},
          {key: 'b', content: 'Tag B'},
        ]}
      />
    </div>
    <main data-scenario-ready>ready</main>
  </>
));
