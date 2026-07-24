import {component$} from '@builder.io/qwik';
import {
  MatCard,
  MatCardTitle,
  MatCardContent,
  MatCardFooter,
} from '@angular-community/qwik-material/card';

export default component$(() => (
  <>
    <MatCard>
      <MatCardTitle>With footer</MatCardTitle>
      <MatCardContent>Card with a footer element below the content.</MatCardContent>
      <MatCardFooter>Footer text</MatCardFooter>
    </MatCard>
    <main data-scenario-ready>ready</main>
  </>
));
