import {component$} from '@qwik.dev/core';
import {MatCard, MatCardTitle, MatCardContent} from '@angular-community/qwik-material/card';

export default component$(() => (
  <>
    <div data-parity-root>
      <MatCard appearance="outlined">
        <MatCardTitle>Outlined card</MatCardTitle>
        <MatCardContent>Outlined appearance — border instead of shadow.</MatCardContent>
      </MatCard>
    </div>
    <main data-scenario-ready>ready</main>
  </>
));
