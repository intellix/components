import {component$} from '@qwik.dev/core';
import {MatCheckbox} from '@angular-community/qwik-material/checkbox';

export default component$(() => {
  return (
    <>
      <div data-parity-root>
        <MatCheckbox
          aria-describedby="details-1"
          aria-expanded
          aria-controls="details-1"
          aria-owns="details-1"
        >
          Show advanced options
        </MatCheckbox>
        <div id="details-1">Additional details shown when expanded.</div>
      </div>
      <main data-scenario-ready>ready</main>
    </>
  );
});
