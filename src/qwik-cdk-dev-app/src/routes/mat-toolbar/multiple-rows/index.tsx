import {component$} from '@builder.io/qwik';
import {MatToolbar, MatToolbarRow} from '@angular-community/qwik-material/toolbar';

export default component$(() => (
  <>
    <MatToolbar multipleRows>
      <MatToolbarRow>First row</MatToolbarRow>
      <MatToolbarRow>Second row</MatToolbarRow>
    </MatToolbar>
    <main data-scenario-ready>ready</main>
  </>
));
