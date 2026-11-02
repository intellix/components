import {component$, useSignal, useStyles$} from '@qwik.dev/core';
import {MatRadioGroup, MatRadioButton} from '@angular-community/qwik-material/radio';
import styles from './example.css?inline';

// Port of src/components-examples/material/radio/radio-overview
// (radio-overview-example.html/.ts/.css) — material.angular.dev's "Basic
// radios" example. Upstream's group has no [value]/(change) binding at all
// (fully self-managed); ported here as a controlled signal, matching every
// other /mat-radio/* route's convention — the initial (nothing-selected)
// DOM is identical either way.

export default component$(() => {
  useStyles$(styles);
  const option = useSignal<string | undefined>(undefined);

  return (
    <radio-overview-example>
      <MatRadioGroup
        aria-label="Select an option"
        value={option.value}
        onChange$={(v: unknown) => {
          option.value = v as string | undefined;
        }}
      >
        <MatRadioButton value="1">Option 1</MatRadioButton>
        <MatRadioButton value="2">Option 2</MatRadioButton>
      </MatRadioGroup>
    </radio-overview-example>
  );
});
