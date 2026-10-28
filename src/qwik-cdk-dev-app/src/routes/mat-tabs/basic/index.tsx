import {component$, useSignal} from '@builder.io/qwik';
import {MatTabGroup} from '@angular-community/qwik-material/tabs';

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
            {label: 'First', content: 'Content 1'},
            {label: 'Second', content: 'Content 2'},
            {label: 'Third', content: 'Content 3'},
          ]}
        />
        <p>Selected: {selected.value}</p>
      </div>
      <main data-scenario-ready>ready</main>
    </>
  );
});
