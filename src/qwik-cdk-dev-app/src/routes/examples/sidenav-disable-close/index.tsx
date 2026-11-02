import {component$} from '@qwik.dev/core';
import Example from '../../../../../qwik-material-examples/sidenav/sidenav-disable-close/index.tsx';

export default component$(() => (
  <>
    <div data-parity-root>
      <Example />
    </div>
    <main data-scenario-ready>ready</main>
  </>
));
