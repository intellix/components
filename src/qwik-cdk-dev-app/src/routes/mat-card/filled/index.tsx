import {component$} from '@builder.io/qwik';
import {MatCard, MatCardTitle, MatCardContent} from '@angular-community/qwik-material/card';

export default component$(() => (
  <>
    <MatCard appearance="filled">
      <MatCardTitle>Filled card</MatCardTitle>
      <MatCardContent>
        Filled appearance — subtle tinted background, no shadow, no border.
      </MatCardContent>
    </MatCard>
    <main data-scenario-ready>ready</main>
  </>
));
