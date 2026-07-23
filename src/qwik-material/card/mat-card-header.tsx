import {component$, Slot} from '@builder.io/qwik';

export interface MatCardHeaderProps {
  class?: string | ReadonlyArray<string>;
  id?: string;
}

/**
 * Header region of a card. Uses q:slot named slots for structured projection:
 * - unnamed <Slot/> for any free-projected content (rendered first)
 * - q:slot="avatar" for a MatCardAvatar (rendered second)
 * - q:slot="text" for MatCardTitle / MatCardSubtitle (rendered inside the
 *   .mat-mdc-card-header-text wrapper div, matches upstream template)
 *
 * Consumer example:
 *   <MatCardHeader>
 *     <MatCardAvatar q:slot="avatar" src="/u.png" alt="User" />
 *     <MatCardTitle q:slot="text">Hello</MatCardTitle>
 *     <MatCardSubtitle q:slot="text">World</MatCardSubtitle>
 *   </MatCardHeader>
 */
export const MatCardHeader = component$<MatCardHeaderProps>(props => {
  const classes = ['mat-mdc-card-header', props.class].filter(Boolean) as string[];
  return (
    <mat-card-header id={props.id} class={classes}>
      <Slot />
      <Slot name="avatar" />
      <div class="mat-mdc-card-header-text">
        <Slot name="text" />
      </div>
    </mat-card-header>
  );
});
