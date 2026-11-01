import {component$} from '@qwik.dev/core';
import {MatSlider} from '@angular-community/qwik-material/slider';

// Mirrors src/dev-app/qwik-parity/slider.ts's SliderDisabled.
export default component$(() => (
  <>
    <div data-parity-root>
      <div>
        <MatSlider style="width: 300px" disabled value={50} />
      </div>
      <div>
        <MatSlider style="width: 300px" disabled startValue={30} endValue={70} />
      </div>
    </div>
    <main data-scenario-ready>ready</main>
  </>
));
