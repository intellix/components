import {component$} from '@qwik.dev/core';
import {
  MatCard,
  MatCardImage,
  MatCardTitle,
  MatCardContent,
} from '@angular-community/qwik-material/card';

export default component$(() => (
  <>
    <div data-parity-root>
      <MatCard>
        <MatCardImage src="https://placehold.co/600x200" alt="Cover" />
        <MatCardTitle>With image</MatCardTitle>
        <MatCardContent>
          MatCardImage renders an &lt;img&gt; with the mat-mdc-card-image + mdc-card__media classes.
        </MatCardContent>
      </MatCard>
    </div>
    <main data-scenario-ready>ready</main>
  </>
));
