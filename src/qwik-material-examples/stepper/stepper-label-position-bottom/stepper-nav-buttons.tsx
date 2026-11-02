import {component$, Slot} from '@qwik.dev/core';
import {MatButton} from '@angular-community/qwik-material/button';
import {useMatStepperNext, useMatStepperPrevious} from '@angular-community/qwik-material/stepper';

// Same local helper as stepper/example/stepper-nav-buttons.tsx (duplicated per that file's own
// doc comment).
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
