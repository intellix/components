import {
  component$,
  Slot,
  useContext,
  useContextProvider,
  useSignal,
  type QRL,
} from '@builder.io/qwik';
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

/**
 * Upstream's own demos (`sort-overview-example.html`, `table-demo.html`) —
 * and every parity scenario here — write `<table matSort><tr>...</tr></table>`
 * with NO explicit `<tbody>`. Angular's dev-app renders via its own Renderer2
 * (`createElement`/`appendChild` DOM calls, not HTML-string parsing), so its
 * LIVE DOM keeps `<table>` → `<tr>` directly — confirmed live, no `<tbody>`
 * ever appears. Qwik's SSR, by contrast, emits a real HTML string that the
 * BROWSER parses on load, and the HTML5 tree-construction algorithm
 * unconditionally inserts an implicit `<tbody>` the instant it sees a bare
 * `<tr>` start tag while the insertion mode is "in table" / "in table body"
 * (WHATWG HTML spec, never skippable — confirmed live: Qwik's parsed DOM has
 * `<table><tbody><tr>...`). This is a structural SSR-vs-CSR browser-parsing
 * asymmetry, not a Qwik or qwik-material bug — every string-based SSR
 * framework has the identical quirk, which is exactly why React warns about
 * "validateDOMNesting" for bare `<tr>`s. It cannot be prevented by changing
 * what HTML we emit (any valid `<table><tr>` text triggers it); it can only
 * be corrected AFTER the browser parses it. A plain inline `<script>` — not
 * a Qwik QRL, zero extra network request, runs synchronously as the parser
 * reaches it (same HTML-parsing pass, before qwikloader even attaches) —
 * un-wraps the implicit `<tbody>` it is nested inside, restoring the exact
 * `<table>` → `<tr>` shape Angular's CSR produces. See SYNC.md deviation #4.
 */
const UNWRAP_IMPLICIT_TBODY_JS =
  '(function(){var s=document.currentScript,tb=s&&s.closest("tbody"),t=tb&&tb.parentNode;' +
  's.remove();if(tb&&t){while(tb.firstChild)t.insertBefore(tb.firstChild,tb);t.removeChild(tb);}})();';

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
      <script dangerouslySetInnerHTML={UNWRAP_IMPLICIT_TBODY_JS} />
    </table>
  );
});
