import {component$, Slot, useContext} from '@builder.io/qwik';
import type {MatIconColor} from './icon-color';
import {MAT_ICON_CONFIG, type MatIconConfig} from './icon-config';

/**
 * Props for <MatIcon>. Renders a <mat-icon> custom element in one of two
 * mutually-exclusive modes:
 *
 *   Font mode (default): <mat-icon> hosts Slot content for ligature text, or
 *   emits the `fontIcon` attribute for [fontIcon]::before glyph rendering.
 *   Class ladder includes any resolved `fontSet` class.
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
  /** Font-set class(es). Prop → config → undefined resolution. */
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
  const fontSet = cleanupFontValue(props.fontSet ?? config.fontSet);
  const fontIcon = cleanupFontValue(props.fontIcon);

  const usingSvg = !!props.svgLiteral;
  const dataName = usingSvg ? props.svgName : fontIcon;
  const dataNamespace = usingSvg ? props.svgNamespace : fontSet;
  const isPaletteColor = color === 'primary' || color === 'accent' || color === 'warn';

  const classes = [
    'mat-icon',
    'notranslate',
    color && `mat-${color}`,
    inline && 'mat-icon-inline',
    !isPaletteColor && 'mat-icon-no-color',
    !usingSvg && fontSet,
    props.class,
  ].filter(Boolean) as string[];

  const ariaHidden = props['aria-hidden'] ?? 'true';

  if (usingSvg) {
    return (
      <mat-icon
        id={props.id}
        class={classes}
        role="img"
        aria-hidden={ariaHidden as never}
        aria-label={props['aria-label']}
        data-mat-icon-type="svg"
        data-mat-icon-name={dataName}
        data-mat-icon-namespace={dataNamespace}
        dangerouslySetInnerHTML={props.svgLiteral}
      />
    );
  }

  return (
    <mat-icon
      id={props.id}
      class={classes}
      role="img"
      aria-hidden={ariaHidden as never}
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
