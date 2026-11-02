import {component$} from '@qwik.dev/core';

/**
 * Props shared by MatCardImage and its 4 size variants. Upstream applies
 * these as attribute directives to a consumer-supplied <img>; qwik-material
 * renders <img> directly with src/alt so the consumer never touches <img>.
 */
export interface MatCardImageProps {
  src: string;
  alt?: string;
  class?: string | ReadonlyArray<string>;
  id?: string;
}

export const MatCardImage = component$<MatCardImageProps>(props => {
  const classes = ['mat-mdc-card-image', 'mdc-card__media', props.class].filter(
    Boolean,
  ) as string[];
  return <img id={props.id} src={props.src} alt={props.alt ?? ''} class={classes} />;
});

export const MatCardSmImage = component$<MatCardImageProps>(props => {
  const classes = ['mat-mdc-card-sm-image', 'mdc-card__media', props.class].filter(
    Boolean,
  ) as string[];
  return <img id={props.id} src={props.src} alt={props.alt ?? ''} class={classes} />;
});

export const MatCardMdImage = component$<MatCardImageProps>(props => {
  const classes = ['mat-mdc-card-md-image', 'mdc-card__media', props.class].filter(
    Boolean,
  ) as string[];
  return <img id={props.id} src={props.src} alt={props.alt ?? ''} class={classes} />;
});

export const MatCardLgImage = component$<MatCardImageProps>(props => {
  const classes = ['mat-mdc-card-lg-image', 'mdc-card__media', props.class].filter(
    Boolean,
  ) as string[];
  return <img id={props.id} src={props.src} alt={props.alt ?? ''} class={classes} />;
});

export const MatCardXlImage = component$<MatCardImageProps>(props => {
  const classes = ['mat-mdc-card-xl-image', 'mdc-card__media', props.class].filter(
    Boolean,
  ) as string[];
  return <img id={props.id} src={props.src} alt={props.alt ?? ''} class={classes} />;
});
