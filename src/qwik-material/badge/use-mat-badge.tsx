import {component$, useContext, type JSXOutput} from '@qwik.dev/core';
import {createIdGenerator} from '@angular-community/qwik-cdk/a11y';
import type {HostProps} from '../core/host-props';
import type {MatBadgeColor} from './badge-color';
import type {MatBadgePosition} from './badge-position';
import type {MatBadgeSize} from './badge-size';
import {MAT_BADGE_CONFIG, type MatBadgeConfig} from './badge-config';
import {type MatBadgeStyleVariant, useMatBadgeStyles} from './badge-styles';
import {markSheetPlaced, serverRendering, sheetToPlace} from '../core/ssr-sheets';

/**
 * Directive-hook form of upstream's `[matBadge]` (`src/material/badge/
 * badge.ts`'s `MatBadge`) — see `qwik-material/README.md` ("Composing
 * directives") and `core/host-props.ts` for the pattern. Returns everything
 * the real directive would have contributed to the consumer's own host
 * element — `hostProps` (classes, `aria-describedby`) to spread onto the
 * host, PLUS `content` (the `.mat-badge-content` span) to place as that
 * same host's own child, wherever upstream's directive would have appended
 * it (its LAST child, after everything else already there):
 *
 * ```tsx
 * const badge = useMatBadge({content: '4'});
 * return <MatButton appearance="elevated" {...badge.hostProps} hostContent={badge.content}>Action</MatButton>;
 * ```
 *
 * Unlike `useMatMenuTrigger()`/`useMatTooltip()`, this directive never
 * needs the live host element or any event listener — upstream's
 * `[matBadge]` is purely declarative (classes + one appended child), so
 * `hostProps` here carries no `ref`/`on*$` at all.
 *
 * `<MatBadge>` (`mat-badge.tsx`) is now a thin wrapper around this hook for
 * the common case of a badge that doesn't need to be combined with ANOTHER
 * directive on the same element.
 *
 * `matBadge(props, config?)` is the same computation with the badge config
 * passed in instead of read from `MAT_BADGE_CONFIG` — for a plain function
 * that renders JSX outside any component's hook phase, where `useContext()`
 * can't be called.
 *
 * The badge CSS: `useMatBadge()` registers it (`useMatBadgeStyles()`, first,
 * like upstream's directive loading `_MatBadgeStyleLoader` in its
 * constructor) — call it as the consuming component's FIRST hook so every
 * caller shares one `<style>` (README "Component styles"). `matBadge()`
 * can't (no hook phase): the component rendering its result calls
 * `useMatBadgeStyles()` itself, first, for the badge's host classes. The
 * content element's CSS — nearly all of it — is the `content` variant,
 * registered only while the badge has content to show (a hidden, empty
 * badge is classes on its host and nothing else): by `useMatBadge()` with
 * the rest, and by `matBadge()`'s content element itself, which renders a
 * registering component beside it.
 */
export interface UseMatBadgeProps {
  /** Content shown inside `.mat-badge-content`. Empty/whitespace-only (after trim) renders
   *  NO badge-content element at all — matches upstream. */
  content?: string | number;
  /** M2 palette color. See `mat-badge.tsx`'s identical prop doc for the "no explicit prop ⇒
   *  no class, even though the conceptual default is 'primary'" upstream quirk. */
  color?: MatBadgeColor;
  /** Whether the badge overlaps its content. Defaults to config or true. */
  overlap?: boolean;
  /** Disables the badge (grays it out via `.mat-badge-disabled`). Default false. */
  disabled?: boolean;
  /** Position of the badge overlay. Defaults to config or 'above after'. */
  position?: MatBadgePosition;
  /** Message describing the decorated element — see `description`'s placement rule below. */
  description?: string;
  /** Badge size. Defaults to config or 'medium'. */
  size?: MatBadgeSize;
  /** When true, applies `.mat-badge-hidden`. Default false. */
  hidden?: boolean;
  /**
   * Whether the eventual host element is interactive/focusable — drives
   * whether `description` becomes an `aria-describedby` reference on the
   * host (upstream: `AriaDescriber`, when the host passes
   * `InteractivityChecker.isFocusable()`) or an inline
   * `<span class="cdk-visually-hidden">` inside the badge-content span
   * (upstream: the non-interactive-host path). Upstream derives this from
   * the REAL host element (`isNativeFormElement`/`isAnchorWithHref`/
   * `hasValidTabIndex`); this hook has no live element to inspect at call
   * time, so the caller states it explicitly. Default `true` — the
   * realistic case this hook exists for: a badge composed onto an
   * interactive host (`MatButton`, a native `<button>`, …). Pass `false`
   * for a badge on a plain, non-focusable `<span>`/`<div>`.
   */
  interactive?: boolean;
}

export interface MatBadgeHook {
  /** Spread onto the badge's host element. */
  hostProps: HostProps;
  /** The `.mat-badge-content` element — place as the host's own LAST child
   *  (after everything else already there), matching where upstream's
   *  directive appends it. `undefined` when there's no content to show
   *  (matches upstream: the directive never creates the span at all). */
  content: JSXOutput | undefined;
}

const DEFAULTS: MatBadgeConfig = {
  position: 'above after',
  size: 'medium',
  overlap: true,
};

