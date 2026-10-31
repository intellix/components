import {component$, useStyles$} from '@builder.io/qwik';
import {MatFormField, MatLabel} from '@angular-community/qwik-material/form-field';
import {MatInput} from '@angular-community/qwik-material/input';
import {MatSelect} from '@angular-community/qwik-material/select';
import styles from './form-field-overview-example.css?inline';

/**
 * Port of material.angular.dev's `form-field-overview` docs example
 * (src/components-examples/material/form-field/form-field-overview/). Three independent, static
 * fields — input, select, textarea — none interactive beyond typing, so this scenario is compared
 * as rendered (see src/qwik-cdk-parity-tests/specs/examples/angular-parity.spec.ts).
 */
export default component$(() => {
  useStyles$(styles);

  return (
    <>
      <div data-parity-root>
        <form-field-overview-example>
          <MatFormField label={<MatLabel>Input</MatLabel>} control={<MatInput />} />
          <MatFormField
            label={<MatLabel>Select</MatLabel>}
            control={
              <MatSelect
                controlType="mat-select"
                options={[
                  {value: 'one', label: 'First option'},
                  {value: 'two', label: 'Second option'},
                ]}
              />
            }
          />
          <MatFormField
            label={<MatLabel>Textarea</MatLabel>}
            control={<MatInput as="textarea" />}
          />
        </form-field-overview-example>
      </div>
      <main data-scenario-ready>ready</main>
    </>
  );
});
