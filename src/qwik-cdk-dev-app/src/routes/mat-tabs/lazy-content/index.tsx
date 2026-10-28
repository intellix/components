import {component$, useSignal} from '@builder.io/qwik';
import {MatTabGroup} from '@angular-community/qwik-material/tabs';

// Mirrors `<ng-template matTabContent>` scenarios: upstream's `matTabContent`
// and plain inline content are observably identical (attach-on-first-center,
// detach-on-leave) — see mat-tab-body.tsx's doc comment for why this port
// has no separate "lazy" content prop.
export default component$(() => {
  const selected = useSignal(0);

  return (
    <>
      <div data-parity-root>
        <MatTabGroup
          style="width: 480px"
          selectedIndex={selected.value}
          onSelectedIndexChange$={i => {
            selected.value = i;
          }}
          tabs={[
            {
              label: 'First',
              content: <p>Loaded content 1</p>,
            },
            {
              label: 'Second',
              content: <p>Loaded content 2</p>,
            },
          ]}
        />
        <p>Selected: {selected.value}</p>
      </div>
      <main data-scenario-ready>ready</main>
    </>
  );
});
