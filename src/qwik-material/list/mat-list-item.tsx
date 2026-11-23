import {$, component$, Slot, useContext, type QRL} from '@qwik.dev/core';
import {useAnimationsDisabled} from '../dialog/use-animations-disabled';
import {handleRippleEvent, rippleAnimationConfig} from '../core/ripple/ripple-dom';
import {useRippleGlobalOptions} from '../core/ripple/ripple-global-options';
import {MAT_LIST_BASE_STATE, MAT_LIST_BASE_STATE_DEFAULTS} from './list-context';
import {type MatListStyleVariant, useMatListStyles} from './list-styles';

/**
 * Props for MatListItem. Polymorphic host via `as` prop:
 *   - 'div' (default) renders <mat-list-item> custom element
 *   - 'a' renders <a> (mirrors upstream a[mat-list-item] selector)
 *   - 'button' renders <button> (mirrors upstream button[mat-list-item]
 *     selector)
 *
 * **Sections are named slots; their structure is declared in props.**
 * Upstream's `list-item.html` distributes projected content into fixed
 * positions — leading avatar/icon BEFORE a `<span class="mdc-list-item__content">`
 * that itself only wraps title + lines + unscoped text, then trailing meta
 * and a nested divider AFTER — with `<ng-content select="...">`, which
 * reorders by selector regardless of source order. Qwik's named `<Slot>`
 * does the same by the `q:slot` name each child carries:
 *
 * ```tsx
 * <MatListItem leading="icon" title lineCount={1} meta>
 *   <MatListItemIcon q:slot="icon">…</MatListItemIcon>
 *   <MatListItemTitle q:slot="title">Inbox</MatListItemTitle>
 *   <MatListItemLine q:slot="line">3 unread</MatListItemLine>
 *   <MatListItemMeta q:slot="meta">128</MatListItemMeta>
 * </MatListItem>
 * ```
 *
 * Slots: `avatar`, `icon`, `title`, `line` (any number), `meta`, `divider`;
 * unnamed children are the unscoped content (upstream's default
 * `<ng-content>`). A projection is rendered by the parent and never
 * serialized with the item's props, so a re-renderable item (e.g. a nav item
 * whose `activated` follows the URL) doesn't ship its content twice.
 *
 * What a component can't do is inspect its own projection — upstream's
 * `@ContentChildren` queries (`_avatars`, `_icons`, `_titles`, `_lines`,
 * `_meta`) and `_hasUnscopedTextContent` have no Qwik equivalent — so the
 * caller declares the structure with `leading` / `title` / `lineCount` /
 * `meta` / `content`, and the content-derived classes below follow from
 * those exactly as upstream's follow from its queries.
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
   *  (matches upstream (_isButtonElement && disabled) || null binding).
   *  Also folded into the ripple-disabled check below, matching upstream
   *  `MatListItemBase.disableRipple`'s own `this.disabled || ...`. */
  disabled?: boolean;
  /**
   * Mirrors upstream `MatListItemBase.disableRipple`'s own settable half
   * (`_disableRipple`). The EFFECTIVE value ORs in `disabled`, the
   * containing list's own `disableRipple` (see `MatList`/`MatNavList`/
   * `MatActionList`'s `disableRipple` prop), and animations-disabled —
   * see the component body below for the exact precedence, copied from
   * `list-base.ts`'s `disableRipple` getter.
   */
  disableRipple?: boolean;
  /** Which leading section is projected: `'avatar'` (`q:slot="avatar"`,
   *  upstream's `[matListItemAvatar]`) or `'icon'` (`q:slot="icon"`,
   *  `[matListItemIcon]`). Drives `mdc-list-item--with-leading-avatar`/
   *  `-icon` — upstream's `_avatars.length`/`_icons.length`. */
  leading?: 'avatar' | 'icon';
  /** Whether a `q:slot="title"` section (`[matListItemTitle]`) is projected —
   *  upstream's `_titles.length`, which feeds the line count and whether
   *  unscoped content is treated as the title. */
  title?: boolean;
  /** How many `q:slot="line"` sections (`[matListItemLine]`) are projected —
   *  upstream's `_lines.length`, which feeds the line count. Default 0. */
  lineCount?: number;
  /** Whether a `q:slot="meta"` section (`[matListItemMeta]`) is projected.
   *  Drives `mdc-list-item--with-trailing-meta` — upstream's `_meta.length`. */
  meta?: boolean;
  /**
   * Whether the item has unscoped content — unnamed children, upstream's
   * default `<ng-content>` (plain text or markup not in one of the sections
   * above). Upstream's `_hasUnscopedTextContent` (non-whitespace text in the
   * unscoped wrapper). When it's the item's only line (no title, 1 total
   * line) it's treated as the title; otherwise as a secondary line —
   * matches upstream `_updateItemLines`'s `treatAsTitle` logic.
   */
  content?: boolean;
  /**
   * Explicit line count (matches upstream `[lines]` input — same name,
   * same meaning). Upstream infers this from projected content (title +
   * line count, +1 if there's unscoped text) when omitted; the default
   * here does the same from `title` / `lineCount` / `content`.
   * Set this only to override that inference.
   */
  lines?: number;
  role?: string;
  'aria-label'?: string;
  'aria-labelledby'?: string;
  'aria-describedby'?: string;
  class?: string | ReadonlyArray<string>;
  id?: string;
  /**
   * Click handler, forwarded onto whichever host tag `as` renders. Upstream
   * attaches `(click)` directly in the CONSUMER's own template on
   * `<a mat-list-item>`/`<button mat-list-item>` (an ordinary native
   * listener, independent of the `MatListItem` directive's own metadata) —
   * e.g. a nav-list action that dismisses an enclosing `MatBottomSheet`. A
   * Qwik `component$` has no such "arbitrary extra listener on the host
   * I render" affordance, so it's accepted as an explicit prop instead.
   */
  onClick$?: QRL<(event: MouseEvent) => void>;
}

