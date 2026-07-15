import {component$} from '@builder.io/qwik';
import {MatIconButton} from '@angular-community/qwik-material/button';

export default component$(() => (
  <>
    <MatIconButton ariaLabel="Menu">≡</MatIconButton>
    <main data-scenario-ready>ready</main>
  </>
));
