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
    key: fruit,
    content: fruit.name,
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
 * UNPORTED FEATURE (not a small fixable bug): upstream's `editable`/`matChipEdit` inline-editing
 * (the "press enter to edit" pencil-icon button on each chip) has no equivalent at all —
 * `MatChipRowProps`/`MatChipRowDef` have no `editable`/`onEdited$` fields (see
 * qwik-material/chips/mat-chip-row.tsx's own doc comment). The edit button and
 * `aria-description` are omitted; tracked as an expected parity-suite failure
 * (`specs/examples-misc/angular-parity.spec.ts`), not something to silently paper over.
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
