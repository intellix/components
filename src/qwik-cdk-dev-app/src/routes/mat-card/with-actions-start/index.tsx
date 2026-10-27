import {component$} from '@builder.io/qwik';
import {
  MatCard,
  MatCardTitle,
  MatCardContent,
  MatCardActions,
} from '@angular-community/qwik-material/card';

export default component$(() => (
  <>
    <div data-parity-root>
      <MatCard>
        <MatCardTitle>Actions align=start (default)</MatCardTitle>
        <MatCardContent>Actions row aligned to the start.</MatCardContent>
        <MatCardActions>
          <button type="button">Action 1</button>
          <button type="button">Action 2</button>
        </MatCardActions>
      </MatCard>
    </div>
    <main data-scenario-ready>ready</main>
  </>
));
