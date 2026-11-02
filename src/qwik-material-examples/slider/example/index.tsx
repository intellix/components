import {component$, useStyles$} from '@qwik.dev/core';
import {MatSlider} from '@angular-community/qwik-material/slider';
import styles from './slider-overview-example.css?inline';

/**
 * Port of material.angular.dev's `slider-overview` docs example
 * (src/components-examples/material/slider/slider-overview/). A single-thumb slider with no
 * bound value (defaults to 0) — compared as rendered, no interaction needed.
 */

export default component$(() => {
  useStyles$(styles);

  return (
    <slider-overview-example>
      <MatSlider value={0} />
    </slider-overview-example>
  );
});
