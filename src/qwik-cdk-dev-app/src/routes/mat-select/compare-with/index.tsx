import {$, component$, useSignal} from '@qwik.dev/core';
import {MatFormField, MatLabel} from '@angular-community/qwik-material/form-field';
import {MatSelect} from '@angular-community/qwik-material/select';

/**
 * Bespoke scenario (no matching upstream docs example — `compareWith` only appears in
 * upstream's unit tests, `select.spec.ts`, never a `components-examples` route) exercising
 * `compareWith` with object-valued options, in both single- and `multiple`-select mode. See
 * `qwik-material/select/SYNC.md`'s dedicated section.
 *
 * Each option's `value` is a FRESH object literal on every render (never the same reference
 * across reloads/renders) — this is deliberate: it proves `compareWith` (a `key`-based
 * comparison), not reference equality, is what makes the initial selection and later toggles
 * work. The initial `value`/`values` are ALSO fresh objects with matching `id`s, never the
 * same object reference as the corresponding option.
 */
interface Food {
  id: number;
  name: string;
}

const FOODS: Food[] = [
  {id: 1, name: 'Steak'},
  {id: 2, name: 'Pizza'},
  {id: 3, name: 'Tacos'},
];

const byId = $((o1: Food | undefined, o2: Food | undefined) => o1?.id === o2?.id);

export default component$(() => {
  const single = useSignal<Food>({id: 2, name: 'Pizza'});
  const multi = useSignal<Food[]>([{id: 1, name: 'Steak'}, {id: 3, name: 'Tacos'}]);

  return (
    <>
      <div data-parity-root>
        <div data-testid="single">
          <MatFormField
            style="width: 300px"
            label={<MatLabel>Food (single)</MatLabel>}
            control={
              <MatSelect
                controlType="mat-select"
                value={single.value}
                onValueChange$={v => (single.value = v as Food)}
                compareWith$={byId}
                options={FOODS.map(f => ({value: {id: f.id, name: f.name}, label: f.name}))}
              />
            }
          />
          <p data-testid="single-value">Value: {single.value?.name}</p>
        </div>
        <div data-testid="multi">
          <MatFormField
            style="width: 300px"
            label={<MatLabel>Food (multi)</MatLabel>}
            control={
              <MatSelect
                controlType="mat-select"
                multiple
                value={multi.value}
                onValueChange$={v => (multi.value = v as Food[])}
                compareWith$={byId}
                options={FOODS.map(f => ({value: {id: f.id, name: f.name}, label: f.name}))}
              />
            }
          />
          <p data-testid="multi-value">Value: {multi.value.map(f => f.name).join(', ')}</p>
        </div>
      </div>
      <main data-scenario-ready>ready</main>
    </>
  );
});
