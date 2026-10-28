import {
  $,
  component$,
  Slot,
  useContext,
  useOn,
  useSignal,
  type QRL,
  type Signal,
} from '@builder.io/qwik';
import {useFocusOrigin, useIdGenerator} from '@angular-community/qwik-cdk/a11y';
import {useAnimationsDisabled} from '../dialog/use-animations-disabled';
import {MAT_SORT_CONFIG, type MatSortConfig, type SortHeaderArrowPosition} from './sort-config';
import type {Sort, SortDirection} from './sort-direction';
import {
  MAT_SORT_STATE,
  MAT_SORT_TABLE_CONFIG_DEFAULTS,
  computeNextSort,
  isSorted,
  readSortState,
  type MatSortSharedState,
} from './sort-state';

/**
 * Fallback for a <MatSortHeader> rendered with no <MatSort> ancestor — not
 * frozen (unlike `useAnimationsDisabled`'s read-only default) because
 * `toggleOnInteraction$` unconditionally writes `sortValue.value` on a
 * successful toggle; a frozen object would throw on that assignment in
 * strict-mode module code. A standalone header harmlessly mutates this
 * orphan pair of signals instead (no shared ancestor to reach — see
 * SYNC.md deviation #1; no parity scenario exercises this path).
 */
const _SORT_STATE_FALLBACK: MatSortSharedState = {
  sortValue: {value: {active: '', direction: ''}} as Signal<Sort>,
  tableConfig: {value: MAT_SORT_TABLE_CONFIG_DEFAULTS} as Signal<
    typeof MAT_SORT_TABLE_CONFIG_DEFAULTS
  >,
};

/**
 * Props for <MatSortHeader>. Mirrors the `[mat-sort-header]` component
 * (src/material/sort/sort-header.ts + sort-header.html) — renders the `<th>`
 * itself as its own host (`ViewEncapsulation.None`, no wrapper element),
 * exactly like upstream attaching the component selector directly to the
 * consumer's `<th>`. See design spec §3.1/§5 rule 4.
 */
export interface MatSortHeaderProps {
  /** Id of this column. Required — upstream's `@Input('mat-sort-header')
   *  id!: string` has no default (the CdkColumnDef fallback is N/A here,
   *  no cdk-table integration in this port). */
  id: string;
  /** Position of the arrow that displays when sorted. Falls back to
   *  config, then 'after'. */
  arrowPosition?: SortHeaderArrowPosition;
  /** Overrides the table's `start` for this column only. */
  start?: SortDirection;
  /** Whether this column is disabled. Combines with the table's own
   *  `disabled` via OR — either one disables this header. */
  disabled?: boolean;
  /**
   * Message upstream's `AriaDescriber` would associate with the inner
   * container's `aria-describedby` (default 'Sort'). Accepted for API
   * parity with upstream's `sortActionDescription` input; this port always
   * generates the `aria-describedby`/id pair (see `describedById` below)
   * but does not render an actual message node — the real node
   * AriaDescriber injects lives in `<body>`, outside the compared subtree,
   * and the harness normalizes every `cdk-describedby-message-*` id token
   * to the same bare token regardless of the underlying text (see
   * angular-parity.spec.ts behavior #1 and SYNC.md deviation #2). The prop
   * exists so a consumer migrating from Angular keeps the same call site.
   */
  sortActionDescription?: string;
  /** Overrides the table's `disableClear` for this column only. */
  disableClear?: boolean;
  class?: string | ReadonlyArray<string>;
}

const CONFIG_DEFAULTS: MatSortConfig = {};

