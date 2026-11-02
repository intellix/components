import {component$, useSignal} from '@qwik.dev/core';
import {MatSlideToggle} from '@angular-community/qwik-material/slide-toggle';

// Port of src/components-examples/material/slide-toggle/slide-toggle-overview
// (slide-toggle-overview-example.html/.ts) — material.angular.dev's "Basic
// slide-toggles" example. No CSS file upstream. Upstream has no [checked]
// binding on either toggle (fully self-managed); ported as controlled
// signals, matching every other /mat-slide-toggle/* route's convention —
// the initial (both unchecked) DOM is identical either way.

export default component$(() => {
  const checked1 = useSignal(false);
  const checked2 = useSignal(false);

  return (
    <slide-toggle-overview-example>
      <p>
        <MatSlideToggle checked={checked1.value} onChange$={next => (checked1.value = next)}>
          Slide me!
        </MatSlideToggle>
      </p>
      <p>
        <MatSlideToggle
          labelPosition="before"
          checked={checked2.value}
          onChange$={next => (checked2.value = next)}
        >
          ...and slide me too!
        </MatSlideToggle>
      </p>
    </slide-toggle-overview-example>
  );
});
