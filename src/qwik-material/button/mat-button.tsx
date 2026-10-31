import {component$, Slot, useContext, $, type JSXOutput} from '@builder.io/qwik';
import {
  APPEARANCE_CLASSES,
  type MatButtonAppearance,
  type MatButtonColor,
} from './button-appearance';
import {MAT_BUTTON_CONFIG, type MatButtonConfig} from './button-config';
import {PersistentRipple} from './internal/persistent-ripple';
import {FocusIndicator} from './internal/focus-indicator';
import {TouchTarget} from './internal/touch-target';
import {rippleLoaderHostAttrs, useRippleLoader} from './internal/ripple-loader';
import {disabledAttr} from './internal/disabled-attr';
import {useFocusOrigin} from '@angular-community/qwik-cdk/a11y';
import {callHostHandler, extraHostAttrs, type HostHandler, type HostRef} from '../core/host-props';

/** Props this component already names explicitly — excluded from the generic
 *  `extraHostAttrs()` passthrough (see that prop's doc comment below). Kept
 *  as a module-level constant so it isn't rebuilt on every render. */
const KNOWN_PROPS = new Set<string>([
  'appearance',
  'color',
  'disabled',
  'disableRipple',
  'disabledInteractive',
  'href',
  'target',
  'type',
  'onClick$',
  'onMouseDown$',
  'onMouseEnter$',
  'onMouseLeave$',
  'onKeyDown$',
  'onFocusIn$',
  'onFocusOut$',
  'ariaLabel',
  'ariaDescribedBy',
  'ariaLabelledBy',
  'aria-describedby',
  'id',
  'class',
  'ref',
  'hostContent',
]);

export interface MatButtonProps {
  /** Appearance variant. Default 'text' (or provider's defaultAppearance). */
  appearance?: MatButtonAppearance;
  /** M2 palette class. Deprecated in M3 but honoured. Falls back to provider config. */
  color?: MatButtonColor;
  /** Disables the button. Renders `disabled` attr on <button> or blocks click on <a>. */
  disabled?: boolean;
  /** Adds .mat-mdc-button-ripple-disabled which hides the state-layer overlay. */
  disableRipple?: boolean;
  /** When true, disabled buttons keep focus + click reachable (tooltip-friendly). */
  disabledInteractive?: boolean;
  /** When set, renders <a href> instead of <button>. Click is prevented if disabled. */
  href?: string;
  /** Native `<a>` `target` attribute (e.g. `'_blank'`). Ignored when `href`
   *  is unset — upstream's matButton directive never restricts this
   *  attribute, it's just a plain native binding on the consumer's own
   *  `<a>`; exposed here since the host element isn't the consumer's own. */
  target?: string;
  /**
   * Native <button> type attribute. Ignored when href is set. Unset by
   * default — matches upstream, which never binds a `type`, so the attribute
   * is only rendered when the caller passes one explicitly.
   */
  type?: 'button' | 'submit' | 'reset';
  /**
   * `HostHandler`-shaped (a single QRL, or Qwik's own `QRLEventHandlerMulti`
   * array form) rather than a plain `QRL` — lets a directive hook's
   * `hostProps.onClick$` (possibly already composed with ANOTHER directive's
   * via `mergeHostProps()`) pass straight through here, still wrapped by
   * this component's own disabled-click guard (`preventDisabledClick$`
   * below, via `callHostHandler()`).
   */
  onClick$?: HostHandler<MouseEvent>;
  /** Directive-hook passthrough — see `core/host-props.ts`. Forwarded as-is
   *  onto the rendered host (no internal guard needed, unlike `onClick$`). */
  onMouseDown$?: HostHandler<MouseEvent>;
  onMouseEnter$?: HostHandler<MouseEvent>;
  onMouseLeave$?: HostHandler<MouseEvent>;
  onKeyDown$?: HostHandler<KeyboardEvent>;
  onFocusIn$?: HostHandler<FocusEvent>;
  onFocusOut$?: HostHandler<FocusEvent>;
  /** Directive-hook passthrough (e.g. `useMatMenuTrigger()`/`useMatTooltip()`
   *  needing the live element) — forwarded onto the rendered host. */
  ref?: HostRef;
  ariaLabel?: string;
  ariaDescribedBy?: string;
  ariaLabelledBy?: string;
  id?: string;
  class?: string | ReadonlyArray<string>;
  /**
   * Extra content appended as the host element's child, after
   * `TouchTarget` but BEFORE the lazily-inserted ripple span — not inside
   * `.mdc-button__label` with the rest of `<Slot/>`. Models upstream's
   * directive model, where something like `[matBadge]` attaches to the
   * consumer's own `<button matButton>` and appends its own element
   * directly onto that host, regardless of what's already inside. The
   * ordering (before, not after, the ripple span) matters and isn't
   * arbitrary: upstream's directive creates its badge-content element
   * eagerly (`ngOnInit`/`ngAfterViewInit`), well before any user
   * interaction, while `RippleRenderer`'s own span is only ever inserted
   * lazily, on the FIRST interaction — so in the real DOM the badge span is
   * always the earlier sibling once both exist. A plain Qwik component
   * can't be decorated that way from the outside (there's no "and also
   * render this after everything else already in your template" hook), so
   * this is the escape hatch — the host-component half of a directive
   * hook's `content` field (`useMatBadge(...).content`; see
   * `qwik-material/core/host-props.ts` and `qwik-material/README.md`'s
   * "Composing directives" section). Named `hostContent`, not
   * `trailingContent` (the old, badge-specific-workaround name), since any
   * directive hook's extra content uses this same prop now.
   */
  hostContent?: JSXOutput;
  /**
   * Any OTHER attribute a directive hook's `hostProps` sets that this
   * component has no dedicated named prop for (`aria-haspopup`,
   * `aria-expanded`, `aria-controls`, …) — spread directly onto the
   * rendered host via `extraHostAttrs()`. Precedence: this component's OWN
   * explicitly-named attributes (computed from the props above) always win
   * for the keys they set; everything else here passes through untouched.
   * `aria-describedby` is the one exception with its own named prop
   * (`ariaDescribedBy`) that ALSO merges with an incoming `aria-describedby`
   * extra (e.g. from `useMatTooltip()`/`useMatBadge()`) — see the
   * `describedBy` computation below.
   */
  [extraAttr: string]: unknown;
}

