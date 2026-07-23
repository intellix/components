import {component$, Slot} from '@builder.io/qwik';

export interface MatCardTitleGroupProps {
  class?: string | ReadonlyArray<string>;
  id?: string;
}

/**
 * Title-group region of a card. Uses q:slot named slots:
 * - q:slot="text" for MatCardTitle / MatCardSubtitle (rendered inside an
 *   unclassed wrapper <div>, matches upstream template)
 * - q:slot="image" for a MatCardImage family element
 * - unnamed <Slot/> for any free-projected content (rendered last)
 *
 * Consumer example:
 *   <MatCardTitleGroup>
 *     <MatCardTitle q:slot="text">Hello</MatCardTitle>
 *     <MatCardSubtitle q:slot="text">World</MatCardSubtitle>
 *     <MatCardImage q:slot="image" src="/x.png" alt="X" />
 *   </MatCardTitleGroup>
 */
export const MatCardTitleGroup = component$<MatCardTitleGroupProps>(props => {
  const classes = ['mat-mdc-card-title-group', props.class].filter(Boolean) as string[];
  return (
    <mat-card-title-group id={props.id} class={classes}>
      <div>
        <Slot name="text" />
      </div>
      <Slot name="image" />
      <Slot />
    </mat-card-title-group>
  );
});
