import {component$} from '@qwik.dev/core';
import {
  MatError,
  MatFormField,
  MatLabel,
  matControlHasValidator,
  matRequiredValidator,
  matValidationErrors,
  useMatFormControl,
} from '@angular-community/qwik-material/form-field';
import {MatSelect} from '@angular-community/qwik-material/select';

// Mirrors src/dev-app/qwik-parity/select.ts's SelectRequiredErrorState —
// `control = new FormControl('', Validators.required)`. See
// form-field/error-state's own route for the established
// `useMatFormControl()` wiring pattern this mirrors; `touched`/`dirty`/
// `invalid` are passed TWICE (nested inside `<MatSelect>` AND as top-level
// `<MatFormField>` props) for the same reason documented there — see
// form-field/SYNC.md's "why touched/dirty/invalid are top-level
// MatFormField props too".
export default component$(() => {
  const validators = [matRequiredValidator];
  const control = useMatFormControl({value: ''});
  const errors = matValidationErrors(control.value, validators);

  return (
    <>
      <div data-parity-root>
        <MatFormField
          style="width: 300px"
          label={<MatLabel>Fruit</MatLabel>}
          touched={control.touched}
          dirty={control.dirty}
          invalid={errors !== null}
          control={
            <MatSelect
              controlType="mat-select"
              value={control.value}
              onValueChange$={v => control.setValue$(v as string)}
              onTouched$={() => control.markAsTouched$()}
              required={matControlHasValidator(validators, matRequiredValidator)}
              formBound
              touched={control.touched}
              dirty={control.dirty}
              invalid={errors !== null}
              options={[
                {value: 'apple', label: 'Apple'},
                {value: 'banana', label: 'Banana'},
                {value: 'cherry', label: 'Cherry'},
              ]}
            />
          }
          errors={errors?.required ? <MatError>You must make a selection</MatError> : undefined}
        />
      </div>
      <main data-scenario-ready>ready</main>
    </>
  );
});
