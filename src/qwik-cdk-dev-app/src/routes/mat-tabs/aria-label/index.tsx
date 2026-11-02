import {component$, useSignal} from '@qwik.dev/core';
import {MatTabGroup} from '@angular-community/qwik-material/tabs';

export default component$(() => {
  // Angular's MatTabGroup owns `_selectedIndex` internally and updates it on
  // click regardless of whether the consumer listens to
  // `(selectedIndexChange)` — this scenario's Angular source has no such
  // binding. This port's MatTabGroup is a fully controlled component (no
  // internal fallback state), so the route must wire `selectedIndex` +
  // `onSelectedIndexChange$` itself to get the same observable click
  // behavior, even with no `<p>` readout to show it.
  const selected0 = useSignal(0);
  const selected1 = useSignal(0);

  return (
    <>
      <div data-parity-root>
        <MatTabGroup
          style="width: 480px"
          aria-label="Settings sections"
          selectedIndex={selected0.value}
          onSelectedIndexChange$={i => {
            selected0.value = i;
          }}
          tabs={[
            {label: 'First', content: 'Content 1'},
            {label: 'Second', content: 'Content 2'},
          ]}
        />
        <label id="ext-tabs-label">External tabs label</label>
        <MatTabGroup
          style="width: 480px"
          aria-labelledby="ext-tabs-label"
          selectedIndex={selected1.value}
          onSelectedIndexChange$={i => {
            selected1.value = i;
          }}
          tabs={[
            {label: 'First', content: 'Content 1'},
            {label: 'Second', content: 'Content 2'},
          ]}
        />
      </div>
      <main data-scenario-ready>ready</main>
    </>
  );
});
