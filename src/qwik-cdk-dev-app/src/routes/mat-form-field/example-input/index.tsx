import {component$, useSignal, useStyles$} from '@qwik.dev/core';
import {MatFormField, MatLabel} from '@angular-community/qwik-material/form-field';
import {MatInput} from '@angular-community/qwik-material/input';
import styles from './input-overview-example.css?inline';

/**
 * Port of material.angular.dev's `input-overview` docs example
 * (src/components-examples/material/input/input-overview/). Two static fields inside a bare
 * `<form>` — Angular's `FormsModule`/`ReactiveFormsModule` attach `NgForm` to any `<form>` not
 * opted out (`form:not([ngNoForm]):not([formGroup])`), which is what adds the `novalidate`
 * attribute and the `ng-untouched ng-pristine ng-valid` classes seen live (confirmed via
 * http://localhost:4200/qwik-parity/mat-form-field/example-input) — hardcoded here since this
 * example never submits the form or exercises validation.
 */
export default component$(() => {
  useStyles$(styles);
  const comment = useSignal('');

  return (
    <>
      <div data-parity-root>
        <input-overview-example>
          <form class="example-form ng-untouched ng-pristine ng-valid" noValidate>
            <MatFormField
              class="example-full-width"
              label={<MatLabel>Favorite food</MatLabel>}
              control={<MatInput placeholder="Ex. Pizza" value="Sushi" />}
            />
            <MatFormField
              class="example-full-width"
              label={<MatLabel>Leave a comment</MatLabel>}
              control={
                <MatInput
                  as="textarea"
                  placeholder="Ex. It makes me feel..."
                  onInput$={(_, el) => {
                    comment.value = el.value;
                  }}
                />
              }
            />
          </form>
        </input-overview-example>
      </div>
      <main data-scenario-ready>ready</main>
    </>
  );
});
