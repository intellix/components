import {component$, useSignal} from '@builder.io/qwik';
import {MatTabGroup} from '@angular-community/qwik-material/tabs';

export default component$(() => {
  const selected = useSignal(0);

  return (
    <>
      <div data-parity-root>
        <MatTabGroup
          style="width: 480px"
          dynamicHeight
          selectedIndex={selected.value}
          onSelectedIndexChange$={i => {
            selected.value = i;
          }}
          tabs={[
            {
              label: 'Short',
              content: <p style="margin: 0; height: 40px;">Short content.</p>,
            },
            {
              label: 'Tall',
              content: <p style="margin: 0; height: 200px;">Tall content.</p>,
            },
          ]}
        />
        <p>Selected: {selected.value}</p>
      </div>
      <main data-scenario-ready>ready</main>
    </>
  );
});