/**
 * The list sheets an item with these props renders: the `rich` one (two/three lines, a leading
 * avatar or icon, trailing meta) only when it has any — the same structure props that pick its
 * classes below, read before any hook so the styles stay its first hook.
 */
function itemStyleVariants(props: MatListItemProps): MatListStyleVariant[] {
  const lines =
    props.lines ?? (props.title ? 1 : 0) + (props.lineCount ?? 0) + (props.content ? 1 : 0);
  return lines > 1 || props.leading || props.meta ? ['rich'] : [];
}

export const MatListItem = component$<MatListItemProps>(props => {
  useMatListStyles(...itemStyleVariants(props));
  const as = props.as ?? 'div';
  const activated = props.activated ?? false;
  const disabled = props.disabled ?? false;

  // Mirrors upstream `inject(MatListBase, {optional: true})` — whether
  // the containing <MatList>/<MatNavList>/<MatActionList> is interactive,
  // and its own `disableRipple` input.
  const listBase = useContext(MAT_LIST_BASE_STATE, MAT_LIST_BASE_STATE_DEFAULTS);
  const animationsDisabled = useAnimationsDisabled();
  const rippleGlobalOptions = useRippleGlobalOptions();

  // Mirrors upstream `_initInteractiveListItem()`'s own guard
  // (`this._listBase && !this._listBase._isNonInteractive`): a
  // `RippleRenderer` is only ever constructed for an item inside an
  // interactive list (<mat-nav-list>/<mat-action-list>, or any list whose
  // `_isNonInteractive` was overridden). A plain `<mat-list-item>` with no
  // list ancestor at all also falls here, via `MAT_LIST_BASE_STATE_DEFAULTS`
  // (`isNonInteractive: true`) — same as upstream's default.
  const isInteractive = !listBase.isNonInteractive;

  // Mirrors `MatListItemBase.disableRipple`'s getter exactly:
  // `this.disabled || this._disableRipple || this._noopAnimations ||
  // !!this._listBase?.disableRipple`. Note `_noopAnimations` here fully
  // disables the ripple (not just its duration) — a list-item-specific
  // upstream quirk other ripple-bearing ports in this project don't share
  // (they only zero the animation duration via `rippleAnimationConfig`).
  // `MAT_RIPPLE_GLOBAL_OPTIONS.disabled` is folded in separately, by
  // `handleRippleEvent`'s own 4th argument below (mirrors the SEPARATE
  // `rippleDisabled` getter: `this.disableRipple || !!this.rippleConfig.disabled`).
  const rippleDisabled =
    disabled ||
    (props.disableRipple ?? false) ||
    animationsDisabled.value ||
    !!listBase.disableRipple;

  // Upstream: `new RippleRenderer(this, this._ngZone, this._hostElement, ...)`
  // — the CONTAINER passed to the renderer is the list item's own host
  // element itself (no dedicated ripple `<div>`, unlike menu-item/mat-option).
  // `.mat-ripple-element` spans therefore launch and append as direct
  // children of `<mat-list-item>`/`<a mat-list-item>`/`<button mat-list-item>`.
  // ONE shared `$()` reference wired to all six pointer events — see
  // `core/ripple/ripple-renderer.ts`'s module doc comment for why that's
  // required, not just tidy (cross-chunk QRL ordering on a cold chunk).
  // The host is the element Qwik passes the listener (the one it's set on),
  // not a `ref` signal: a signal holding the element is serialized per item.
  const rippleEvent$ = $((event: MouseEvent | TouchEvent, host: Element) => {
    handleRippleEvent(
      event,
      host,
      {
        rippleDisabled,
        rippleConfig: {animation: rippleAnimationConfig(animationsDisabled.value)},
      },
      rippleGlobalOptions,
    );
  });

  // Upstream's `_titles.length` / `_lines.length` / `_hasUnscopedTextContent`,
  // declared by the caller (see the doc comment above).
  const titleCount = props.title ? 1 : 0;
  const lineCount = props.lineCount ?? 0;
  const hasContentText = props.content ?? false;

  const hasLeadingAvatar = props.leading === 'avatar';
  const hasLeadingIcon = props.leading === 'icon';
  const hasTrailingMeta = props.meta ?? false;
  const hasBothLeadingAndTrailing = hasTrailingMeta && (hasLeadingAvatar || hasLeadingIcon);

  const numberOfLines = props.lines ?? titleCount + lineCount + (hasContentText ? 1 : 0);

  const classes = [
    'mat-mdc-list-item',
    'mdc-list-item',
    activated && 'mdc-list-item--activated',
    hasLeadingAvatar && 'mdc-list-item--with-leading-avatar',
    hasLeadingIcon && 'mdc-list-item--with-leading-icon',
    hasTrailingMeta && 'mdc-list-item--with-trailing-meta',
    hasBothLeadingAndTrailing && 'mat-mdc-list-item-both-leading-and-trailing',
    !listBase.isNonInteractive && 'mat-mdc-list-item-interactive',
    animationsDisabled.value && '_mat-animation-noopable',
    disabled && 'mdc-list-item--disabled',
    numberOfLines <= 1 && 'mat-mdc-list-item-single-line',
    numberOfLines <= 1 && 'mdc-list-item--with-one-line',
    numberOfLines === 2 && 'mdc-list-item--with-two-lines',
    numberOfLines === 3 && 'mdc-list-item--with-three-lines',
    props.class,
  ].filter(Boolean) as string[];

  // aria-current="page" only for anchor variant with activated=true;
  // absent otherwise (matches upstream _getAriaCurrent).
  const ariaCurrent = as === 'a' && activated ? 'page' : undefined;

  // Native disabled attribute only reflected on button variant (matches
  // upstream `(_isButtonElement && disabled) || null`). Upstream sets this
  // via an ATTRIBUTE binding (`[attr.disabled]`), not a property binding,
  // so Angular stringifies the boolean rather than emitting a bare HTML
  // boolean attribute — the real DOM is `disabled="true"`, not
  // `disabled=""`. Match that literally rather than passing a JS boolean
  // (which Qwik renders as the bare attribute).
  const nativeDisabled = as === 'button' && disabled ? 'true' : undefined;

  // Upstream sets `type="button"` on a host `<button>` when no type
  // attribute was already specified — we never accept a custom type, so
  // this is unconditional for the button variant.
  const nativeType = as === 'button' ? 'button' : undefined;

  const treatContentAsTitle = titleCount === 0 && numberOfLines === 1;
  const unscopedClasses = [
    'mat-mdc-list-item-unscoped-content',
    hasContentText &&
      (treatContentAsTitle ? 'mdc-list-item__primary-text' : 'mdc-list-item__secondary-text'),
  ].filter(Boolean) as string[];

  // Shared across all 3 host-tag variants — mirrors upstream's single
  // `list-item.html` template reused by `mat-list-item, a[mat-list-item],
  // button[mat-list-item]`.
  const body = (
    <>
      <Slot name="avatar" />
      <Slot name="icon" />
      <span class="mdc-list-item__content">
        <Slot name="title" />
        <Slot name="line" />
        <span class={unscopedClasses}>
          <Slot />
        </span>
      </span>
      <Slot name="meta" />
      <Slot name="divider" />
      {/* A <span>, not upstream's <div>: this body is also a <button>'s content, which HTML
          restricts to phrasing content. Absolutely positioned (list.scss), so it lays out the same. */}
      <span class="mat-focus-indicator" />
    </>
  );

  const ariaDisabled: 'true' | 'false' = disabled ? 'true' : 'false';
  const sharedAttrs = {
    id: props.id,
    class: classes,
    role: props.role,
    'aria-disabled': ariaDisabled,
    'aria-label': props['aria-label'],
    'aria-labelledby': props['aria-labelledby'],
    'aria-describedby': props['aria-describedby'],
  };

  // Only attached for an item inside an interactive list — mirrors
  // upstream never constructing a `RippleRenderer`/registering its
  // trigger-event listeners at all for a non-interactive one.
  const rippleProps = isInteractive
    ? {
        onMouseDown$: rippleEvent$,
        onMouseUp$: rippleEvent$,
        onMouseLeave$: rippleEvent$,
        onTouchStart$: rippleEvent$,
        onTouchEnd$: rippleEvent$,
        onTouchCancel$: rippleEvent$,
      }
    : {};

  if (as === 'a') {
    return (
      <a
        {...sharedAttrs}
        href={props.href}
        aria-current={ariaCurrent}
        onClick$={props.onClick$}
        {...rippleProps}
      >
        {body}
      </a>
    );
  }

  if (as === 'button') {
    return (
      <button
        {...sharedAttrs}
        type={nativeType}
        disabled={nativeDisabled as unknown as boolean}
        onClick$={props.onClick$}
        {...rippleProps}
      >
        {body}
      </button>
    );
  }

  // Default: <mat-list-item> custom element.
  return (
    <mat-list-item {...sharedAttrs} onClick$={props.onClick$} {...rippleProps}>
      {body}
    </mat-list-item>
  );
});
