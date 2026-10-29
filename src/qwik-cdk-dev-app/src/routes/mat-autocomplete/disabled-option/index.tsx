import {component$, useSignal} from '@builder.io/qwik';
import {MatFormField, MatLabel, useMatFormControl} from '@angular-community/qwik-material/form-field';
import {MatAutocomplete} from '@angular-community/qwik-material/autocomplete';

// Mirrors src/dev-app/qwik-parity/autocomplete.ts's
// AutocompleteDisabledOption. Static list, no filtering at all — isolates
// just the disabled-option mechanics (same "isolate one concern" approach
// as checkbox.ts's dedicated scenarios). Even with no explicit
// `(ngModelChange)`/`(focus)` handler, Angular's bare `[(ngModel)]` still
// applies `NgControlStatus` classes — see basic-filter's own comment for
// why `formBound`/`touched`/`dirty` are wired through
// `useMatFormControl()` regardless.
export default component$(() => {
  const fc = useMatFormControl();
  const value = useSignal('');

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
              options={[
                {value: 'Apple', label: 'Apple'},
                {value: 'Banana', label: 'Banana', disabled: true},
                {value: 'Cherry', label: 'Cherry'},
                {value: 'Date', label: 'Date'},
              ]}
            />
          }
        />
        <p>Value: {value.value}</p>
      </div>
      <main data-scenario-ready>ready</main>
    </>
  );
});
