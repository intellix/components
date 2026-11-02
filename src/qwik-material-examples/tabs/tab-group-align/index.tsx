import {component$} from '@qwik.dev/core';
import {MatTabGroup} from '@angular-community/qwik-material/tabs';

// Qwik port of material.angular.dev's `tab-group-align` docs example. Rendered unmodified by the
// Angular dev-app at /qwik-parity/examples/tab-group-align.

const tabs = [
  {label: 'First', content: 'Content 1'},
  {label: 'Second', content: 'Content 2'},
  {label: 'Third', content: 'Content 3'},
];

export default component$(() => (
  <tab-group-align-example>
    <MatTabGroup stretchTabs={false} alignTabs="start" tabs={tabs} />
    <MatTabGroup stretchTabs={false} alignTabs="center" tabs={tabs} />
    <MatTabGroup stretchTabs={false} alignTabs="end" tabs={tabs} />
  </tab-group-align-example>
));
