import {$, component$, useSignal} from '@qwik.dev/core';
import {MatChipSet} from '@angular-community/qwik-material/chips';

export default component$(() => {
  const fruits = useSignal<readonly string[]>(['One', 'Two', 'Three']);

  return (
    <>
      <div data-parity-root>
        <MatChipSet
          aria-label="Removable fruit selection"
          chips={fruits.value.map(fruit => ({
            key: fruit,
            content: fruit,
            removeButton: {content: '×', 'aria-label': `Remove ${fruit}`},
            onRemoved$: $(() => {
              fruits.value = fruits.value.filter(f => f !== fruit);
            }),
          }))}
        />
        <p>Chips: {fruits.value.join(', ') || '(none)'}</p>
      </div>
      <main data-scenario-ready>ready</main>
    </>
  );
});
