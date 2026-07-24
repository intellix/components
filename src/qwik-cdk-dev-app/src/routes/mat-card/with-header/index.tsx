import {component$} from '@builder.io/qwik';
import {
  MatCard,
  MatCardHeader,
  MatCardAvatar,
  MatCardTitle,
  MatCardSubtitle,
  MatCardContent,
} from '@angular-community/qwik-material/card';

export default component$(() => (
  <>
    <MatCard>
      <MatCardHeader>
        <MatCardAvatar q:slot="avatar" src="https://placehold.co/40x40" alt="Avatar" />
        <MatCardTitle q:slot="text">With header</MatCardTitle>
        <MatCardSubtitle q:slot="text">Avatar + title + subtitle</MatCardSubtitle>
      </MatCardHeader>
      <MatCardContent>
        Header uses q:slot="avatar" and q:slot="text" for structured projection.
      </MatCardContent>
    </MatCard>
    <main data-scenario-ready>ready</main>
  </>
));
