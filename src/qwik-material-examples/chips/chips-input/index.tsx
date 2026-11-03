import {$, component$, useSignal, useStyles$, useTask$, type Signal} from '@qwik.dev/core';
import {useIdGenerator} from '@angular-community/qwik-cdk/a11y';
import {MatFormField, MatLabel} from '@angular-community/qwik-material/form-field';
import {MatChipGrid, type MatChipRowDef} from '@angular-community/qwik-material/chips';
import {MatIcon} from '@angular-community/qwik-material/icon';
import styles from './example.css?inline';

export interface Fruit {
  name: string;
}

const INITIAL_FRUITS: readonly Fruit[] = [{name: 'Lemon'}, {name: 'Lime'}, {name: 'Apple'}];

function rowsForFruits(fruits: readonly Fruit[], fruitsSignal: Signal<readonly Fruit[]>): MatChipRowDef[] {
  return fruits.map(fruit => ({
    key: fruit.name,
    content: fruit.name,
    editable: true,
    'aria-description': `press enter to edit ${fruit.name}`,
    editIcon: {
      content: <MatIcon>edit</MatIcon>,
      'aria-label': `edit ${fruit.name}`,
    },
    // Mirrors upstream's `edit()`: an edit that empties the chip removes it instead;
    // otherwise replaces this fruit's name with the (untrimmed-by-this-port, trimmed-here-
    // same-as-upstream) edited value.
    onEdited$: $((value: string) => {
      const trimmed = value.trim();
      if (!trimmed) {
        fruitsSignal.value = fruitsSignal.value.filter(f => f !== fruit);
        return;
      }
      fruitsSignal.value = fruitsSignal.value.map(f => (f === fruit ? {name: trimmed} : f));
    }),
    removeButton: {
      content: <MatIcon>cancel</MatIcon>,
      'aria-label': `remove ${fruit.name}`,
    },
    onRemoved$: $(() => {
      fruitsSignal.value = fruitsSignal.value.filter(f => f !== fruit);
    }),
    dynamicallyAdded: !INITIAL_FRUITS.includes(fruit),
  }));
}

/**
 * Port of material.angular.dev's `chips-input` docs example
 * (src/components-examples/material/chips/chips-input/). Follows the same
 * `rowsSignal`/`useTask$` reassignment convention as
 * `src/qwik-cdk-dev-app/src/routes/mat-chips/grid-input/index.tsx` (see that route's own header
 * comment for why `rows` must be a `Signal` here, not a plain array, when `<MatChipGrid>` is
 * nested inside `<MatFormField>`).
 *
 * `editable`/`matChipEdit` inline editing (the "press enter to edit" pencil-icon button on each
 * chip) and `matChipInputAddOnBlur` are both now ported — see `MatChipRowProps`/`MatChipRowDef`'s
 * `editable`/`editIcon`/`onEdited$` fields and `MatChipGridInputDef.addOnBlur`
 * (`qwik-material/chips/mat-chip-row.tsx`/`mat-chip-grid.tsx`).
 */
export default component$(() => {
  useStyles$(styles);
  const fruits = useSignal<readonly Fruit[]>(INITIAL_FRUITS);
  const idGen = useIdGenerator();
  const inputId = useSignal(() => idGen.getId('mat-mdc-chip-list-input-'));

  const rowsSignal = useSignal<MatChipRowDef[]>([]);
  useTask$(({track}) => {
    const current = track(() => fruits.value);
    rowsSignal.value = rowsForFruits(current, fruits);
  });

  return (
    <chips-input-example>
      <MatFormField
        class="example-chip-list"
        label={<MatLabel>Favorite Fruits</MatLabel>}
        control={
          <MatChipGrid
            id={inputId.value}
            controlType="mat-chip-grid"
            value={fruits.value.length ? fruits.value : undefined}
            aria-label="Enter fruits"
            rows={rowsSignal}
            input={{
              placeholder: 'New fruit...',
              separatorKeys: ['Enter', ','],
              addOnBlur: true,
              onTokenEnd$: $((value: string, clear) => {
                const trimmed = value.trim();
                if (trimmed) {
                  fruits.value = [...fruits.value, {name: trimmed}];
                }
                clear();
              }),
            }}
          />
        }
      />
    </chips-input-example>
  );
});
