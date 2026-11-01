import {component$, useContext} from '@qwik.dev/core';
import {MAT_DIVIDER_CONFIG, type MatDividerConfig} from './divider-config';

/**
 * Props for <MatDivider>. Renders a self-closing <mat-divider> custom
 * element with role="separator" and aria-orientation reflecting the
 * `vertical` prop. See design spec §3.1 for rendered DOM shape.
 */
export interface MatDividerProps {
  /** Renders as a vertical divider (right border) instead of horizontal (top border). */
  vertical?: boolean;
  /** Applies inset margin (80px start-side, RTL-aware). */
  inset?: boolean;
  'aria-label'?: string;
  'aria-labelledby'?: string;
  'aria-describedby'?: string;
  class?: string | ReadonlyArray<string>;
  id?: string;
}

const DEFAULTS: MatDividerConfig = {};

export const MatDivider = component$<MatDividerProps>(props => {
  // Read config for family-shape consistency, even though it currently has
  // no fields to resolve. The read pattern is established so future config
  // fields plug in without a component-file rewrite.
  useContext(MAT_DIVIDER_CONFIG, DEFAULTS);

  const vertical = props.vertical ?? false;
  const inset = props.inset ?? false;

  const classes = [
    'mat-divider',
    vertical ? 'mat-divider-vertical' : 'mat-divider-horizontal',
    inset && 'mat-divider-inset',
    props.class,
  ].filter(Boolean) as string[];

  return (
    <mat-divider
      id={props.id}
      class={classes}
      role="separator"
      aria-orientation={vertical ? 'vertical' : 'horizontal'}
      aria-label={props['aria-label']}
      aria-labelledby={props['aria-labelledby']}
      aria-describedby={props['aria-describedby']}
    />
  );
});