const DEFAULTS: MatButtonConfig = {
  color: null,
  disabledInteractive: false,
  defaultAppearance: 'text',
};

export const MatButton = component$<MatButtonProps>(props => {
  const config = useContext(MAT_BUTTON_CONFIG, DEFAULTS);
  const appearance = props.appearance ?? config.defaultAppearance ?? 'text';
  const color = props.color ?? config.color ?? null;
  const disabledInteractive = props.disabledInteractive ?? config.disabledInteractive ?? false;
  const isAnchor = props.href != null;
  const nativelyDisabled = !!props.disabled && !disabledInteractive;

  // Upstream `ngAfterViewInit(): this._focusMonitor.monitor(this._elementRef,
  // true)`. `useFocusOrigin()` is the lazy, useOn()-based replacement (see
  // qwik-cdk/a11y/focus-origin/focus-origin.ts): it attaches `on:pointerdown`
  // / `on:focusin` / `on:focusout` references to this component's own host
  // element (the <a>/<button> below) at SSR time — no JS loads or runs until
  // one of those events actually fires, unlike the old `useVisibleTask$`-based
  // `useFocusMonitor` (which loaded+ran eagerly on every resumed instance,
  // see button/SYNC.md deviation 2). `focusin` bubbles, covering focus
  // landing on a descendant for free (upstream's `checkChildren: true`) —
  // moot here since none of PersistentRipple/FocusIndicator/TouchTarget's
  // spans are focusable, but harmless.
  const focusOrigin = useFocusOrigin();

  const classes = [
    'mat-mdc-button-base',
    'mdc-button',
    ...APPEARANCE_CLASSES[appearance],
    color ? `mat-${color}` : 'mat-unthemed',
    props.disabled && 'mat-mdc-button-disabled',
    disabledInteractive && 'mat-mdc-button-disabled-interactive',
    props.disableRipple && 'mat-mdc-button-ripple-disabled',
    // Focus-origin classes — upstream FocusMonitor sets these directly via
    // classList, bypassing Angular's change detection. Derived declaratively
    // from `focusOrigin` (a real Qwik signal) here instead, same pattern as
    // qwik-material/button-toggle/mat-button-toggle.tsx: Qwik's `class` prop
    // replaces `className` wholesale on every render, so anything set
    // outside this array wouldn't survive an unrelated re-render anyway.
    focusOrigin.value && 'cdk-focused',
    focusOrigin.value === 'touch' && 'cdk-touch-focused',
    focusOrigin.value === 'keyboard' && 'cdk-keyboard-focused',
    focusOrigin.value === 'mouse' && 'cdk-mouse-focused',
    focusOrigin.value === 'program' && 'cdk-program-focused',
    props.class,
  ].filter(Boolean) as string[];

  const preventDisabledClick$ = $(async (e: MouseEvent, el: Element) => {
    if (props.disabled) {
      e.preventDefault();
      e.stopImmediatePropagation();
      return;
    }
    await callHostHandler(props.onClick$, e, el);
  });

  // Lazy, useOn()-based replacement for the old `useVisibleTask$`-based
  // ripple loader (see internal/ripple-loader.ts) — attaches to this
  // component's own host element, same as `useFocusOrigin()` above. Returns
  // a signal (not a side effect) for the same reason `useFocusOrigin()`
  // does: this component re-renders when focus changes, and that
  // reconciles the WHOLE vnode tree, so the ripple span + its host attribute
  // must come from the same declarative render rather than be mutated
  // imperatively (see useRippleLoader()'s doc comment).
  const rippleInitialized = useRippleLoader();
  const rippleAttrs = rippleLoaderHostAttrs({
    className: 'mat-mdc-button-ripple',
    disabled: props.disableRipple || props.disabled,
  });

  // See the `[extraAttr]` prop doc above.
  const extraAttrs = extraHostAttrs(props as Record<string, unknown>, KNOWN_PROPS);
  const describedBy = props.ariaDescribedBy ?? (props['aria-describedby'] as string | undefined);

  if (isAnchor) {
    return (
      <a
        ref={props.ref}
        href={props.href}
        target={props.target}
        id={props.id}
        class={classes}
        tabIndex={nativelyDisabled ? -1 : undefined}
        aria-disabled={props.disabled ? 'true' : undefined}
        aria-label={props.ariaLabel}
        aria-describedby={describedBy}
        aria-labelledby={props.ariaLabelledBy}
        onClick$={preventDisabledClick$}
        onMouseDown$={props.onMouseDown$}
        onMouseEnter$={props.onMouseEnter$}
        onMouseLeave$={props.onMouseLeave$}
        onKeyDown$={props.onKeyDown$}
        onFocusIn$={props.onFocusIn$}
        onFocusOut$={props.onFocusOut$}
        {...extraAttrs}
        {...rippleAttrs}
        mat-ripple-loader-uninitialized={rippleInitialized.value ? undefined : ''}
      >
        <PersistentRipple isFab={false} />
        <span class="mdc-button__label">
          <Slot />
        </span>
        <FocusIndicator />
        <TouchTarget />
        {props.hostContent}
        {rippleInitialized.value && <span class="mat-ripple mat-mdc-button-ripple" />}
      </a>
    );
  }

  return (
    <button
      ref={props.ref}
      type={props.type}
      id={props.id}
      class={classes}
      {...disabledAttr(nativelyDisabled)}
      aria-disabled={props.disabled && disabledInteractive ? 'true' : undefined}
      aria-label={props.ariaLabel}
      aria-describedby={describedBy}
      aria-labelledby={props.ariaLabelledBy}
      onClick$={props.onClick$}
      onMouseDown$={props.onMouseDown$}
      onMouseEnter$={props.onMouseEnter$}
      onMouseLeave$={props.onMouseLeave$}
      onKeyDown$={props.onKeyDown$}
      onFocusIn$={props.onFocusIn$}
      onFocusOut$={props.onFocusOut$}
      {...extraAttrs}
      {...rippleAttrs}
      mat-ripple-loader-uninitialized={rippleInitialized.value ? undefined : ''}
    >
      <PersistentRipple isFab={false} />
      <span class="mdc-button__label">
        <Slot />
      </span>
      <FocusIndicator />
      <TouchTarget />
      {props.hostContent}
      {rippleInitialized.value && <span class="mat-ripple mat-mdc-button-ripple" />}
    </button>
  );
});
