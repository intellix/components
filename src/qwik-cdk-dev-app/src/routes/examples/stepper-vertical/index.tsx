import {component$} from '@qwik.dev/core';
import Example from '../../../../../qwik-material-examples/stepper/stepper-vertical/index.tsx';

export default component$(() => (
  <>
    <div data-parity-root>
      <Example />
    </div>
    <main data-scenario-ready>ready</main>
  </>
));
