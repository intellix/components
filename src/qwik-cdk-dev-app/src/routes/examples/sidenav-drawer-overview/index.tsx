import {component$} from '@qwik.dev/core';
import Example from '../../../../../qwik-material-examples/sidenav/sidenav-drawer-overview/index.tsx';

export default component$(() => (
  <>
    <div data-parity-root>
      <Example />
    </div>
    <main data-scenario-ready>ready</main>
  </>
));
