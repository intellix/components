import {component$, Slot} from '@builder.io/qwik';

/**
 * Port of upstream `MatGridAvatarCssMatStyler` (`src/material/grid-list/grid-tile.ts`)
 * — a `[mat-grid-avatar], [matGridAvatar]` attribute directive that adds the
 * `mat-grid-avatar` class to whatever element the consumer puts it on (most
 * commonly an `<img>`). Per the DOM-parity remediation's API rule, the Qwik
 * component renders that host element itself via a polymorphic `as` prop.
 *
 * Projected into `<MatGridTileHeader>` / `<MatGridTileFooter>` the same way
 * upstream's `<ng-content select="[mat-grid-avatar]">` is — see
 * `mat-grid-tile-text.tsx`.
 */
export interface MatGridAvatarProps {
  /** Which host tag to render. Default 'div'. 'img' takes `src`/`alt`
   *  instead of child content (mirrors the common `<img mat-grid-avatar>` usage). */
  as?: 'div' | 'img';
  src?: string;
  alt?: string;
  class?: string | ReadonlyArray<string>;
  id?: string;
}

export const MatGridAvatar = component$<MatGridAvatarProps>(props => {
  const as = props.as ?? 'div';
  const classes = ['mat-grid-avatar', props.class].filter(Boolean) as string[];

  if (as === 'img') {
    return <img id={props.id} class={classes} src={props.src} alt={props.alt ?? ''} />;
  }
  return (
    <div id={props.id} class={classes}>
      <Slot />
    </div>
  );
});
