import {$, component$, useSignal} from '@qwik.dev/core';
import {MatSlider} from '@angular-community/qwik-material/slider';

// Mirrors src/dev-app/qwik-parity/slider.ts's SliderRange.
export default component$(() => {
  const start = useSignal(30);
  const end = useSignal(70);
  const onStartValueChange$ = $((v: number) => {
    start.value = v;
  });
  const onEndValueChange$ = $((v: number) => {
    end.value = v;
  });
  return (
    <>
      <div data-parity-root>
        <MatSlider
          style="width: 300px"
          startValue={start.value}
          endValue={end.value}
          onStartValueChange$={onStartValueChange$}
          onEndValueChange$={onEndValueChange$}
        />
        <p>
          Value: {start.value} : {end.value}
        </p>
      </div>
      <main data-scenario-ready>ready</main>
    </>
  );
});
