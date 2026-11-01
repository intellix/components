import {$, component$, useSignal} from '@qwik.dev/core';
import {MatSlider} from '@angular-community/qwik-material/slider';

// Mirrors src/dev-app/qwik-parity/slider.ts's SliderTickMarks.
export default component$(() => {
  const value = useSignal(40);
  const onValueChange$ = $((v: number) => {
    value.value = v;
  });
  return (
    <>
      <div data-parity-root>
        <MatSlider
          style="width: 300px"
          showTickMarks
          min={0}
          max={100}
          step={20}
          value={value.value}
          onValueChange$={onValueChange$}
        />
        <p>Value: {value.value}</p>
      </div>
      <main data-scenario-ready>ready</main>
    </>
  );
});
