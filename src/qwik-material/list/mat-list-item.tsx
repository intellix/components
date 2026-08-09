import {component$, Slot} from '@builder.io/qwik';

/**
 * Props for MatListItem. Polymorphic host via `as` prop:
 *   - 'div' (default) renders <mat-list-item> custom element
 *   - 'a' renders <a> (mirrors upstream a[mat-list-item] selector)
 *   - 'button' renders <button> (mirrors upstream button[mat-list-item]
 *     selector)
 *
 * See design spec §3.2 for rendered DOM shape per variant.
 */
export interface MatListItemProps {
  /** Which host tag to render. Default 'div' renders <mat-list-item>.
   *  'a' renders <a> (for nav-list items — combine with href).
   *  'button' renders <button> (for action-list items — combine with
   *  onClick$). */
  as?: 'div' | 'a' | 'button';
  /** When as='a', sets the href. Ignored for other tags. */
  href?: string;
  /** For nav-list items: marks this as the current page → emits
   *  aria-current="page". Only emitted when as='a' AND activated
   *  (matches upstream _getAriaCurrent). */
  activated?: boolean;
  /** Applies mdc-list-item--disabled + aria-disabled=true.
   *  When as='button', also reflects the native disabled attribute
   *  (matches upstream (_isButtonElement && disabled) || null binding). */
  disabled?: boolean;
  role?: string;
  'aria-label'?: string;
  'aria-labelledby'?: string;
  'aria-describedby'?: string;
  class?: string | ReadonlyArray<string>;
  id?: string;
}

export const MatListItem = component$<MatListItemProps>(props => {
  const as = props.as ?? 'div';
  const activated = props.activated ?? false;
  const disabled = props.disabled ?? false;

  const classes = [
    'mat-mdc-list-item',
    'mdc-list-item',
    activated && 'mdc-list-item--activated',
    disabled && 'mdc-list-item--disabled',
    props.class,
  ].filter(Boolean) as string[];

  // aria-current="page" only for anchor variant with activated=true.
  const ariaCurrent = as === 'a' && activated ? 'page' : undefined;

  // Native disabled attribute only reflected on button variant.
  const nativeDisabled = as === 'button' && disabled ? true : undefined;

  if (as === 'a') {
    return (
      <a
        id={props.id}
        class={classes}
        href={props.href}
        role={props.role}
        aria-current={ariaCurrent}
        aria-disabled={disabled ? 'true' : undefined}
        aria-label={props['aria-label']}
        aria-labelledby={props['aria-labelledby']}
        aria-describedby={props['aria-describedby']}
      >
        <Slot />
      </a>
    );
  }

  if (as === 'button') {
    return (
      <button
        id={props.id}
        class={classes}
        disabled={nativeDisabled}
        role={props.role}
        aria-disabled={disabled ? 'true' : undefined}
        aria-label={props['aria-label']}
        aria-labelledby={props['aria-labelledby']}
        aria-describedby={props['aria-describedby']}
      >
        <Slot />
      </button>
    );
  }

  // Default: <mat-list-item> custom element.
  return (
    <mat-list-item
      id={props.id}
      class={classes}
      role={props.role}
      aria-disabled={disabled ? 'true' : undefined}
      aria-label={props['aria-label']}
      aria-labelledby={props['aria-labelledby']}
      aria-describedby={props['aria-describedby']}
    >
      <Slot />
    </mat-list-item>
  );
});
