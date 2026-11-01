import {$, component$, useSignal} from '@qwik.dev/core';
import {MatSlider} from '@angular-community/qwik-material/slider';

// Mirrors src/dev-app/qwik-parity/slider.ts's SliderDisplayWith — same
// formatter as upstream's own `slider-formatting-example`. A QRL, not a
// plain function — MatSlider's `displayWith` prop requires one (a plain
// function can't be serialized into the SSR payload).
const formatLabel$ = $((value: number): string => {
  if (value >= 1000) {
    return Math.round(value / 1000) + 'k';
  }
  return `${value}`;
});

export default component$(() => {
  const value = useSignal(3000);
  const onValueChange$ = $((v: number) => {
    value.value = v;
  });
  return (
    <>
      <div data-parity-root>
        <MatSlider
          style="width: 300px"
          discrete
          displayWith={formatLabel$}
          min={0}
          max={100000}
          step={1000}
          value={value.value}
          onValueChange$={onValueChange$}
        />
        <p>Value: {value.value}</p>
      </div>
      <main data-scenario-ready>ready</main>
    </>
  );
});
