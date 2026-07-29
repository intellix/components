import {component$} from '@builder.io/qwik';
import {MatIcon} from '@angular-community/qwik-material/icon';

export default component$(() => (
  <>
    <MatIcon aria-hidden={false} aria-label="Home">
      home
    </MatIcon>
    <main data-scenario-ready>ready</main>
  </>
));
