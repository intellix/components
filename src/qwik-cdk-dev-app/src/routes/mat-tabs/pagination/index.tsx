import {component$, useSignal} from '@builder.io/qwik';
import {MatTabGroup, type MatTabDef} from '@angular-community/qwik-material/tabs';

export default component$(() => {
  const selected = useSignal(0);
  const tabs: MatTabDef[] = Array.from({length: 20}, (_, i) => ({
    label: `Tab ${i}`,
    content: `Content for Tab ${i}`,
  }));

  return (
    <>
      <div data-parity-root>
        <MatTabGroup
          style="width: 300px"
          selectedIndex={selected.value}
          onSelectedIndexChange$={i => {
            selected.value = i;
          }}
          tabs={tabs}
        />
        <p>Selected: {selected.value}</p>
      </div>
      <main data-scenario-ready>ready</main>
    </>
  );
});
