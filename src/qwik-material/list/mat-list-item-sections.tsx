import {component$, Slot, type CSSProperties} from '@qwik.dev/core';
import {useMatListStyles} from './list-styles';
import {listRichSheet} from './list-rich-styles';
import {serverRendering} from '../core/ssr-sheets';

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
 * Place each as a child of `<MatListItem>` with the matching `q:slot`
 * (`avatar`, `icon`, `title`, `line`, `meta`), and declare it with the
 * item's matching structure prop (`leading`, `title`, `lineCount`, `meta`)
 * — see mat-list-item.tsx's doc comment for why both.
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
  // A section is the rich sheet's, even in an item that didn't declare it (`leading`, `meta`, …).
  // An `<img>` holds no child to place it in during server rendering: its hook registers it.
  useMatListStyles(...(serverRendering() && props.as !== 'img' ? [] : (['rich'] as const)));
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
      {listRichSheet()}
    </div>
  );
});

/** Leading icon section. Host gets `mat-mdc-list-item-icon` + `mdc-list-item__start`. */
export const MatListItemIcon = component$<MatListItemIconProps>(props => {
  // A section is the rich sheet's, even in an item that didn't declare it (`leading`, `meta`, …).
  useMatListStyles(...(serverRendering() ? [] : (['rich'] as const)));
  const as = props.as ?? 'div';
  const classes = ['mat-mdc-list-item-icon', 'mdc-list-item__start', props.class].filter(
    Boolean,
  ) as string[];
  if (as === 'span') {
    return (
      <span id={props.id} class={classes} style={props.style}>
        {listRichSheet()}
        <Slot />
      </span>
    );
  }
  return (
    <div id={props.id} class={classes} style={props.style}>
      <Slot />
      {listRichSheet()}
    </div>
  );
});

export interface MatListItemTitleProps extends MatListItemSectionProps {
  /** Which host tag to render. Default `'div'`; `'span'` matches the real `material.angular.dev`
   *  `bottom-sheet-overview` docs example's `<span matListItemTitle>` — see
   *  `qwik-cdk-dev-app`'s `mat-bottom-sheet/example` route. */
  as?: 'div' | 'span';
}

export interface MatListItemLineProps extends MatListItemSectionProps {
  /** Which host tag to render. Default `'div'`. See {@link MatListItemTitleProps.as}. */
  as?: 'div' | 'span';
}

/**
 * Primary title text. Only one title per list item (upstream constraint —
 * no per-item enforcement in the port; user responsibility).
 */
export const MatListItemTitle = component$<MatListItemTitleProps>(props => {
  const classes = ['mat-mdc-list-item-title', 'mdc-list-item__primary-text', props.class].filter(
    Boolean,
  ) as string[];
  if (props.as === 'span') {
    return (
      <span id={props.id} class={classes} style={props.style}>
        {listRichSheet()}
        <Slot />
      </span>
    );
  }
  return (
    <div id={props.id} class={classes} style={props.style}>
      <Slot />
      {listRichSheet()}
    </div>
  );
});

/**
 * Secondary line text. Up to two per item (title + 2 lines = upstream's
 * 3-line maximum).
 */
export const MatListItemLine = component$<MatListItemLineProps>(props => {
  // A section is the rich sheet's, even in an item that didn't declare it (`leading`, `meta`, …).
  useMatListStyles(...(serverRendering() ? [] : (['rich'] as const)));
  const classes = ['mat-mdc-list-item-line', 'mdc-list-item__secondary-text', props.class].filter(
    Boolean,
  ) as string[];
  if (props.as === 'span') {
    return (
      <span id={props.id} class={classes} style={props.style}>
        {listRichSheet()}
        <Slot />
      </span>
    );
  }
  return (
    <div id={props.id} class={classes} style={props.style}>
      <Slot />
      {listRichSheet()}
    </div>
  );
});

/** Trailing meta section (control, button, or additional text). */
export const MatListItemMeta = component$<MatListItemSectionProps>(props => {
  // A section is the rich sheet's, even in an item that didn't declare it (`leading`, `meta`, …).
  useMatListStyles(...(serverRendering() ? [] : (['rich'] as const)));
  const classes = ['mat-mdc-list-item-meta', 'mdc-list-item__end', props.class].filter(
    Boolean,
  ) as string[];
  return (
    <div id={props.id} class={classes} style={props.style}>
      <Slot />
      {listRichSheet()}
    </div>
  );
});
