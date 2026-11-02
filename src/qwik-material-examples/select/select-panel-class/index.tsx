import {component$, useSignal, useStyles$} from '@qwik.dev/core';
import {MatFormField, MatLabel} from '@angular-community/qwik-material/form-field';
import {MatSelect} from '@angular-community/qwik-material/select';
import styles from './select-panel-class-example.css?inline';

/**
 * Port of material.angular.dev's `select-panel-class` docs example
 * (src/components-examples/material/select/select-panel-class/) — `panelClass="example-panel-
 * {{panelColor.value}}"` (an interpolated string, re-evaluated whenever `panelColor` changes).
 * `panelColor = new FormControl('red')` (no validators, so always valid) — `formBound` on both
 * `<MatFormField>` and `<MatSelect>` reproduces the resulting `ng-untouched ng-pristine ng-valid`
 * classes.
 */
export default component$(() => {
  useStyles$(styles);
  const panelColor = useSignal('red');

  return (
    <select-panel-class-example>
      <MatFormField
        label={<MatLabel>Panel color</MatLabel>}
        touched={false}
        dirty={false}
        invalid={false}
        control={
          <MatSelect
            controlType="mat-select"
            formBound
            touched={false}
            dirty={false}
            invalid={false}
            value={panelColor.value}
            onValueChange$={v => (panelColor.value = v as string)}
            panelClass={`example-panel-${panelColor.value}`}
            options={[
              {value: 'red', label: 'Red'},
              {value: 'green', label: 'Green'},
              {value: 'blue', label: 'Blue'},
            ]}
          />
        }
      />
    </select-panel-class-example>
  );
});
