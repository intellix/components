import {component$} from '@qwik.dev/core';
import {MatTabGroup} from '@angular-community/qwik-material/tabs';

// Qwik port of material.angular.dev's `tab-group-animations` docs example. Rendered unmodified
// by the Angular dev-app at /qwik-parity/examples/tab-group-animations.

const tabs = [
  {label: 'First', content: 'Content 1'},
  {label: 'Second', content: 'Content 2'},
  {label: 'Third', content: 'Content 3'},
];

export default component$(() => (
  <tab-group-animations-example>
    <h3>No animation</h3>
    <MatTabGroup animationDuration="0ms" tabs={tabs} />

    <h3>Very slow animation</h3>
    <MatTabGroup animationDuration="2000ms" tabs={tabs} />
  </tab-group-animations-example>
));
