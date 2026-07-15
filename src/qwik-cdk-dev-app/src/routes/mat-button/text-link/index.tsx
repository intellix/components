import {component$} from '@builder.io/qwik';
import {MatButton} from '@angular-community/qwik-material/button';

export default component$(() => (
  <>
    <MatButton href="/about">Text link</MatButton>
    <main data-scenario-ready>ready</main>
  </>
));
