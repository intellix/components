import {component$} from '@builder.io/qwik';
import {MatButton} from '@angular-community/qwik-material/button';

export default component$(() => (
  <>
    <MatButton disabled>Disabled button</MatButton>
    <main data-scenario-ready>ready</main>
  </>
));
