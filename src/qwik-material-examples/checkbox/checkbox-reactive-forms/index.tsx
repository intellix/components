import {component$, useSignal, useStyles$} from '@qwik.dev/core';
import {MatCheckbox} from '@angular-community/qwik-material/checkbox';
import styles from './example.css?inline';

/**
 * Port of `src/components-examples/material/checkbox/checkbox-reactive-forms`
 * (checkbox-reactive-forms-example.html/.ts/.css) — material.angular.dev's "Checkboxes with
 * reactive forms" example. Upstream builds a `FormGroup({pepperoni: false, extracheese: false,
 * mushroom: false})` via `FormBuilder` and binds each `<mat-checkbox formControlName="...">`;
 * this port has no Angular Forms, so each topping is a plain `{value, touched, dirty}` signal
 * triple wired through `MatCheckbox`'s `formBound`/`touched`/`dirty`/`invalid`/`onTouched$`
 * contract (see `qwik-material/checkbox/SYNC.md`'s "Form state" section) — `invalid` is always
 * `false` (no validators anywhere in this example, same as upstream's unvalidated boolean
 * controls). `onChange$` marks `dirty` the same way Angular's reactive forms automatically does
 * the instant a bound control's value changes via the UI; `onTouched$` (fired on the native
 * checkbox input's blur) marks `touched`, matching upstream's `_onBlur()` timing exactly.
 *
 * `{{toppings.value | json}}` becomes `JSON.stringify(toppings, null, 2)` — Angular's `JsonPipe`
 * itself calls `JSON.stringify(value, null, 2)` internally, so the rendered text matches exactly
 * (same convention `datepicker/date-range-picker-forms`'s own port already establishes).
 */
interface ToppingField {
  value: boolean;
  touched: boolean;
  dirty: boolean;
}

function useToppingField() {
  const field = useSignal<ToppingField>({value: false, touched: false, dirty: false});
  return field;
}

export default component$(() => {
  useStyles$(styles);
  const pepperoni = useToppingField();
  const extracheese = useToppingField();
  const mushroom = useToppingField();

  const toppings = {
    pepperoni: pepperoni.value.value,
    extracheese: extracheese.value.value,
    mushroom: mushroom.value.value,
  };

  return (
    <checkbox-reactive-forms-example>
      <section class="example-section">
        <h4>Select your toppings:</h4>
        <p>
          <MatCheckbox
            checked={pepperoni.value.value}
            formBound
            touched={pepperoni.value.touched}
            dirty={pepperoni.value.dirty}
            invalid={false}
            onChange$={event => {
              pepperoni.value = {...pepperoni.value, dirty: true, value: event.checked};
            }}
            onTouched$={() => {
              pepperoni.value = {...pepperoni.value, touched: true};
            }}
          >
            Pepperoni
          </MatCheckbox>
        </p>
        <p>
          <MatCheckbox
            checked={extracheese.value.value}
            formBound
            touched={extracheese.value.touched}
            dirty={extracheese.value.dirty}
            invalid={false}
            onChange$={event => {
              extracheese.value = {...extracheese.value, dirty: true, value: event.checked};
            }}
            onTouched$={() => {
              extracheese.value = {...extracheese.value, touched: true};
            }}
          >
            Extra Cheese
          </MatCheckbox>
        </p>
        <p>
          <MatCheckbox
            checked={mushroom.value.value}
            formBound
            touched={mushroom.value.touched}
            dirty={mushroom.value.dirty}
            invalid={false}
            onChange$={event => {
              mushroom.value = {...mushroom.value, dirty: true, value: event.checked};
            }}
            onTouched$={() => {
              mushroom.value = {...mushroom.value, touched: true};
            }}
          >
            Mushroom
          </MatCheckbox>
        </p>
      </section>

      <section class="example-section">
        <h4>You chose:</h4>
        {JSON.stringify(toppings, null, 2)}
      </section>
    </checkbox-reactive-forms-example>
  );
});
