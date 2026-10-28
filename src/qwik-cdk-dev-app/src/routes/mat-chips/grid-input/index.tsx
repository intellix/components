import {$, component$, useSignal} from '@builder.io/qwik';
import {useIdGenerator} from '@angular-community/qwik-cdk/a11y';
import {MatFormField, MatLabel} from '@angular-community/qwik-material/form-field';
import {MatChipGrid} from '@angular-community/qwik-material/chips';

export default component$(() => {
  const fruits = useSignal<readonly string[]>(['Lemon', 'Lime']);
  const idGen = useIdGenerator();
  // Generated once, with the upstream-matching prefix, and handed to <MatChipGrid> as its
  // explicit `id` — see mat-chip-grid.tsx's module doc comment for why the id must be decided
  // up front by the consumer rather than discovered from a nested <input> after the fact.
  const inputId = useSignal(() => idGen.getId('mat-mdc-chip-list-input-'));

  return (
    <>
      <div data-parity-root>
        <MatFormField
          appearance="outline"
          style="width: 300px"
          label={<MatLabel>Fruits</MatLabel>}
          control={
            <MatChipGrid
              id={inputId.value}
              controlType="mat-chip-grid"
              value={fruits.value.length ? fruits.value : undefined}
              aria-label="Enter fruits"
              rows={fruits.value.map(fruit => ({
                key: fruit,
                content: fruit,
                removeButton: {content: '×', 'aria-label': `Remove ${fruit}`},
                onRemoved$: $(() => {
                  fruits.value = fruits.value.filter(f => f !== fruit);
                }),
              }))}
              input={{
                placeholder: 'New fruit...',
                onTokenEnd$: $((value: string, clear) => {
                  const trimmed = value.trim();
                  if (trimmed) {
                    fruits.value = [...fruits.value, trimmed];
                  }
                  clear();
                }),
              }}
            />
          }
        />
        <p>Chips: {fruits.value.join(', ') || '(none)'}</p>
      </div>
      <main data-scenario-ready>ready</main>
    </>
  );
});
