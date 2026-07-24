import {component$} from '@builder.io/qwik';
import {
  MatCard,
  MatCardTitle,
  MatCardSubtitle,
  MatCardContent,
} from '@angular-community/qwik-material/card';

export default component$(() => (
  <>
    <MatCard>
      <MatCardTitle>Basic card</MatCardTitle>
      <MatCardSubtitle>Raised appearance by default</MatCardSubtitle>
      <MatCardContent>
        <p>
          The default appearance is 'raised'. This card demonstrates the container plus three
          text-only children.
        </p>
      </MatCardContent>
    </MatCard>
    <main data-scenario-ready>ready</main>
  </>
));