/** Shared monotonic id generator — see `mat-badge.tsx`'s identical note. */
const idGenerator = createIdGenerator();

/**
 * The badge for `props`, with defaults from the nearest `useMatBadgeProvider()` (MAT_BADGE_CONFIG),
 * registering the badge CSS (`useMatBadgeStyles()`).
 */
export function useMatBadge(props: UseMatBadgeProps): MatBadgeHook {
  // During server rendering the `content` sheet goes inside the host, with the content element
  // (core/ssr-sheets.ts); in the browser here.
  useMatBadgeStyles(...(serverRendering() ? [] : matBadgeStyleVariants(props)));
  return badge(props, useContext(MAT_BADGE_CONFIG, DEFAULTS), serverRendering());
}

/**
 * Registers the badge `content` sheet where a `matBadge()` content element renders — `matBadge()`
 * has no hook phase, and its caller registered the badge CSS as its first hook without knowing
 * the content (a CMS badge's text, read after other hooks). Its own component, so the sheet takes
 * the same hook position — the same `<style>` — as everywhere else. Renders nothing.
 */
const BadgeContentStyles = component$(() => {
  useMatBadgeStyles('content');
  markSheetPlaced('badge:content');
  return null;
});

/**
 * The badge sheets a badge with these props renders, for `useMatBadgeStyles()`: `content` when it
 * shows content (`matBadge()` renders the `.mat-badge-content` element exactly then).
 */
export function matBadgeStyleVariants(
  props: Pick<UseMatBadgeProps, 'content'>,
): MatBadgeStyleVariant[] {
  return badgeContent(props) ? ['content'] : [];
}

/** The content a badge shows: `props.content` as a trimmed string, `''` for none. */
function badgeContent(props: Pick<UseMatBadgeProps, 'content'>): string {
  return props.content == null ? '' : `${props.content}`.trim();
}

/**
 * The badge `useMatBadge()` returns, computed from `config` as given instead of read from
 * MAT_BADGE_CONFIG — no hook, so callable where hooks aren't (a plain function rendering
 * JSX for a `component$`). Same `hostProps` and `content` for the same props and config. Registers
 * no CSS: the component rendering the result calls `useMatBadgeStyles()` as its first hook.
 */
export function matBadge(props: UseMatBadgeProps, config: MatBadgeConfig = DEFAULTS): MatBadgeHook {
  return badge(props, config, true);
}

/**
 * `matBadge()`; `contentStyles`: the content element brings its sheet (`BadgeContentStyles`) — in
 * the browser always, during server rendering only the first time (core/ssr-sheets.ts).
 */
function badge(
  props: UseMatBadgeProps,
  config: MatBadgeConfig,
  contentStyles: boolean,
): MatBadgeHook {
  const position = props.position ?? config.position ?? 'above after';
  const size = props.size ?? config.size ?? 'medium';
  const overlap = props.overlap ?? config.overlap ?? true;
  const disabled = props.disabled ?? false;
  const hidden = props.hidden ?? false;
  const interactive = props.interactive ?? true;

  // See the `color` prop doc above: no class unless explicitly provided.
  const colorClass = props.color ? `mat-badge-${props.color}` : undefined;

  const contentStr = badgeContent(props);
  const hasBadgeElement = !!contentStr;
  const isAbove = !position.includes('below');
  const isAfter = !position.includes('before');
  const isHidden = hidden || !contentStr;

  const classes = [
    'mat-badge',
    colorClass,
    overlap && 'mat-badge-overlap',
    isAbove ? 'mat-badge-above' : 'mat-badge-below',
    isAfter ? 'mat-badge-after' : 'mat-badge-before',
    `mat-badge-${size}`,
    isHidden && 'mat-badge-hidden',
    disabled && 'mat-badge-disabled',
  ].filter(Boolean) as string[];

  // aria-describedby is independent of badge content (matches upstream:
  // `_updateDescription` never checks `_badgeElement`).
  const describedBy =
    props.description && interactive ? idGenerator.getId('cdk-describedby-message-') : undefined;
  // The inline description is appended INTO the badge-content span, so it
  // only exists when that span exists (matches upstream: the inline node is
  // created either way, but only ever appended when `_badgeElement` exists).
  const inlineDescription =
    props.description && !interactive && hasBadgeElement ? props.description : undefined;

  const badgeContentId = hasBadgeElement ? idGenerator.getId('mat-badge-content-') : undefined;
  const element = hasBadgeElement ? (
    <span id={badgeContentId} class="mat-badge-content mat-badge-active" aria-hidden="true">
      {contentStr}
      {inlineDescription && <span class="cdk-visually-hidden">{inlineDescription}</span>}
    </span>
  ) : undefined;
  // Still the host's last child: the registration renders no element (a `<style>` at most, the
  // first time, which a page's first-hook registrations place before their instance too).
  const content =
    element && contentStyles && (!serverRendering() || sheetToPlace('badge:content')) ? (
      <>
        {element}
        <BadgeContentStyles />
      </>
    ) : (
      element
    );

  const hostProps: HostProps = {
    class: classes,
    'aria-describedby': describedBy,
  };

  return {hostProps, content};
}
