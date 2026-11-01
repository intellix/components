import {$, component$, useSignal} from '@qwik.dev/core';
import {MatSlider} from '@angular-community/qwik-material/slider';

// Mirrors src/dev-app/qwik-parity/slider.ts's SliderMinMaxStep.
export default component$(() => {
  const value = useSignal(25);
  const onValueChange$ = $((v: number) => {
    value.value = v;
  });
  return (
    <>
      <div data-parity-root>
        <MatSlider
          style="width: 300px"
          min={10}
          max={50}
          step={5}
          value={value.value}
          onValueChange$={onValueChange$}
        />
        <p>Value: {value.value}</p>
      </div>
      <main data-scenario-ready>ready</main>
    </>
  );
});
