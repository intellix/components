import {component$} from '@builder.io/qwik';
import {MatProgressBar} from '@angular-community/qwik-material/progress-bar';

export default component$(() => (
  <>
    <MatProgressBar mode="buffer" value={30} bufferValue={65} />
    <main data-scenario-ready>ready</main>
  </>
));
