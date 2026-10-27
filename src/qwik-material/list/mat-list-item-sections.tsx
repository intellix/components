import {component$, Slot, type CSSProperties} from '@builder.io/qwik';

/**
 * Shared props for the 5 slot components (Avatar, Icon, Title, Line, Meta).
 * Upstream ships these as `[matListItemAvatar]` / `[matListItemIcon]` /
 * `[matListItemTitle]` / `[matListItemLine]` / `[matListItemMeta]`
 * attribute directives applied directly to the consumer's own element —
 * no new element is introduced. Each is ported as a polymorphic component
 * that renders that host element itself (`as`, default `'div'` — the tag
 * used throughout the Material + parity scenarios), matching the pattern
 * `MatListItem` already uses. No wrapper element either way — `style`
 * lands on this same host element (e.g. a colored avatar swatch), exactly
 * like `<div matListItemAvatar style="...">` upstream.
 *
 * Pass the result as the matching named prop on `<MatListItem>` (`avatar`,
 * `icon`, `title`, `lineContent`, `meta`) rather than as nested JSX
 * children — see mat-list-item.tsx's doc comment for why.
 */
export interface MatListItemSectionProps {
  class?: string | ReadonlyArray<string>;
  style?: CSSProperties | string;
  id?: string;
}

export interface MatListItemAvatarProps extends MatListItemSectionProps {
  /** Which host tag to render. Default `'div'`; `'img'` is the other
   *  common real-world host for an avatar. */
  as?: 'div' | 'img';
  /** Only used when `as="img"`. */
  src?: string;
  alt?: string;
}

export interface MatListItemIconProps extends MatListItemSectionProps {
  /** Which host tag to render. Default `'div'`. */
  as?: 'div' | 'span';
}

/**
 * Leading avatar section. Host gets `mat-mdc-list-item-avatar` +
 * `mdc-list-item__start` (MDC's "start" slot — always "start" for a plain
 * list item; `list-option`'s checkbox/radio-position logic is out of
 * scope, see list/SYNC.md).
 */
export const MatListItemAvatar = component$<MatListItemAvatarProps>(props => {
  const as = props.as ?? 'div';
  const classes = ['mat-mdc-list-item-avatar', 'mdc-list-item__start', props.class].filter(
    Boolean,
  ) as string[];
  if (as === 'img') {
    return (
      <img
        id={props.id}
        class={classes}
        style={props.style}
        src={props.src}
        alt={props.alt ?? ''}
      />
    );
  }
  return (
    <div id={props.id} class={classes} style={props.style}>
      <Slot />
    </div>
  );
});

/** Leading icon section. Host gets `mat-mdc-list-item-icon` + `mdc-list-item__start`. */
export const MatListItemIcon = component$<MatListItemIconProps>(props => {
  const as = props.as ?? 'div';
  const classes = ['mat-mdc-list-item-icon', 'mdc-list-item__start', props.class].filter(
    Boolean,
  ) as string[];
  if (as === 'span') {
    return (
      <span id={props.id} class={classes} style={props.style}>
        <Slot />
      </span>
    );
  }
  return (
    <div id={props.id} class={classes} style={props.style}>
      <Slot />
    </div>
  );
});

/**
 * Primary title text. Only one title per list item (upstream constraint —
 * no per-item enforcement in the port; user responsibility).
 */
export const MatListItemTitle = component$<MatListItemSectionProps>(props => {
  const classes = ['mat-mdc-list-item-title', 'mdc-list-item__primary-text', props.class].filter(
    Boolean,
  ) as string[];
  return (
    <div id={props.id} class={classes} style={props.style}>
      <Slot />
    </div>
  );
});

/**
 * Secondary line text. Up to two per item (title + 2 lines = upstream's
 * 3-line maximum).
 */
export const MatListItemLine = component$<MatListItemSectionProps>(props => {
  const classes = ['mat-mdc-list-item-line', 'mdc-list-item__secondary-text', props.class].filter(
    Boolean,
  ) as string[];
  return (
    <div id={props.id} class={classes} style={props.style}>
      <Slot />
    </div>
  );
});

/** Trailing meta section (control, button, or additional text). */
export const MatListItemMeta = component$<MatListItemSectionProps>(props => {
  const classes = ['mat-mdc-list-item-meta', 'mdc-list-item__end', props.class].filter(
    Boolean,
  ) as string[];
  return (
    <div id={props.id} class={classes} style={props.style}>
      <Slot />
    </div>
  );
});