export const MatSortHeader = component$<MatSortHeaderProps>(props => {
  const config = useContext(MAT_SORT_CONFIG, CONFIG_DEFAULTS);
  // Standalone fallback (no <MatSort> ancestor) renders inert rather than
  // throwing upstream's getSortHeaderNotContainedWithinSortError() — see
  // sort-state.ts's doc comment on MatSortSharedState and SYNC.md
  // deviation #1. The fallback MUST carry the same two-Signal shape as the
  // real context value (Progress Bar / Progress Spinner post-mortem
  // precedent, extended to this split-signal shape).
  const sortState = useContext(MAT_SORT_STATE, _SORT_STATE_FALLBACK);

  const idGen = useIdGenerator();
  // Stable for this header's lifetime — upstream's AriaDescriber mints (or
  // reuses, for identical text) one id per description and keeps it fixed
  // until the text changes; a lazy signal initializer gives the same
  // "assigned once, not on every re-render" behavior here. The exact digits
  // are irrelevant for parity: the harness normalizes any
  // `cdk-describedby-message-*` id token to the bare prefix regardless of
  // value (see material-parity.ts) — same approach as badge's `describedBy`.
  const describedById = useSignal(() => idGen.getId('cdk-describedby-message-'));

  const animationsDisabled = useAnimationsDisabled();

  // `useFocusOrigin()` attaches to THIS component's own host element — the
  // `<th>` returned below, exactly matching upstream's
  // `this._focusMonitor.monitor(this._elementRef, true)` where `_elementRef`
  // IS the `<th>` host (component selector `[mat-sort-header]`,
  // `ViewEncapsulation.None`, no separate wrapper tag). Drives the generic
  // `cdk-focused`/`cdk-*-focused` classes FocusMonitor applies to any
  // monitored element — see design doc rule 7 / shared infra section.
  const focusOrigin = useFocusOrigin();

  /**
   * Indicates which direction was just cleared, for the
   * `mat-sort-header-recently-cleared-*` animation class. Upstream:
   * `_recentlyCleared` signal, set explicitly by `_toggleOnInteraction()`
   * and reset by the FocusMonitor subscription (on ANY origin change — a
   * focus OR a blur) or `(mouseleave)`. See angular-parity.spec.ts's header
   * comment (behavior #3) for why no timer/polling is needed: clearing is
   * tied entirely to these triggers, never to elapsed time.
   *
   * Only `focusout` (losing focus) is wired as a reset trigger here —
   * deliberately NOT `focusin` (gaining focus), even though upstream's
   * FocusMonitor subscription fires on both. Reasoning, found via a real
   * bug (see "a real bug found and fixed" in SYNC.md): `useFocusOrigin()`
   * already attaches its OWN `focusin` listener to this same host (for the
   * `cdk-focused` classes), and a SEPARATE `useOn('focusin', ...)` reset
   * listener here would be a SECOND, independently-chunked handler for the
   * SAME event as the one that ALSO carries `toggleOnInteraction$` (bound
   * to `click`, a DIFFERENT event dispatched immediately after). Native
   * browser order is `focusin` → `click`, but Qwik resolves each event's
   * QRL chunk(s) via its own `import()`, and when `focusin` already has
   * TWO qrls queued (useFocusOrigin's + this reset), `click`'s chunk can
   * finish loading and execute BEFORE `focusin`'s second (queued-behind-
   * the-first) qrl does — inverting the effective order and letting a
   * stale-focus reset silently overwrite the SAME interaction's own
   * explicit set. Confirmed live against the real Angular app
   * (`initial-active-direction`'s first click — gaining focus AND clearing
   * in the same gesture) that the explicit set must win, and confirmed
   * empirically here that `focusin`-based resetting cannot reliably
   * guarantee that. No parity scenario ever needs a GAIN-focus reset
   * (recentlyCleared is already null whenever a header gains fresh focus
   * for any reason unrelated to its own click); every scenario that needs
   * a reset is a LOSE-focus case (tabbing/clicking to a DIFFERENT header),
   * which has no such race — the losing header's own `focusout` and the
   * gaining header's `click` mutate independent signals, so whichever
   * finishes first, the final state of each is still correct.
   */
  const recentlyCleared = useSignal<SortDirection | null>(null);
  useOn(
    'focusout',
    $(() => {
      recentlyCleared.value = null;
    }),
  );

  const current = readSortState(sortState);
  const headerIsDisabled = current.disabled || (props.disabled ?? false);
  const sorted = isSorted(current, props.id);
  const ariaSort = !sorted ? 'none' : current.direction === 'asc' ? 'ascending' : 'descending';
  // Upstream `_renderArrow()`: `!this._isDisabled() || this._isSorted()`.
  const renderArrow = !headerIsDisabled || sorted;
  const arrowPosition = props.arrowPosition ?? config.arrowPosition ?? 'after';

  /**
   * Upstream `MatSortHeader._toggleOnInteraction()`. Reads `sortState`'s two
   * signals (via `readSortState()`) and `props.*` LIVE inside this `$()`
   * closure (not pre-extracted outer-scope consts) — a plain-value capture
   * would freeze at THIS render's values forever once qwikloader resumes
   * the serialized closure client-side, exactly the stale-capture bug
   * already found and fixed in MatButtonToggleGroup/MatSlideToggle's click
   * handlers (see their SYNC.md entries). `sortState` itself (the two
   * Signal references it carries) is safe to capture directly — Signals
   * are stable, serializable references; mutating `sortState.sortValue.value`
   * here is this header reaching into its parent `<MatSort>`'s own shared
   * state, the same thing upstream's `this._sort.sort(this)` does by
   * calling a method on the injected `MatSort` instance.
   */
  const toggleOnInteraction$ = $(async () => {
    const liveState = readSortState(sortState);
    const isDisabled = liveState.disabled || (props.disabled ?? false);
    if (isDisabled) return;
    const wasSorted = isSorted(liveState, props.id);
    const prevDirection = liveState.direction;
    const next = computeNextSort(
      liveState,
      {id: props.id, start: props.start, disableClear: props.disableClear},
      liveState.start,
      liveState.disableClear,
    );
    // Writes ONLY the self-owned `sortValue` signal — never `tableConfig`
    // (that one belongs to <MatSort>; see sort-state.ts's infinite-loop
    // post-mortem for why the two must stay separate).
    sortState.sortValue.value = next;
    const nowSorted = isSorted(next, props.id);
    recentlyCleared.value = wasSorted && !nowSorted ? prevDirection : null;
    const onSortChange = liveState.onSortChange;
    if (onSortChange) {
      await onSortChange.resolve();
      onSortChange(next);
    }
  });

  // Upstream `_handleKeydown()`: SPACE || ENTER triggers the same toggle,
  // with `preventDefault()` (keeps the page from scrolling on Space).
  const onKeyDown$: QRL<(event: KeyboardEvent) => void> = $(async (event: KeyboardEvent) => {
    if (event.key === ' ' || event.key === 'Enter') {
      event.preventDefault();
      await toggleOnInteraction$();
    }
  });

  const onMouseLeave$ = $(() => {
    recentlyCleared.value = null;
  });

  // Host (`<th>`) classes — upstream host bindings `[class.mat-sort-header-
  // disabled]` + FocusMonitor's generic classes (applied to the monitored
  // element, which IS this `<th>`, not the inner container).
  const thClasses = [
    'mat-sort-header',
    headerIsDisabled && 'mat-sort-header-disabled',
    focusOrigin.value && 'cdk-focused',
    focusOrigin.value === 'touch' && 'cdk-touch-focused',
    focusOrigin.value === 'keyboard' && 'cdk-keyboard-focused',
    focusOrigin.value === 'mouse' && 'cdk-mouse-focused',
    focusOrigin.value === 'program' && 'cdk-program-focused',
    props.class,
  ].filter(Boolean) as string[];

  // Inner `.mat-sort-header-container` classes — ported verbatim from
  // sort-header.html. Note `mat-sort-header-ascending`/`-descending` bind to
  // the TABLE's current direction, not to whether THIS header is sorted
  // (angular-parity.spec.ts behavior #2) — intentionally reads
  // `current.direction`, not a per-header value.
  const containerClasses = [
    'mat-sort-header-container',
    'mat-focus-indicator',
    sorted && 'mat-sort-header-sorted',
    arrowPosition === 'before' && 'mat-sort-header-position-before',
    current.direction === 'desc' && 'mat-sort-header-descending',
    current.direction === 'asc' && 'mat-sort-header-ascending',
    recentlyCleared.value === 'asc' && 'mat-sort-header-recently-cleared-ascending',
    recentlyCleared.value === 'desc' && 'mat-sort-header-recently-cleared-descending',
    animationsDisabled.value && 'mat-sort-header-animations-disabled',
  ].filter(Boolean) as string[];

  return (
    <th
      // `mat-sort-header` mirrors Angular's bare directive-selector
      // attribute (`<th mat-sort-header="name">`) left on the rendered DOM.
      // It is a CONSUMER_SELECTOR_ATTRS entry in the parity harness (ignored
      // for the structural diff — material-parity.ts), but the harness's
      // own Playwright steps (`header()` in angular-parity.spec.ts) locate
      // headers via `th[mat-sort-header]` on BOTH pages, so it must still be
      // rendered here for the test's click/keyboard steps to find the right
      // element — cast past the intrinsic `th` type since it's not a
      // recognized HTML attr, same pattern as slide-toggle's `mat-ripple`.
      {...({'mat-sort-header': props.id} as Record<string, string>)}
      class={thClasses}
      aria-sort={ariaSort}
      onClick$={toggleOnInteraction$}
      onKeyDown$={onKeyDown$}
      onMouseLeave$={onMouseLeave$}
    >
      <div
        class={containerClasses}
        tabIndex={headerIsDisabled ? undefined : 0}
        role={headerIsDisabled ? undefined : 'button'}
        aria-describedby={describedById.value}
      >
        <div class="mat-sort-header-content">
          <Slot />
        </div>
        {renderArrow && (
          <div class="mat-sort-header-arrow">
            {/* Upstream projects `<ng-content select="[matSortHeaderIcon]">`
                here with this SVG as fallback content. A Qwik named
                `<Slot name="matSortHeaderIcon">` with inline fallback
                children did NOT render its fallback in this project's
                installed @builder.io/qwik@1.20.0 when no consumer provided
                matching content (verified live via the dev-app: the slot
                comment markers rendered with nothing between them) — so the
                default arrow is rendered unconditionally instead. No parity
                scenario provides a custom icon; see SYNC.md deviation #3. */}
            <svg viewBox="0 -960 960 960" focusable="false" aria-hidden="true">
              <path d="M440-240v-368L296-464l-56-56 240-240 240 240-56 56-144-144v368h-80Z" />
            </svg>
          </div>
        )}
      </div>
    </th>
  );
});
