import {component$, Slot, useContext, useContextProvider} from '@qwik.dev/core';
import {MAT_LIST_CONFIG, type MatListConfig} from './list-config';
import {MAT_LIST_BASE_STATE, type MatListBaseState} from './list-context';

/**
 * Shared props for the three container variants (MatList, MatNavList,
 * MatActionList). Each renders a distinct custom-element tag with its
 * own default role but the same underlying prop surface.
 */
export interface MatListProps {
  /** ARIA role passthrough. Upstream sets no default (decorative);
   *  consumers may pass "list" per list.md guidance for lists of
   *  non-interactive content. Ignored on MatNavList (always "navigation")
   *  and MatActionList (always "group"). */
  role?: string;
  /** Mirrors upstream `MatListBase.disabled`. Always reflected as
   *  `aria-disabled="true"|"false"` (upstream's `[attr.aria-disabled]`
   *  binding always stringifies, it never removes the attribute). CSS
   *  cascades disabled styling to descendant items via
   *  `.mat-mdc-list[aria-disabled='true'] .mat-mdc-list-item`. */
  disabled?: boolean;
  /** Mirrors upstream `MatListBase.disableRipple` — disables ripples for
   *  every descendant `<MatListItem>` (see `list-context.ts`'s
   *  `MatListBaseState.disableRipple`). Default `false`. */
  disableRipple?: boolean;
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
 * Props for MatSubheader. Upstream ships this as a `[mat-subheader]` /
 * `[matSubheader]` attribute directive applied to the consumer's own
 * element — no new element is introduced. Ported as a polymorphic
 * component that renders that host element itself (`as`, default `'div'`
 * — the tag used throughout the Material + parity scenarios), matching the
 * pattern `MatListItem` already uses.
 */
export interface MatSubheaderProps {
  /** Which host tag to render. Default `'div'`. */
  as?: 'div' | 'span' | 'h3';
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
  // QError_notFoundContext when rendered with no provider hook ancestor
  // (Progress Bar / Progress Spinner post-mortem).
  useContext(MAT_LIST_CONFIG, CONFIG_DEFAULTS);
  // Plain <mat-list> is non-interactive per upstream MatListBase default.
  useContextProvider(MAT_LIST_BASE_STATE, {
    isNonInteractive: true,
    disableRipple: props.disableRipple ?? false,
  } satisfies MatListBaseState);

  const classes = ['mat-mdc-list', 'mat-mdc-list-base', 'mdc-list', props.class].filter(
    Boolean,
  ) as string[];

  return (
    <mat-list
      id={props.id}
      class={classes}
      role={props.role}
      aria-disabled={props.disabled ? 'true' : 'false'}
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
  // Nav lists are interactive — items are only reachable via keyboard
  // shortcuts per MDC, so upstream opts every item into the ripple /
  // `mat-mdc-list-item-interactive` treatment. See MatNavList comment.
  useContextProvider(MAT_LIST_BASE_STATE, {
    isNonInteractive: false,
    disableRipple: props.disableRipple ?? false,
  } satisfies MatListBaseState);

  const classes = ['mat-mdc-nav-list', 'mat-mdc-list-base', 'mdc-list', props.class].filter(
    Boolean,
  ) as string[];

  return (
    <mat-nav-list
      id={props.id}
      class={classes}
      role="navigation"
      aria-disabled={props.disabled ? 'true' : 'false'}
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
  useContextProvider(MAT_LIST_BASE_STATE, {
    isNonInteractive: false,
    disableRipple: props.disableRipple ?? false,
  } satisfies MatListBaseState);

  const classes = ['mat-mdc-action-list', 'mat-mdc-list-base', 'mdc-list', props.class].filter(
    Boolean,
  ) as string[];

  return (
    <mat-action-list
      id={props.id}
      class={classes}
      role="group"
      aria-disabled={props.disabled ? 'true' : 'false'}
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

  const as = props.as ?? 'div';
  const classes = ['mat-mdc-subheader', 'mdc-list-group__subheader', props.class].filter(
    Boolean,
  ) as string[];
  const attrs = {
    id: props.id,
    class: classes,
    'aria-label': props['aria-label'],
    'aria-labelledby': props['aria-labelledby'],
    'aria-describedby': props['aria-describedby'],
  };

  if (as === 'span') {
    return (
      <span {...attrs}>
        <Slot />
      </span>
    );
  }
  if (as === 'h3') {
    return (
      <h3 {...attrs}>
        <Slot />
      </h3>
    );
  }
  return (
    <div {...attrs}>
      <Slot />
    </div>
  );
});
