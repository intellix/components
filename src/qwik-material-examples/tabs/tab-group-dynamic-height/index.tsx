import {component$} from '@qwik.dev/core';
import {MatTabGroup} from '@angular-community/qwik-material/tabs';
import './tab-group-dynamic-height-example.css';

// Qwik port of material.angular.dev's `tab-group-dynamic-height` docs example. Rendered
// unmodified by the Angular dev-app at /qwik-parity/examples/tab-group-dynamic-height.

export default component$(() => (
  <tab-group-dynamic-height-example>
    <MatTabGroup
      dynamicHeight
      tabs={[
        {
          label: 'Short tab',
          content: (
            <div class="example-small-box mat-elevation-z4">Small content</div>
          ),
        },
        {
          label: 'Long tab',
          content: (
            <div class="example-large-box mat-elevation-z4">Large content</div>
          ),
        },
      ]}
    />
  </tab-group-dynamic-height-example>
));
