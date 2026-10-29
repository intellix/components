import {component$, useSignal} from '@builder.io/qwik';
import {MatFormField, MatLabel, useMatFormControl} from '@angular-community/qwik-material/form-field';
import {MatAutocomplete} from '@angular-community/qwik-material/autocomplete';

// Mirrors src/dev-app/qwik-parity/autocomplete.ts's AutocompleteBasicFilter.
// Deliberately the same 4-item fruit list select.ts's `fill-basic` uses —
// see that file's own header comment.
const FRUITS = ['Apple', 'Banana', 'Cherry', 'Date'];

function filterFruits(val: string): string[] {
  const filterValue = (val || '').toLowerCase();
  return FRUITS.filter(fruit => fruit.toLowerCase().includes(filterValue));
}

// `[(ngModel)]` makes Angular apply `NgControlStatus`'s `ng-pristine`/
// `ng-untouched`/`ng-valid` classes to BOTH the `<mat-form-field>` host and
// the `<input>` itself — CONFIRMED LIVE, every scenario in this directory
// needs this. `useMatFormControl()`'s `touched`/`dirty` back both the
// nested (`<MatAutocomplete formBound touched dirty .../>`, read once for
// the SSR-correct snapshot) and top-level (`<MatFormField touched dirty
// .../>`, the live copy) halves of the contract — see
// `core/mat-form-field-control.ts`'s doc comment and
// `mat-form-field/error-state`'s own route for the established convention
// this mirrors. `dirty` is marked from `onValueChange$` (mirrors Angular's
// `_onChange` driving ngModel's own dirty tracking — fires on every
// keystroke here, since this scenario has no `requireSelection`); `touched`
// is marked from `onTouched$` (mirrors `_onTouched()`, fired unconditionally
// on blur).
export default component$(() => {
  const fc = useMatFormControl();
  const value = useSignal('');
  const filteredFruits = useSignal<string[]>(FRUITS.slice());

  return (
    <>
      <div data-parity-root>
        <MatFormField
          style="width: 300px"
          label={<MatLabel>Fruit</MatLabel>}
          touched={fc.touched}
          dirty={fc.dirty}
          invalid={false}
          control={
            <MatAutocomplete
              formBound
              touched={fc.touched}
              dirty={fc.dirty}
              invalid={false}
              value={value.value}
              onValueChange$={v => {
                fc.markAsDirty$();
                value.value = v as string;
              }}
              onTouched$={fc.markAsTouched$}
              options={filteredFruits.value.map(fruit => ({value: fruit, label: fruit}))}
              onInput$={(_, el) => (filteredFruits.value = filterFruits(el.value))}
              onFocus$={(_, el) => (filteredFruits.value = filterFruits(el.value))}
            />
          }
        />
        <p>Value: {value.value}</p>
      </div>
      <main data-scenario-ready>ready</main>
    </>
  );
});
