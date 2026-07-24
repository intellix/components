import {component$} from '@builder.io/qwik';
import {
  MatCard,
  MatCardTitleGroup,
  MatCardTitle,
  MatCardSubtitle,
  MatCardImage,
  MatCardContent,
} from '@angular-community/qwik-material/card';

export default component$(() => (
  <>
    <MatCard>
      <MatCardTitleGroup>
        <MatCardTitle q:slot="text">Title group</MatCardTitle>
        <MatCardSubtitle q:slot="text">Title + subtitle + trailing image</MatCardSubtitle>
        <MatCardImage q:slot="image" src="https://placehold.co/80x80" alt="Icon" />
      </MatCardTitleGroup>
      <MatCardContent>MatCardTitleGroup uses q:slot="text" and q:slot="image".</MatCardContent>
    </MatCard>
    <main data-scenario-ready>ready</main>
  </>
));
