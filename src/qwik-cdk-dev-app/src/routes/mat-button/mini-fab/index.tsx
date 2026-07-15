import {component$} from '@builder.io/qwik';
import {MatMiniFabButton} from '@angular-community/qwik-material/button';

export default component$(() => (
  <>
    <MatMiniFabButton ariaLabel="Add">+</MatMiniFabButton>
    <main data-scenario-ready>ready</main>
  </>
));
