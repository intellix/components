import {component$, useSignal} from '@qwik.dev/core';
import {
  MatFormField,
  MatLabel,
  useMatFormControl,
} from '@angular-community/qwik-material/form-field';
import {
  MatAutocomplete,
  type MatAutocompleteOptionDef,
} from '@angular-community/qwik-material/autocomplete';

// Mirrors src/dev-app/qwik-parity/autocomplete.ts's AutocompleteBasicFilter.
// Deliberately the same 4-item fruit list select.ts's `fill-basic` uses —
// see that file's own header comment.
const FRUITS = ['Apple', 'Banana', 'Cherry', 'Date'];

// Returns resolved option DEFS directly (not a bare string[]) — `options`
// MUST be passed as the live `Signal` itself (`options={filteredFruits}`),
// never `.value` — see `MatAutocompleteProps.options`'s own doc comment for
// why: `<MatFormField control={...}>` reads `control` exactly once, so a
// plain array value nested inside it would never update again.
function filterFruits(val: string): MatAutocompleteOptionDef[] {
  const filterValue = (val || '').toLowerCase();
  return FRUITS.filter(fruit => fruit.toLowerCase().includes(filterValue)).map(fruit => ({
    value: fruit,
    label: fruit,
  }));
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
//
// `onValueChange$` ALSO refilters (`filteredFruits.value = filterFruits(v)`)
// — mirrors the Angular scenario's `(ngModelChange)="filteredFruits =
// filterFruits($event)"` binding, which fires on EVERY invocation of the
// CVA's `_onChange` — not just raw typing, but ALSO the selection-commit
// path (`_setValueAndClose`'s own `_onChange(toSelect.value)`). CONFIRMED
// LIVE: selecting "Banana" via Enter immediately narrows `filteredFruits`
// to `['Banana']`, BEFORE the panel even closes — this is what makes the
// REOPEN step correctly show just the one (selected) option, not the
// stale "a"-filtered three-item list from the last keystroke. Wiring this
// through `onInput$` alone (as `require-selection` does, deliberately —
// see that route's own comment) would miss this.
export default component$(() => {
  const fc = useMatFormControl();
  const value = useSignal('');
  const filteredFruits = useSignal<MatAutocompleteOptionDef[]>(filterFruits(''));

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
                filteredFruits.value = filterFruits(v as string);
              }}
              onTouched$={fc.markAsTouched$}
              options={filteredFruits}
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
