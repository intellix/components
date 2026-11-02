import {component$} from '@qwik.dev/core';
// Relative import, NOT the `@angular-community/qwik-material-examples/toolbar/toolbar-simple`
// package specifier used by every other wrapper route in this directory tree — see this batch's
// final report for why (qwik-material-examples/package.json's `exports` map, a file shared by
// every component's example ports, couldn't be updated here). Functionally identical: same
// workspace, same build graph, just not routed through the package's public subpath exports.
import Example from '../../../../../qwik-material-examples/toolbar/toolbar-simple/index.tsx';

export default component$(() => (
  <>
    <div data-parity-root>
      <Example />
    </div>
    <main data-scenario-ready>ready</main>
  </>
));
