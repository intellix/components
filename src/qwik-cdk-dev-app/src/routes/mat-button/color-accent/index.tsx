import {component$} from '@builder.io/qwik';
import {MatButton} from '@angular-community/qwik-material/button';

export default component$(() => (
  <>
    <MatButton color="accent" appearance="filled">
      Accent
    </MatButton>
    <main data-scenario-ready>ready</main>
  </>
));
