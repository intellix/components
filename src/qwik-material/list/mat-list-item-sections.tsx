import {component$, Slot} from '@builder.io/qwik';

/**
 * Shared props for the 5 slot components (Avatar, Icon, Title, Line, Meta).
 * Each is a trivial component$ wrapper rendering
 * <div class="<class-hooks>"><Slot /></div>. Leading sections
 * (Avatar/Icon) and trailing sections (Meta) can be composed in ANY DOM
 * order relative to the primary content — CSS grid on .mat-mdc-list-item
 * places them by class into columns 1 and 3 respectively, spanning all
 * rows. Primary content (Title, Line) SHARES grid column 2 and stacks in
 * DOM order — write Title before Line(s) to match Material's title-then-
 * lines visual convention.
 *
 * Upstream ships these as [matListItem*] attribute directives; ported as
 * real components for Qwik ergonomics per spec §5 deviation #9. CSS class
 * hooks preserved for external stylesheet compatibility.
 */
export interface MatListItemSectionProps {
  class?: string | ReadonlyArray<string>;
  id?: string;
}

/**
 * Leading avatar section. Circular by default (border-radius: 50%,
 * 40x40px). Placed in grid column 1 spanning all rows by list.scss.
 */
export const MatListItemAvatar = component$<MatListItemSectionProps>(props => {
  const classes = ['mat-mdc-list-item-avatar', 'mdc-list-item__start', props.class].filter(
    Boolean,
  ) as string[];
  return (
    <div id={props.id} class={classes}>
      <Slot />
    </div>
  );
});

/**
 * Leading icon section. 24x24px by default. Placed in grid column 1
 * spanning all rows by list.scss.
 */
export const MatListItemIcon = component$<MatListItemSectionProps>(props => {
  const classes = ['mat-mdc-list-item-icon', 'mdc-list-item__start', props.class].filter(
    Boolean,
  ) as string[];
  return (
    <div id={props.id} class={classes}>
      <Slot />
    </div>
  );
});

/**
 * Primary title text. Placed in grid column 2 by list.scss. Only one
 * title per list item (upstream constraint — no per-item enforcement in
 * the port; user responsibility).
 */
export const MatListItemTitle = component$<MatListItemSectionProps>(props => {
  const classes = ['mat-mdc-list-item-title', 'mdc-list-item__primary-text', props.class].filter(
    Boolean,
  ) as string[];
  return (
    <div id={props.id} class={classes}>
      <Slot />
    </div>
  );
});

/**
 * Secondary line text. Placed in grid column 2 by list.scss (auto-row
 * placement stacks multiple lines vertically). Line-count sizing (48/64/88px
 * min-height) driven by CSS :has() selectors on the parent item.
 */
export const MatListItemLine = component$<MatListItemSectionProps>(props => {
  const classes = ['mat-mdc-list-item-line', 'mdc-list-item__secondary-text', props.class].filter(
    Boolean,
  ) as string[];
  return (
    <div id={props.id} class={classes}>
      <Slot />
    </div>
  );
});

/**
 * Trailing meta section (control, button, additional text). Placed in
 * grid column 3 spanning all rows by list.scss.
 */
export const MatListItemMeta = component$<MatListItemSectionProps>(props => {
  const classes = ['mat-mdc-list-item-meta', 'mdc-list-item__end', props.class].filter(
    Boolean,
  ) as string[];
  return (
    <div id={props.id} class={classes}>
      <Slot />
    </div>
  );
});
