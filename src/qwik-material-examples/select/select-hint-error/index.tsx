import {component$, useSignal} from '@qwik.dev/core';
import {MatError, MatFormField, MatHint, MatLabel} from '@angular-community/qwik-material/form-field';
import {MatSelect} from '@angular-community/qwik-material/select';
import {NativeSelectControl} from '../_lib/native-select-control';

interface Animal {
  name: string;
  sound: string;
}

const ANIMALS: Animal[] = [
  {name: 'Dog', sound: 'Woof!'},
  {name: 'Cat', sound: 'Meow!'},
  {name: 'Cow', sound: 'Moo!'},
  {name: 'Fox', sound: 'Wa-pa-pa-pa-pa-pa-pow!'},
];

/**
 * Port of material.angular.dev's `select-hint-error` docs example
 * (src/components-examples/material/select/select-hint-error/) — a required `<mat-select
 * [formControl]="animalControl">` and a required native `<select matNativeControl
 * [formControl]="selectFormControl">`, each with a hint and a conditional error. Confirmed live
 * (http://localhost:4201/qwik-parity/examples/select-hint-error) that NEITHER `<mat-error>`
 * renders on first paint, despite both controls starting `invalid` (required + empty) —
 * `MatFormField`'s error section only appears once `errorState` (`invalid && (touched ||
 * submitted)`) is true, which matches this port's OWN `errors`-gating (see
 * `mat-form-field.tsx`'s `showErrors`), so `errors` is passed unconditionally here, same as
 * `select/required-error-state`'s established pattern — never actually shown until touched.
 *
 * The native card's first `<option label="--select something --">` has no `value` (so is
 * genuinely "empty") but a non-empty `label` ATTRIBUTE — upstream's native-select
 * `shouldLabelFloat` floats whenever `firstOption.label` is non-empty, REGARDLESS of value
 * emptiness (`src/material/input/input.ts`'s `shouldLabelFloat` getter — confirmed by reading
 * that getter directly, and by this example's own live DOM: the label floats from first paint).
 * `NativeSelectControl`'s `value` prop only feeds `MatFormField`'s `empty = !value` formula (it
 * is never rendered as a real `value` attribute — see that file's doc comment), so passing the
 * option's own label text as a non-empty sentinel reproduces the right `shouldLabelFloat` without
 * needing that native-select-specific carve-out ported into the library.
 */
export default component$(() => {
  const animal = useSignal<Animal | null>(null);
  const animalTouched = useSignal(false);
  const animalInvalid = animal.value == null;

  const car = useSignal('');
  const carTouched = useSignal(false);
  const carInvalid = car.value === '';

  return (
    <select-hint-error-example>
      <h4>mat select</h4>
      <MatFormField
        label={<MatLabel>Favorite animal</MatLabel>}
        touched={animalTouched.value}
        dirty={false}
        invalid={animalInvalid}
        control={
          <MatSelect
            controlType="mat-select"
            required
            formBound
            touched={animalTouched.value}
            dirty={false}
            invalid={animalInvalid}
            value={animal.value ?? undefined}
            onValueChange$={v => (animal.value = (v as Animal | undefined) ?? null)}
            onTouched$={() => (animalTouched.value = true)}
            options={[
              {value: undefined, label: '--'},
              ...ANIMALS.map(a => ({value: a, label: a.name})),
            ]}
          />
        }
        errors={animalInvalid ? <MatError>Please choose an animal</MatError> : undefined}
        hintStart={<MatHint>{animal.value?.sound}</MatHint>}
      />

      <h4>native html select</h4>
      <MatFormField
        label={<MatLabel>Select your car (required)</MatLabel>}
        touched={carTouched.value}
        dirty={false}
        invalid={carInvalid}
        control={
          <NativeSelectControl
            controlType="mat-native-select"
            required
            formBound
            touched={carTouched.value}
            dirty={false}
            invalid={carInvalid}
            value="--select something --"
            empty={car.value === ''}
            onChange$={(_, el) => (car.value = el.value)}
          >
            <option label="--select something --"></option>
            <option value="saab">Saab</option>
            <option value="mercedes">Mercedes</option>
            <option value="audi">Audi</option>
          </NativeSelectControl>
        }
        errors={carInvalid ? <MatError>This field is required</MatError> : undefined}
        hintStart={<MatHint>You can pick up your favorite car here</MatHint>}
      />
    </select-hint-error-example>
  );
});
