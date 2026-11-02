import {$, component$, useSignal, useStyles$, useTask$, type Signal} from '@qwik.dev/core';
import {MatFormField, MatLabel} from '@angular-community/qwik-material/form-field';
import {MatChipGrid, type MatChipRowDef} from '@angular-community/qwik-material/chips';
import {MatIcon} from '@angular-community/qwik-material/icon';
import styles from './example.css?inline';

const INITIAL_FRUITS: readonly string[] = ['Lemon'];

function rowsForFruits(fruits: readonly string[], fruitsSignal: Signal<readonly string[]>): MatChipRowDef[] {
  return fruits.map(fruit => ({
    key: fruit,
    content: fruit,
    removeButton: {content: <MatIcon>cancel</MatIcon>, 'aria-label': `remove ${fruit}`},
    onRemoved$: $(() => {
      fruitsSignal.value = fruitsSignal.value.filter(f => f !== fruit);
    }),
    dynamicallyAdded: !INITIAL_FRUITS.includes(fruit),
  }));
}

/**
 * Port of material.angular.dev's `chips-autocomplete` docs example
 * (src/components-examples/material/chips/chips-autocomplete/).
 *
 * UNPORTED FEATURE (large, not a small fixable bug): upstream stacks `matChipInputFor` AND
 * `matAutocomplete` on the SAME native `<input>` — but this port's `<MatChipGrid>` renders its
 * OWN `<input>` internally from the `input` data prop (see mat-chip-grid.tsx's own doc comment,
 * "Why the grid owns its input directly"); there is no ref/hook escape hatch exposed to attach a
 * SECOND behavior (an autocomplete trigger) to that specific element from the outside, the way
 * `useMatTooltip()`'s `hostProps` composes onto an already-existing host elsewhere in this port.
 * `qwik-material/autocomplete`'s `<MatAutocomplete>` is a standalone component with its own
 * host/trigger, not a composable directive hook. The free-form typing + suggestion panel is
 * therefore not reproduced at all here — only the chip-grid-with-manual-entry part (identical
 * mechanism to `chips-input`, minus the inline-editing gap that example documents) is ported.
 * Tracked as an expected, large parity-suite failure, not something to silently paper over.
 */
export default component$(() => {
  useStyles$(styles);
  const fruits = useSignal<readonly string[]>(INITIAL_FRUITS);

  const rowsSignal = useSignal<MatChipRowDef[]>([]);
  useTask$(({track}) => {
    const current = track(() => fruits.value);
    rowsSignal.value = rowsForFruits(current, fruits);
  });

  return (
    <chips-autocomplete-example>
      <form>
        <MatFormField
          class="example-chip-list"
          label={<MatLabel>Favorite Fruits</MatLabel>}
          control={
            <MatChipGrid
              controlType="mat-chip-grid"
              value={fruits.value.length ? fruits.value : undefined}
              aria-label="Fruit selection"
              rows={rowsSignal}
              input={{
                placeholder: 'New Fruit...',
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
      </form>
    </chips-autocomplete-example>
  );
});
