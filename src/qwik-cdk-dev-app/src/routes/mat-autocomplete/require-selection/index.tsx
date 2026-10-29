import {component$, useSignal} from '@builder.io/qwik';
import {
  MatFormField,
  MatLabel,
  useMatFormControl,
} from '@angular-community/qwik-material/form-field';
import {
  MatAutocomplete,
  type MatAutocompleteOptionDef,
} from '@angular-community/qwik-material/autocomplete';

// Mirrors src/dev-app/qwik-parity/autocomplete.ts's
// AutocompleteRequireSelection. Upstream's Angular mirror reads the raw
// native `(input)` event (rather than `(ngModelChange)`) specifically
// because `requireSelection` skips the CVA's `_onChange` while typing — see
// that file's CRITICAL GOTCHA note. This port's `<MatAutocomplete>` already
// reproduces that same gate INTERNALLY (`onValueChange$` is suppressed
// while `requireSelection` is set, regardless of how filtering is wired),
// so this route uses the SAME `onInput$`/`onFocus$` filtering convention as
// every other scenario here — no special-casing needed. The SAME
// suppression also means `fc.markAsDirty$()` (wired from `onValueChange$`,
// same as every other scenario — see basic-filter's own comment) only
// fires on a REAL commit (selection, or the requireSelection reset-to-null
// on an invalid close) here, never on a bare keystroke — matching Angular's
// own `NgControlStatus` dirty tracking exactly (it tracks `_onChange`
// calls, which are equally suppressed upstream).
const OPTIONS = ['One', 'Two', 'Three', 'Four', 'Five'];

function filterOptions(val: string): MatAutocompleteOptionDef[] {
  const filterValue = (val || '').toLowerCase();
  return OPTIONS.filter(option => option.toLowerCase().includes(filterValue)).map(option => ({
    value: option,
    label: option,
  }));
}

export default component$(() => {
  const fc = useMatFormControl();
  const value = useSignal('');
  const filteredOptions = useSignal<MatAutocompleteOptionDef[]>(filterOptions(''));

  return (
    <>
      <div data-parity-root>
        <MatFormField
          style="width: 300px"
          label={<MatLabel>Number</MatLabel>}
          touched={fc.touched}
          dirty={fc.dirty}
          invalid={false}
          control={
            <MatAutocomplete
              requireSelection
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
              options={filteredOptions}
              onInput$={(_, el) => (filteredOptions.value = filterOptions(el.value))}
              onFocus$={(_, el) => (filteredOptions.value = filterOptions(el.value))}
            />
          }
        />
        <p>Value: {value.value}</p>
      </div>
      <main data-scenario-ready>ready</main>
    </>
  );
});
