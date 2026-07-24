import {component$} from '@builder.io/qwik';
import {MatCard, MatCardTitle, MatCardContent} from '@angular-community/qwik-material/card';

export default component$(() => (
  <>
    <MatCard appearance="outlined">
      <MatCardTitle>Outlined card</MatCardTitle>
      <MatCardContent>Outlined appearance — border instead of shadow.</MatCardContent>
    </MatCard>
    <main data-scenario-ready>ready</main>
  </>
));
