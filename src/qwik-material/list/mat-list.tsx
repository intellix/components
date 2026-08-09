import {component$, Slot, useContext} from '@builder.io/qwik';
import {MAT_LIST_CONFIG, type MatListConfig} from './list-config';

/**
 * Shared props for the three container variants (MatList, MatNavList,
 * MatActionList). Each renders a distinct custom-element tag with its
 * own default role but the same underlying prop surface.
 */
export interface MatListProps {
  /** ARIA role passthrough. Upstream defaults to nothing (decorative);
   *  consumers may pass "list" per list.md guidance for lists of
   *  non-interactive content. Ignored on MatNavList (always "navigation")
   *  and MatActionList (always "group"). */
  role?: string;
  /** When true, sets aria-disabled on the container; CSS cascades disabled
   *  styling to all descendant list items via
   *  .mat-mdc-list[aria-disabled='true'] .mat-mdc-list-item — no per-item
   *  context needed. */
  disabled?: boolean;
  'aria-label'?: string;
  'aria-labelledby'?: string;
  'aria-describedby'?: string;
  class?: string | ReadonlyArray<string>;
  id?: string;
}

/** Alias interface for MatNavList. Same shape as MatListProps; the role
 *  prop is ignored (always "navigation"). */
export interface MatNavListProps extends MatListProps {}

/** Alias interface for MatActionList. Same shape as MatListProps; the role
 *  prop is ignored (always "group"). */
export interface MatActionListProps extends MatListProps {}

/**
 * Props for MatSubheader. Section title above a group of items. Upstream
 * ships this as a [matSubheader] directive; ported as a real component
 * with a <mat-subheader> custom-element tag for Qwik ergonomics.
 */
export interface MatSubheaderProps {
  'aria-label'?: string;
  'aria-labelledby'?: string;
  'aria-describedby'?: string;
  class?: string | ReadonlyArray<string>;
  id?: string;
}

const CONFIG_DEFAULTS: MatListConfig = {};

export const MatList = component$<MatListProps>(props => {
  // Read config for family-shape consistency, even though it currently
  // has no fields to resolve. The read pattern is established so future
  // config fields plug in without a component-file rewrite. DEFAULTS
  // fallback is REQUIRED — bare useContext(MAT_LIST_CONFIG) throws
  // QError_notFoundContext when rendered outside <QwikMaterialProvider>
  // (Progress Bar / Progress Spinner post-mortem).
  useContext(MAT_LIST_CONFIG, CONFIG_DEFAULTS);

  const classes = ['mat-mdc-list', 'mat-mdc-list-base', 'mdc-list', props.class].filter(
    Boolean,
  ) as string[];

  return (
    <mat-list
      id={props.id}
      class={classes}
      role={props.role}
      aria-disabled={props.disabled ? 'true' : undefined}
      aria-label={props['aria-label']}
      aria-labelledby={props['aria-labelledby']}
      aria-describedby={props['aria-describedby']}
    >
      <Slot />
    </mat-list>
  );
});

export const MatNavList = component$<MatNavListProps>(props => {
  useContext(MAT_LIST_CONFIG, CONFIG_DEFAULTS);

  const classes = ['mat-mdc-nav-list', 'mat-mdc-list-base', 'mdc-list', props.class].filter(
    Boolean,
  ) as string[];

  return (
    <mat-nav-list
      id={props.id}
      class={classes}
      role="navigation"
      aria-disabled={props.disabled ? 'true' : undefined}
      aria-label={props['aria-label']}
      aria-labelledby={props['aria-labelledby']}
      aria-describedby={props['aria-describedby']}
    >
      <Slot />
    </mat-nav-list>
  );
});

export const MatActionList = component$<MatActionListProps>(props => {
  useContext(MAT_LIST_CONFIG, CONFIG_DEFAULTS);

  const classes = ['mat-mdc-action-list', 'mat-mdc-list-base', 'mdc-list', props.class].filter(
    Boolean,
  ) as string[];

  return (
    <mat-action-list
      id={props.id}
      class={classes}
      role="group"
      aria-disabled={props.disabled ? 'true' : undefined}
      aria-label={props['aria-label']}
      aria-labelledby={props['aria-labelledby']}
      aria-describedby={props['aria-describedby']}
    >
      <Slot />
    </mat-action-list>
  );
});

export const MatSubheader = component$<MatSubheaderProps>(props => {
  useContext(MAT_LIST_CONFIG, CONFIG_DEFAULTS);

  const classes = ['mat-mdc-subheader', 'mdc-list-group__subheader', props.class].filter(
    Boolean,
  ) as string[];

  return (
    <mat-subheader
      id={props.id}
      class={classes}
      aria-label={props['aria-label']}
      aria-labelledby={props['aria-labelledby']}
      aria-describedby={props['aria-describedby']}
    >
      <Slot />
    </mat-subheader>
  );
});
