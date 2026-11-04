import {
  component$,
  Slot,
  useContext,
  useContextProvider,
  useSignal,
  useStore,
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
  /**
   * The id of the most recently sorted column. `matSortActive`. LIVE —
   * mirrors upstream's plain mutable `active` field: Angular's template
   * binding (`[matSortActive]="x"`) re-assigns `this.active` on every
   * change-detection cycle where the BOUND EXPRESSION's value differs from
   * what it last wrote, independent of whatever `MatSortHeader.sort()`
   * (a click) may have separately mutated it to since. This prop follows
   * the identical rule: `<MatSort>` re-applies `active`/`direction` to its
   * internal sort state ONLY when ITS OWN prop value has changed since the
   * last time this component last observed it — a header-driven change
   * (`toggleOnInteraction$`, writing `sortValue.value` directly) is never
   * clobbered by an unrelated re-render that re-passes the SAME `active`/
   * `direction` prop values it had before. Programmatically changing this
   * prop does NOT emit `onSortChange$` — matches upstream, where
   * `ngOnChanges()` only calls `_stateChanges.next()` (a private
   * change-notification Subject `MatSortHeader` doesn't even subscribe to
   * for `sortChange` purposes), never `sortChange.emit()` — only `sort()`
   * (called by a header's click/keydown, or directly by a consumer holding
   * a `MatSort` instance) emits that. See `computeNextSort()`/
   * `getNextSortDirection()` (re-exported from `public-api.ts`) for the
   * pure-function equivalent of calling `sort(sortable)` programmatically:
   * compute the next `Sort`, assign it to the signal you pass as `active`/
   * `direction` here, AND fire your own `onSortChange$`-equivalent
   * side-effect yourself (this port doesn't emit on your behalf for a
   * props-driven change, matching upstream exactly). */
  active?: string;
  /** Starting sort direction when a column is first sorted. `matSortStart`.
   *  Default 'asc'. */
  start?: SortDirection;
  /** The sort direction of the currently-active column. `matSortDirection`.
   *  LIVE — see `active`'s doc comment above for the full behavior. */
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
  // rendered with no provider hook ancestor (Progress Bar / Progress Spinner
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

  // Tracks the LAST `active`/`direction` prop VALUES this component itself
  // observed (never `sortValue.value` — this component's render body must
  // never read that signal; see the CRITICAL note above) — the "last bound
  // value" half of Angular's own input-binding dirty check. Guarded: only
  // write `sortValue.value` (below) when `props.active`/`props.direction`
  // genuinely differ from what was last seen HERE, so an unrelated
  // re-render that re-passes the SAME prop values never clobbers a header-
  // driven change. Safe from the infinite-loop class of bug documented in
  // sort-state.ts (`MatSortSharedState`'s doc comment) for the same reason
  // `mat-stepper.tsx`'s `ariaDisabledQuirk` store is: this is a plain,
  // internally-consistent read+conditionally-write of a store THIS
  // component owns, not an unconditional read-then-rewrite of the shared
  // signal another component also subscribes to.
  const lastSeenProps = useStore(() => ({
    active: props.active ?? '',
    direction: props.direction ?? '',
  }));
  if (
    (props.active ?? '') !== lastSeenProps.active ||
    (props.direction ?? '') !== lastSeenProps.direction
  ) {
    lastSeenProps.active = props.active ?? '';
    lastSeenProps.direction = props.direction ?? '';
    sortValue.value = {active: lastSeenProps.active, direction: lastSeenProps.direction};
  }

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
