import {component$} from '@qwik.dev/core';

export interface MatCardAvatarProps {
  src: string;
  alt?: string;
  class?: string | ReadonlyArray<string>;
  id?: string;
}

export const MatCardAvatar = component$<MatCardAvatarProps>(props => {
  const classes = ['mat-mdc-card-avatar', props.class].filter(Boolean) as string[];
  return <img id={props.id} src={props.src} alt={props.alt ?? ''} class={classes} />;
});
