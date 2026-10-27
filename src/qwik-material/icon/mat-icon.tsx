import {component$, Slot, useContext} from '@builder.io/qwik';
import type {MatIconColor} from './icon-color';
import {MAT_ICON_CONFIG, MAT_ICON_DEFAULT_FONT_SET_CLASS, type MatIconConfig} from './icon-config';
import {withIconSvgAttributes} from './icon-svg-attrs';

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
  /** M2 palette color. Adds `.mat-<color>` class. */
  color?: MatIconColor;
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

  if (usingSvg) {
    return (
      <mat-icon
        id={props.id}
        class={classes}
        role="img"
        aria-hidden={ariaHidden}
        aria-label={props['aria-label']}
        data-mat-icon-type="svg"
        data-mat-icon-name={dataName}
        data-mat-icon-namespace={dataNamespace}
        dangerouslySetInnerHTML={withIconSvgAttributes(props.svgLiteral!)}
      />
    );
  }

  return (
    <mat-icon
      id={props.id}
      class={classes}
      role="img"
      aria-hidden={ariaHidden}
      aria-label={props['aria-label']}
      data-mat-icon-type="font"
      data-mat-icon-name={dataName}
      data-mat-icon-namespace={dataNamespace}
      fontIcon={fontIcon}
    >
      <Slot />
    </mat-icon>
  );
});
