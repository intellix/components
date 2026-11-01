import {component$} from '@qwik.dev/core';
import {MatRadioButton} from '@angular-community/qwik-material/radio';

export default component$(() => (
  <>
    <div data-parity-root>
      <span id="radio-aria-attrs-label">Baby banana</span>
      <span id="radio-aria-attrs-desc">A smaller banana</span>
      <MatRadioButton name="fruit-1" value="banana" aria-label="Banana" />
      <MatRadioButton
        name="fruit-2"
        value="kiwi"
        aria-labelledby="radio-aria-attrs-label"
        aria-describedby="radio-aria-attrs-desc"
      />
    </div>
    <main data-scenario-ready>ready</main>
  </>
));
