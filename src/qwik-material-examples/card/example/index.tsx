import {component$, useStyles$} from '@qwik.dev/core';
import {
  MatCard,
  MatCardHeader,
  MatCardTitle,
  MatCardSubtitle,
  MatCardImage,
  MatCardContent,
  MatCardActions,
} from '@angular-community/qwik-material/card';
import {MatButton} from '@angular-community/qwik-material/button';
import styles from './example.css?inline';

// Port of src/components-examples/material/card/card-overview
// (card-overview-example.html/.ts/.css) — material.angular.dev's "Card
// overview" example. Upstream's avatar is a plain `<div mat-card-avatar>`
// (a background-image div, not an `<img>`) — `MatCardAvatar` only renders an
// `<img>` (see card/SYNC.md deviation 1), so it's genuinely unusable here;
// the div is written directly with the same `mat-mdc-card-avatar` class the
// `[mat-card-avatar]` directive's host binding adds (the `mat-card-avatar`
// selector attribute itself is a CONSUMER_SELECTOR_ATTRS entry the parity
// harness ignores either way).

export default component$(() => {
  useStyles$(styles);

  return (
    <card-overview-example>
      <MatCard class="example-card" appearance="outlined">
        <MatCardHeader>
          <div q:slot="avatar" class={['example-header-image', 'mat-mdc-card-avatar']} />
          <MatCardTitle q:slot="text">Shiba Inu</MatCardTitle>
          <MatCardSubtitle q:slot="text">Dog Breed</MatCardSubtitle>
        </MatCardHeader>
        <MatCardImage
          src="https://material.angular.dev/assets/img/examples/shiba2.jpg"
          alt="Photo of a Shiba Inu"
        />
        <MatCardContent>
          <p>
            The Shiba Inu is the smallest of the six original and distinct spitz breeds of dog from
            Japan. A small, agile dog that copes very well with mountainous terrain, the Shiba Inu
            was originally bred for hunting.
          </p>
        </MatCardContent>
        <MatCardActions>
          <MatButton>LIKE</MatButton>
          <MatButton>SHARE</MatButton>
        </MatCardActions>
      </MatCard>
    </card-overview-example>
  );
});
