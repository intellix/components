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
        <MatCardTitle>Actions align=end</MatCardTitle>
        <MatCardContent>Actions row aligned to the end.</MatCardContent>
        <MatCardActions align="end">
          <button type="button">Cancel</button>
          <button type="button">Confirm</button>
        </MatCardActions>
      </MatCard>
    </div>
    <main data-scenario-ready>ready</main>
  </>
));
