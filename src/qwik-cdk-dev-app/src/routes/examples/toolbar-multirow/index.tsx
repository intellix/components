import {component$} from '@qwik.dev/core';
// Relative import — see routes/examples/toolbar-simple/index.tsx's header comment.
import Example from '../../../../../qwik-material-examples/toolbar/toolbar-multirow/index.tsx';

export default component$(() => (
  <>
    <div data-parity-root>
      <Example />
    </div>
    <main data-scenario-ready>ready</main>
  </>
));
