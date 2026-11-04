import {component$, Slot, useComputed$, useContext, type JSXOutput} from '@qwik.dev/core';
import type {MatIconColor} from './icon-color';
import {MAT_ICON_CONFIG, MAT_ICON_DEFAULT_FONT_SET_CLASS, type MatIconConfig} from './icon-config';
import {withIconSvgAttributes} from './icon-svg-attrs';
import {getNamedSvgIcon, splitIconName, useOptionalIconRegistry} from './icon-registry';
import {extraHostAttrs, type HostRef} from '../core/host-props';
import type {OpenString} from '../core/open-string';

/** See `button/mat-button.tsx`'s identical constant doc comment. */
const KNOWN_PROPS = new Set<string>([
  'color',
  'inline',
  'fontIcon',
  'fontSet',
  'svgLiteral',
  'svgIcon',
  'svgName',
  'svgNamespace',
  'aria-hidden',
  'aria-label',
  'class',
  'id',
  'ref',
  'hostContent',
]);

/**
 * Props for <MatIcon>. Renders a <mat-icon> custom element in one of two
 * mutually-exclusive modes:
 *
 *   Font mode (default): <mat-icon> hosts Slot content for ligature text, or
 *   emits the `fontIcon` attribute for [fontIcon]::before glyph rendering.
 *   Class ladder includes the resolved font-set class(es) (explicit `fontSet`
 *   prop, else `MatIconConfig.fontSet`, else upstream's registry default
 *   `material-icons mat-ligature-font`), plus `fontIcon` itself as a class
 *   when that set isn't a ligature font.
 *
 *   SVG mode (when `svgLiteral` or `svgIcon` is set — `svgLiteral` wins if
 *   both are): <mat-icon> is populated via `dangerouslySetInnerHTML`, either
 *   with the consumer-provided SVG string directly (`svgLiteral` — consumer
 *   is responsible for its trustworthiness, §6 deviation #4) or with the
 *   markup resolved by name from a `MAT_ICON_REGISTRY` ancestor
 *   (`svgIcon` — see `icon-registry.ts`). No Slot content, no fontIcon
 *   attribute, no fontSet class, in either case.
 *
 * See design spec §3 for the full rendered DOM shape.
 */
export interface MatIconProps {
  /**
   * Theme color. Adds `.mat-<color>` class. Upstream
   * (`src/material/icon/icon.ts:168`) types `color`'s setter
   * `string | null | undefined` — any value is accepted — so this prop
   * accepts any string too, while still suggesting the three palette names.
   */
  color?: OpenString<MatIconColor>;
  /** Inline sizing — applies `.mat-icon-inline`. */
  inline?: boolean;
  /** Font-icon glyph name. Emitted as `fontIcon` attribute for CSS ::before. */
  fontIcon?: string;
  /**
   * Font-set class(es). Resolution: prop → `MatIconConfig.fontSet` → upstream
   * registry default (`material-icons mat-ligature-font`). Only the explicit
   * prop value feeds `data-mat-icon-namespace`.
   */
  fontSet?: string;
  /** Raw SVG string set via dangerouslySetInnerHTML. Wins over `svgIcon` if both are set. */
  svgLiteral?: string;
  /**
   * Name of the icon to resolve from a `MAT_ICON_REGISTRY` ancestor (see
   * `icon-registry.ts`'s `useMatIconRegistryProvider`),
   * exactly like upstream's `svgIcon` Input: `"name"` for the default
   * namespace, or `"namespace:name"`. Resolved during SSR (no flash — the
   * server HTML already contains the resolved `<svg>`; works with no
   * client JS) and re-resolved on the client whenever this prop changes
   * after resume. Ignored if `svgLiteral` is also set. If no registry
   * ancestor exists, or the name can't be resolved, this logs an error
   * (via `console.error`, mirroring upstream's default `ErrorHandler`) and
   * renders nothing, same as upstream's `getNamedSvgIcon` failure path.
   */
  svgIcon?: string;
  /** Optional label for `data-mat-icon-name` in SVG mode. Only read when `svgLiteral` is set — a
   *  `svgIcon` value derives its own name (the part after a `:`, if any) automatically. */
  svgName?: string;
  /** Optional label for `data-mat-icon-namespace` in SVG mode. Only read when `svgLiteral` is
   *  set — a `svgIcon` value derives its own namespace (the part before a `:`, if any) automatically. */
  svgNamespace?: string;
  /** Overrides the default aria-hidden='true'. Pass `false` for labeled decorative-icon-as-control usage. */
  'aria-hidden'?: boolean | 'true' | 'false';
  /** aria-label for icons used as labeled controls (e.g., icon-only buttons). Pair with `aria-hidden={false}`. */
  'aria-label'?: string;
  class?: string | ReadonlyArray<string>;
  id?: string;
  /** Directive-hook passthrough (e.g. a future directive needing the live
   *  element) — forwarded onto the rendered `<mat-icon>`. See
   *  `core/host-props.ts`. */
  ref?: HostRef;
  /**
   * Extra content appended as the host `<mat-icon>`'s LAST child, after
   * the ligature-text `<Slot/>`. Models upstream's directive model, where
   * something like `[matBadge]` attaches to the consumer's own
   * `<mat-icon matBadge>` and appends its own element directly onto that
   * host. A plain Qwik component can't be decorated that way from the
   * outside, so this is the escape hatch — the host-component half of a
   * directive hook's `content` field (`useMatBadge(...).content`; see
   * `qwik-material/core/host-props.ts`). Named `hostContent`, not
   * `trailingContent` (the old, badge-specific-workaround name), since any
   * directive hook's extra content uses this same prop now. Font mode
   * only; SVG mode's `dangerouslySetInnerHTML` branch has no Slot to
   * append after and no scenario needs it there.
   */
  hostContent?: JSXOutput;
  /** Any OTHER attribute a directive hook's `hostProps` sets that this
   *  component has no dedicated named prop for — see
   *  `button/mat-button.tsx`'s identical `[extraAttr]` doc comment. */
  [extraAttr: string]: unknown;
}

