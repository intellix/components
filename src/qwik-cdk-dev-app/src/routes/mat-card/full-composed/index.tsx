import {component$} from '@qwik.dev/core';
import {
  MatCard,
  MatCardHeader,
  MatCardAvatar,
  MatCardTitle,
  MatCardSubtitle,
  MatCardImage,
  MatCardContent,
  MatCardActions,
} from '@angular-community/qwik-material/card';

export default component$(() => (
  <>
    <div data-parity-root>
      <MatCard>
        <MatCardHeader>
          <MatCardAvatar q:slot="avatar" src="https://placehold.co/40x40" alt="User" />
          <MatCardTitle q:slot="text">Full composed card</MatCardTitle>
          <MatCardSubtitle q:slot="text">Header + image + content + actions</MatCardSubtitle>
        </MatCardHeader>
        <MatCardImage src="https://placehold.co/600x200" alt="Cover" />
        <MatCardContent>
          <p>
            A realistic composition: avatar-headed card with a cover image, body copy, and an
            actions row at the bottom.
          </p>
        </MatCardContent>
        <MatCardActions align="end">
          <button type="button">Dismiss</button>
          <button type="button">Open</button>
        </MatCardActions>
      </MatCard>
    </div>
    <main data-scenario-ready>ready</main>
  </>
));
