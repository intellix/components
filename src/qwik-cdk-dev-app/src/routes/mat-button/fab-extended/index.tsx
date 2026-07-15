import {component$} from '@builder.io/qwik';
import {MatFabButton} from '@angular-community/qwik-material/button';

export default component$(() => (
  <>
    <MatFabButton extended>+ New</MatFabButton>
    <main data-scenario-ready>ready</main>
  </>
));