const DEFAULTS: MatIconConfig = {};

function cleanupFontValue(value: string | undefined): string | undefined {
  return typeof value === 'string' ? value.trim().split(' ')[0] : value;
}

export const MatIcon = component$<MatIconProps>(props => {
  const config = useContext(MAT_ICON_CONFIG, DEFAULTS);
  const registry = useOptionalIconRegistry();

  // Called unconditionally every render (Qwik hook rule) regardless of
  // which mode this instance ends up in — see this hook's own doc comment
  // for why the common case (no `svgIcon`, or `svgLiteral` winning instead)
  // takes a plain SYNCHRONOUS return with zero async-engine overhead, and
  // only a REAL `svgIcon` lookup ever becomes a suspending async read.
  const resolvedSvgIcon = useComputed$(() => {
    const raw = props.svgIcon;
    if (props.svgLiteral || !raw) return null;
    if (!registry) {
      // eslint-disable-next-line no-console
      console.error(
        `Error retrieving icon ${raw}! No MAT_ICON_REGISTRY ancestor found — call ` +
          `useMatIconRegistryProvider() near the root of this subtree and register ` +
          `the icon first.`,
      );
      return null;
    }
    return getNamedSvgIcon(registry, raw).catch((err: Error) => {
      // eslint-disable-next-line no-console
      console.error(`Error retrieving icon ${raw}! ${err.message}`);
      return null;
    });
  });

  const color = props.color ?? config.color;
  const inline = props.inline ?? false;
  const hasLiteral = !!props.svgLiteral;
  const hasSvgIcon = !hasLiteral && !!props.svgIcon;
  const usingSvg = hasLiteral || hasSvgIcon;
  // _splitIconName (src/material/icon/icon.ts) — same throw-on-"a:b:c" behavior upstream's
  // `svgIcon` setter has, since this runs at the same point in the render (synchronously,
  // before any fetch is even attempted).
  const svgIconParts = hasSvgIcon ? splitIconName(props.svgIcon!) : undefined;

  // `fontSet` here mirrors upstream's `fontSet` *input* — and therefore
  // `data-mat-icon-namespace` — which only ever reflects an explicit prop.
  // `MatIconConfig.fontSet` / the built-in default feed the class ladder only
  // (see icon-config.ts), matching MatIconRegistry.getDefaultFontSetClass()'s
  // separation from the `[attr.data-mat-icon-namespace]` host binding.
  const explicitFontSet = cleanupFontValue(props.fontSet);
  const fontIcon = cleanupFontValue(props.fontIcon);

  // `_svgName || fontIcon` / `_svgNamespace || fontSet` (icon.ts host bindings) — an
  // unconditional fallback expression upstream never actually mode-gates; it works out the
  // same as this port's previous `usingSvg ? svgName : fontIcon` branch because `_svgName`/
  // `_svgNamespace` are always null outside SVG mode. `svgIcon`'s OWN derived name/namespace
  // (not `svgName`/`svgNamespace`, which only apply to the legacy `svgLiteral` path) feeds this
  // the same way upstream's real `_svgName`/`_svgNamespace` fields (set in `_updateSvgIcon`) do.
  const svgName = hasLiteral
    ? props.svgName
    : svgIconParts
      ? svgIconParts[1] || undefined
      : undefined;
  const svgNamespace = hasLiteral
    ? props.svgNamespace
    : svgIconParts
      ? svgIconParts[0] || undefined
      : undefined;
  const dataName = svgName ?? fontIcon;
  const dataNamespace = svgNamespace ?? explicitFontSet;
  const isPaletteColor = color === 'primary' || color === 'accent' || color === 'warn';

  // _updateFontIconClasses (src/material/icon/icon.ts): resolve the font-set
  // class list from the explicit prop, else the config default, else
  // upstream's registry default — then, unless that set includes
  // 'mat-ligature-font', also add `fontIcon` itself as a class (non-ligature
  // fonts render per-icon glyphs via a CSS class, not ligature text).
  const fontSetClasses = usingSvg
    ? []
    : (explicitFontSet ?? config.fontSet ?? MAT_ICON_DEFAULT_FONT_SET_CLASS)
        .split(/ +/)
        .filter(className => className.length > 0);
  const fontIconClass =
    !usingSvg && fontIcon && !fontSetClasses.includes('mat-ligature-font') ? fontIcon : undefined;

  const classes = [
    'mat-icon',
    'notranslate',
    color && `mat-${color}`,
    inline && 'mat-icon-inline',
    !isPaletteColor && 'mat-icon-no-color',
    fontIconClass,
    ...fontSetClasses,
    props.class,
  ].filter(Boolean) as string[];

  const ariaHidden = props['aria-hidden'] ?? 'true';
  const extraAttrs = extraHostAttrs(props as Record<string, unknown>, KNOWN_PROPS);

  if (usingSvg) {
    // Reading `.value` only here (not above, unconditionally) means a `hasLiteral` instance
    // never pulls `resolvedSvgIcon` at all — it stays uncomputed, zero async-engine cost — while
    // a REAL `svgIcon` lookup suspends this render (SSR: blocks until resolved, so the server
    // HTML already has the final markup, no flash; client: re-renders once the promise settles)
    // exactly where upstream's own `AsyncSignal`/`ComputedSignal` docs say reading a pending one
    // will. `useComputed$` is still called UNCONDITIONALLY above, every render — only the READ
    // of its `.value` is conditional, which is the live-prop-safe half (see this file's other
    // "freeze live-prop conditions" notes — reading a signal conditionally is not the same
    // hazard as calling a hook conditionally).
    const svgMarkup = hasLiteral
      ? withIconSvgAttributes(props.svgLiteral!)
      : (resolvedSvgIcon.value ?? '');
    return (
      <mat-icon
        ref={props.ref}
        id={props.id}
        class={classes}
        role="img"
        aria-hidden={ariaHidden}
        aria-label={props['aria-label']}
        data-mat-icon-type="svg"
        data-mat-icon-name={dataName}
        data-mat-icon-namespace={dataNamespace}
        // Confirmed live against the real `icon-svg` docs example: Angular's template writes
        // `<mat-icon svgIcon="thumbs-up">` with NO brackets, and Angular's compiler leaves a
        // static (non-property-bound) attribute that also matches a known `@Input` in the
        // rendered DOM as a literal attribute, in ADDITION to consuming it as the input value —
        // there's no explicit `[attr.svgIcon]` host binding in icon.ts (unlike `fontIcon`, which
        // DOES have one and is rendered unconditionally below in font mode for that reason); this
        // is purely the "static attribute syntax" behavior, and it's how virtually every
        // real-world usage (including every upstream doc example) writes a literal `svgIcon`
        // value. Reflecting it here unconditionally when set keeps this port's DOM matching that
        // common case.
        svgIcon={props.svgIcon}
        {...extraAttrs}
        dangerouslySetInnerHTML={svgMarkup}
      />
    );
  }

  return (
    <mat-icon
      ref={props.ref}
      id={props.id}
      class={classes}
      role="img"
      aria-hidden={ariaHidden}
      aria-label={props['aria-label']}
      data-mat-icon-type="font"
      data-mat-icon-name={dataName}
      data-mat-icon-namespace={dataNamespace}
      fontIcon={fontIcon}
      {...extraAttrs}
    >
      <Slot />
      {props.hostContent}
    </mat-icon>
  );
});
