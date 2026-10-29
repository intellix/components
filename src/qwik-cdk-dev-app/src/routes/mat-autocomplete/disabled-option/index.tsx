import {component$, useSignal} from '@builder.io/qwik';
import {
  MatFormField,
  MatLabel,
  useMatFormControl,
} from '@angular-community/qwik-material/form-field';
import {MatAutocomplete} from '@angular-community/qwik-material/autocomplete';

// Mirrors src/dev-app/qwik-parity/autocomplete.ts's
// AutocompleteDisabledOption. Static list, no filtering at all — isolates
// just the disabled-option mechanics (same "isolate one concern" approach
// as checkbox.ts's dedicated scenarios). Even with no explicit
// `(ngModelChange)`/`(focus)` handler, Angular's bare `[(ngModel)]` still
// applies `NgControlStatus` classes — see basic-filter's own comment for
// why `formBound`/`touched`/`dirty` are wired through
// `useMatFormControl()` regardless.
//
// `echoValueAttr: true` on every option — the ONE scenario in this
// directory whose Angular mirror writes a STATIC, bracket-less
// `<mat-option value="Apple">` (every other scenario here binds
// `[value]="…"`, never reflected as a DOM attribute) — see
// `core/mat-option.tsx`'s `echoValue` doc comment.
export default component$(() => {
  const fc = useMatFormControl();
  const value = useSignal('');
  // Static (never reassigned), but `options` still requires the live
  // `Signal` itself — see `MatAutocompleteProps.options`'s own doc comment.
  const options = useSignal([
    {value: 'Apple', label: 'Apple', echoValueAttr: true},
    {value: 'Banana', label: 'Banana', disabled: true, echoValueAttr: true},
    {value: 'Cherry', label: 'Cherry', echoValueAttr: true},
    {value: 'Date', label: 'Date', echoValueAttr: true},
  ]);

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
              options={options}
            />
          }
        />
        <p>Value: {value.value}</p>
      </div>
      <main data-scenario-ready>ready</main>
    </>
  );
});
