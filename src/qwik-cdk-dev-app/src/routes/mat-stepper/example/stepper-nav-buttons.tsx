import {component$, Slot} from '@qwik.dev/core';
import {MatButton} from '@angular-community/qwik-material/button';
import {useMatStepperNext, useMatStepperPrevious} from '@angular-community/qwik-material/stepper';

/**
 * The real `stepper-overview` template stacks TWO directives on one native
 * `<button>`: bare `matButton` (no appearance value) and `matStepperNext`/
 * `matStepperPrevious`. `useMatStepperNext()`/`useMatStepperPrevious()`
 * return exactly what the stepper directive contributes
 * (`qwik-material/README.md`'s "Composing directives"); spreading that
 * onto `<MatButton>` is how a real migrating consumer would reproduce the
 * same two-directives-on-one-element template.
 *
 * Each hook call must happen in a component instance that ends up rendered
 * INSIDE the owning `<MatStepper>`'s active step `content` (context
 * resolves by the actual render tree, not by where a `content` JSXOutput
 * literal was lexically built — see `use-stepper-buttons.ts`'s doc
 * comment) — hence these are their OWN small components, not a plain
 * function called directly in the route body.
 */
export const StepperNextButton = component$(() => {
  const next = useMatStepperNext();
  return (
    <MatButton {...next.hostProps}>
      <Slot />
    </MatButton>
  );
});

export const StepperPreviousButton = component$(() => {
  const previous = useMatStepperPrevious();
  return (
    <MatButton {...previous.hostProps}>
      <Slot />
    </MatButton>
  );
});
