import {component$, useSignal} from '@qwik.dev/core';
import {MatTabGroup} from '@angular-community/qwik-material/tabs';

// Qwik port of material.angular.dev's `tab-group-basic` docs example — see
// src/components-examples/material/tabs/tab-group-basic/tab-group-basic-example.{ts,html}.
// Rendered unmodified by the Angular dev-app at /qwik-parity/mat-tabs/example
// (src/dev-app/qwik-parity/examples.ts). Host tag mirrors the example's own component selector
// (`tab-group-basic-example`). No `[(selectedIndex)]` binding upstream either — a local signal
// just keeps `<MatTabGroup>`'s controlled-component contract satisfied the same way every other
// scenario in this dev-app does; the observable DOM/behavior is unaffected.

export default component$(() => {
  const selected = useSignal(0);

  return (
    <tab-group-basic-example>
      <MatTabGroup
        selectedIndex={selected.value}
        onSelectedIndexChange$={i => {
          selected.value = i;
        }}
        tabs={[
          {label: 'First', content: ' Content 1 '},
          {label: 'Second', content: ' Content 2 '},
          {label: 'Third', content: ' Content 3 '},
        ]}
      />
    </tab-group-basic-example>
  );
});
