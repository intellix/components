import {component$, useSignal, useStyles$} from '@qwik.dev/core';
import {MatFormField, MatHint, MatLabel} from '@angular-community/qwik-material/form-field';
import {MatInput} from '@angular-community/qwik-material/input';
import {MatSelect} from '@angular-community/qwik-material/select';
import styles from './form-field-hint-example.css?inline';

/**
 * Port of material.angular.dev's `form-field-hint` docs example
 * (src/components-examples/material/form-field/form-field-hint/) — the first field combines
 * `hintLabel` (a start hint `MatFormField` manufactures itself) with an explicit `hintEnd`
 * character counter; the second shows a bare end hint next to a `<mat-select>`. Every hint
 * passed via `hintEnd` needs `align="end"` set EXPLICITLY on the `<MatHint>` itself too (see
 * `mat-hint.tsx`'s own doc comment) — the prop slot alone doesn't add the
 * `mat-mdc-form-field-hint-end` class.
 */
export default component$(() => {
  useStyles$(styles);
  const value = useSignal('');

  return (
    <form-field-hint-example>
      <div class="example-container">
        <MatFormField
          hintLabel="Max 10 characters"
          label={<MatLabel>Enter some input</MatLabel>}
          control={
            <MatInput
              maxLength={10}
              placeholder="Ex. Nougat"
              onInput$={(_, el) => (value.value = el.value)}
            />
          }
          hintEnd={<MatHint align="end">{`${value.value.length}/10`}</MatHint>}
        />

        <MatFormField
          label={<MatLabel>Select me</MatLabel>}
          control={
            <MatSelect controlType="mat-select" options={[{value: 'option', label: 'Option'}]} />
          }
          hintEnd={<MatHint align="end">Here's the dropdown arrow ^</MatHint>}
        />
      </div>
    </form-field-hint-example>
  );
});
