import {$, component$, useSignal, useStyles$} from '@qwik.dev/core';
import {MatSlider} from '@angular-community/qwik-material/slider';
import styles from './example.css?inline';

/**
 * Port of material.angular.dev's `slider-formatting` docs example
 * (src/components-examples/material/slider/slider-formatting/). `displayWith` must be a QRL, not
 * a plain function — Qwik's SSR serializer can't serialize a raw function reference (see
 * qwik-material/slider/mat-slider.tsx's own `displayWith` doc comment / SYNC.md's "displayWith
 * must be a QRL" note).
 */
const formatLabel$ = $((value: number): string => {
  if (value >= 1000) {
    return Math.round(value / 1000) + 'k';
  }
  return `${value}`;
});

export default component$(() => {
  useStyles$(styles);
  const value = useSignal(0);

  return (
    <slider-formatting-example>
      <MatSlider
        min={0}
        max={100000}
        step={1000}
        showTickMarks
        discrete
        displayWith={formatLabel$}
        value={value.value}
        onValueChange$={v => (value.value = v)}
      />
    </slider-formatting-example>
  );
});
