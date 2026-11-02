import {component$, useSignal, useStyles$} from '@qwik.dev/core';
import {MatSlider} from '@angular-community/qwik-material/slider';
import styles from './example.css?inline';

/**
 * Port of material.angular.dev's `slider-range` docs example
 * (src/components-examples/material/slider/slider-range/). Upstream's two-thumb range slider
 * (`matSliderStartThumb`/`matSliderEndThumb`) is this port's single `<MatSlider>` in "range mode"
 * — passing `startValue`/`endValue` switches it, see qwik-material/slider/SYNC.md "Single
 * component, not three directives".
 */
export default component$(() => {
  useStyles$(styles);
  const startValue = useSignal(300);
  const endValue = useSignal(400);

  return (
    <slider-range-example>
      <MatSlider
        min={200}
        max={500}
        startValue={startValue.value}
        endValue={endValue.value}
        onStartValueChange$={v => (startValue.value = v)}
        onEndValueChange$={v => (endValue.value = v)}
      />
    </slider-range-example>
  );
});
