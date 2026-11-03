import {component$, Slot, useContext, type JSXOutput} from '@qwik.dev/core';
import type {MatIconColor} from './icon-color';
import {MAT_ICON_CONFIG, MAT_ICON_DEFAULT_FONT_SET_CLASS, type MatIconConfig} from './icon-config';
import {withIconSvgAttributes} from './icon-svg-attrs';
import {extraHostAttrs, type HostRef} from '../core/host-props';
import type {OpenString} from '../core/open-string';

/** See `button/mat-button.tsx`'s identical constant doc comment. */
const KNOWN_PROPS = new Set<string>([
  'color',
  'inline',
  'fontIcon',
  'fontSet',
  'svgLiteral',
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
 *   SVG mode (when svgLiteral is set): <mat-icon> is populated via
 *   dangerouslySetInnerHTML with the consumer-provided SVG string. No Slot
 *   content, no fontIcon attribute, no fontSet class. Consumer is
 *   responsible for the SVG string's trustworthiness (§6 deviation #4).
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
  /** Raw SVG string set via dangerouslySetInnerHTML. */
  svgLiteral?: string;
  /** Optional label for `data-mat-icon-name` in SVG mode. */
  svgName?: string;
  /** Optional label for `data-mat-icon-namespace` in SVG mode. */
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

  const color = props.color ?? config.color;
  const inline = props.inline ?? false;
  const usingSvg = !!props.svgLiteral;

  // `fontSet` here mirrors upstream's `fontSet` *input* — and therefore
  // `data-mat-icon-namespace` — which only ever reflects an explicit prop.
  // `MatIconConfig.fontSet` / the built-in default feed the class ladder only
  // (see icon-config.ts), matching MatIconRegistry.getDefaultFontSetClass()'s
  // separation from the `[attr.data-mat-icon-namespace]` host binding.
  const explicitFontSet = cleanupFontValue(props.fontSet);
  const fontIcon = cleanupFontValue(props.fontIcon);

  const dataName = usingSvg ? props.svgName : fontIcon;
  const dataNamespace = usingSvg ? props.svgNamespace : explicitFontSet;
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
        {...extraAttrs}
        dangerouslySetInnerHTML={withIconSvgAttributes(props.svgLiteral!)}
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
