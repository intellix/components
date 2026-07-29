import {component$} from '@builder.io/qwik';
import {MatIcon} from '@angular-community/qwik-material/icon';

export default component$(() => (
  <>
    <MatIcon color="primary">home</MatIcon>
    <MatIcon color="accent">home</MatIcon>
    <MatIcon color="warn">home</MatIcon>
    <main data-scenario-ready>ready</main>
  </>
));
