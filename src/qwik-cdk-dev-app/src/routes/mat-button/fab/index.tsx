import {component$} from '@builder.io/qwik';
import {MatFabButton} from '@angular-community/qwik-material/button';

export default component$(() => (
  <>
    <MatFabButton ariaLabel="Add">+</MatFabButton>
    <main data-scenario-ready>ready</main>
  </>
));
