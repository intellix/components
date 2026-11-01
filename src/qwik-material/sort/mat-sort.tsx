import {
  component$,
  Slot,
  useContext,
  useContextProvider,
  useSignal,
  type QRL,
} from '@qwik.dev/core';
import {MAT_SORT_CONFIG, type MatSortConfig} from './sort-config';
import type {Sort, SortDirection} from './sort-direction';
import {MAT_SORT_STATE, type MatSortSharedState, type MatSortTableConfig} from './sort-state';

/**
 * Props for <MatSort>. Mirrors the `[matSort]` directive
 * (src/material/sort/sort.ts) — a directive with no view/template of its
 * own, attached directly to the consumer's existing element (always
 * `<table>` in every current parity scenario, matching
 * `sort-overview-example.html`/`table-demo.html` upstream). Polymorphic `as`
 * prop, same pattern as MatBadge/MatListItem, lets consumers attach it to
 * other elements too.
 */
export interface MatSortProps {
  /** Which host tag MatSort renders. Default 'table'. */
  as?: 'table' | 'div';
  /** The id of the most recently sorted column. `matSortActive` — an
   *  INITIAL value only; thereafter MatSort self-manages this (see
   *  sort-state.ts's doc comment), matching upstream's own `active` field,
   *  which is likewise only ever re-assigned by header interaction once
   *  rendered, not by a later `[matSortActive]` re-binding in any parity
   *  scenario's template. */
  active?: string;
  /** Starting sort direction when a column is first sorted. `matSortStart`.
   *  Default 'asc'. */
  start?: SortDirection;
  /** The initial sort direction of `active`. `matSortDirection`. See `active`
   *  doc above re: initial-only. */
  direction?: SortDirection;
  /** Whether to disable the user from clearing the sort by finishing the
   *  sort direction cycle. May be overridden by a column's own
   *  `disableClear`. `matSortDisableClear`. Falls back to config, then
   *  false. */
  disableClear?: boolean;
  /** Whether sorting is disabled for every column. `matSortDisabled`.
   *  Default false. */
  disabled?: boolean;
  /** Fires whenever the active sort or direction changes. `matSortChange`. */
  onSortChange$?: QRL<(sort: Sort) => void>;
  id?: string;
  class?: string | ReadonlyArray<string>;
}

const CONFIG_DEFAULTS: MatSortConfig = {};

export const MatSort = component$<MatSortProps>(props => {
  // DEFAULTS fallback is REQUIRED — a bare useContext() throws Code 13 when
  // rendered outside <QwikMaterialProvider> (Progress Bar / Progress Spinner
  // post-mortem; see every other qwik-material config read for precedent).
  const config = useContext(MAT_SORT_CONFIG, CONFIG_DEFAULTS);

  const as = props.as ?? 'table';
  const tableStart = props.start ?? 'asc';
  // Upstream `getNextSortDirection`: `this.disableClear ?? !!this._defaultOptions?.disableClear`.
  const resolvedDisableClear = props.disableClear ?? config.disableClear ?? false;
  const tableDisabled = props.disabled ?? false;

  // Self-owned `active`/`direction` — seeded ONCE from the initial props
  // (upstream: `@Input('matSortActive') active`/`@Input('matSortDirection')
  // direction` field initializers), then only ever mutated by a header's
  // `toggleOnInteraction$` (see mat-sort-header.tsx). A lazy `useSignal`
  // initializer runs exactly once across this component's lifetime
  // regardless of how many times it re-renders, so a later re-render (e.g.
  // triggered by an unrelated ancestor) does NOT reset in-progress sort
  // state back to the original props — matching upstream, where nothing
  // ever re-assigns `this.active`/`this.direction` from the directive's own
  // inputs after construction either. CRITICAL: this component's render
  // body never READS `sortValue.value` after this line — see
  // sort-state.ts's MatSortSharedState doc comment (infinite-loop
  // post-mortem) for why that read would be unsafe.
  const sortValue = useSignal<Sort>(() => ({
    active: props.active ?? '',
    direction: props.direction ?? '',
  }));

  // OWNED by this component: overwritten with a freshly-computed object on
  // every render, no read-back of the signal's previous value (so this
  // write can never re-trigger THIS component — see the infinite-loop
  // post-mortem referenced above). <MatSortHeader> only ever reads this.
  const tableConfig = useSignal<MatSortTableConfig>(() => ({
    start: tableStart,
    disableClear: resolvedDisableClear,
    disabled: tableDisabled,
    onSortChange: props.onSortChange$,
  }));
  tableConfig.value = {
    start: tableStart,
    disableClear: resolvedDisableClear,
    disabled: tableDisabled,
    onSortChange: props.onSortChange$,
  };

  const sharedState: MatSortSharedState = {sortValue, tableConfig};
  useContextProvider(MAT_SORT_STATE, sharedState);

  const classes = ['mat-sort', props.class].filter(Boolean) as string[];

  if (as === 'div') {
    return (
      <div id={props.id} class={classes}>
        <Slot />
      </div>
    );
  }

  return (
    <table id={props.id} class={classes}>
      <Slot />
    </table>
  );
});
