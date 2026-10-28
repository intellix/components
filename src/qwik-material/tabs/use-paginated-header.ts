import {$, useSignal, useVisibleTask$, type QRL, type Signal} from '@builder.io/qwik';
import {
  clampScrollDistance,
  getMaxScrollDistance,
  isPaginationEnabled,
  scrollAmount,
  translateXForScrollDistance,
} from './pagination-math';

export interface PaginatedHeaderState {
  /** `mat-mdc-tab-header-pagination-controls-enabled` on the header root. */
  showPaginationControls: Signal<boolean>;
  /** `mat-mdc-tab-header-pagination-disabled` on the "before" chevron. */
  disableScrollBefore: Signal<boolean>;
  /** `mat-mdc-tab-header-pagination-disabled` on the "after" chevron. */
  disableScrollAfter: Signal<boolean>;
  /** `translateX(Npx)` to set as the inline `transform` on `.mat-mdc-tab-list`.
   *  `undefined` only when `disablePagination` is true (upstream never sets
   *  the style at all in that case — see `recalc`/`scroll` below). */
  translateX: Signal<number | undefined>;
  /** Scrolls one third of the viewport in `direction` (`_scrollHeader`). */
  scroll: QRL<(direction: 'before' | 'after') => void>;
}

/**
 * Qwik port of `MatPaginatedTabHeader`'s pagination/scroll-position state
 * (`src/material/tabs/paginated-tab-header.ts`), shared by the tab-group
 * header and `MatTabNav`. Pure index math lives in `pagination-math.ts`;
 * this hook is the thin DOM-measuring layer around it.
 *
 * `headerRootRef` is the component's own host element (`<mat-tab-header>` /
 * `<nav mat-tab-nav-bar>` — matches `_checkPaginationEnabled()`'s
 * `this._elementRef.nativeElement.offsetWidth`). `tabListContainerRef` is
 * `.mat-mdc-tab-label-container` / `.mat-mdc-tab-link-container` (matches
 * `_scrollHeader`/`_getMaxScrollDistance`'s `_tabListContainer`).
 * `tabListInnerRef` is `.mat-mdc-tab-labels` / `.mat-mdc-tab-links` (matches
 * `_tabListInner`, whose `scrollWidth` is the full unclipped content width).
 *
 * The initial measurement is a justified, commented exception to "no
 * per-instance `useVisibleTask$`" (design doc rule 7): upstream itself only
 * computes real pagination/scroll-position state via `afterNextRender`,
 * which is equally a mount-time, non-interaction-driven measurement — there
 * is no user interaction to lazily hang this on, and the measured state
 * (pagination chevrons enabled/disabled, the unconditional `translateX`)
 * must be correct at first paint for ANY tab count, not just an overflowing
 * one (angular-parity.spec.ts note 1).
 */
export function usePaginatedHeader(
  headerRootRef: Signal<HTMLElement | undefined>,
  tabListContainerRef: Signal<HTMLElement | undefined>,
  tabListInnerRef: Signal<HTMLElement | undefined>,
  disablePagination: boolean,
): PaginatedHeaderState {
  const showPaginationControls = useSignal(false);
  const disableScrollBefore = useSignal(true);
  const disableScrollAfter = useSignal(true);
  const translateX = useSignal<number | undefined>(disablePagination ? undefined : 0);
  const scrollDistance = useSignal(0);

  /** Mirrors `updatePagination()`: `_checkPaginationEnabled()` +
   *  `_checkScrollingControls()` + `_updateTabScrollPosition()`. */
  const recalc = $(() => {
    const headerRoot = headerRootRef.value;
    const container = tabListContainerRef.value;
    const inner = tabListInnerRef.value;
    if (!headerRoot || !container || !inner) return;
    if (disablePagination) {
      showPaginationControls.value = false;
      disableScrollBefore.value = true;
      disableScrollAfter.value = true;
      // Upstream's `_updateTabScrollPosition()` returns before touching the
      // style at all when pagination is disabled — no inline transform.
      translateX.value = undefined;
      return;
    }

    const enabled = isPaginationEnabled(inner.scrollWidth, headerRoot.offsetWidth);
    showPaginationControls.value = enabled;
    if (!enabled) scrollDistance.value = 0;

    const max = getMaxScrollDistance(inner.scrollWidth, container.offsetWidth);
    disableScrollBefore.value = scrollDistance.value === 0;
    disableScrollAfter.value = scrollDistance.value === max;
    translateX.value = translateXForScrollDistance(scrollDistance.value);
  });

  const scroll = $((direction: 'before' | 'after') => {
    const container = tabListContainerRef.value;
    const inner = tabListInnerRef.value;
    if (!container || !inner || disablePagination) return;
    const amount = scrollAmount(direction, container.offsetWidth);
    const max = getMaxScrollDistance(inner.scrollWidth, container.offsetWidth);
    const next = clampScrollDistance(scrollDistance.value + amount, max);
    scrollDistance.value = next;
    disableScrollBefore.value = next === 0;
    disableScrollAfter.value = next === max;
    translateX.value = translateXForScrollDistance(next);
  });

  // See the doc comment above: mirrors upstream's `afterNextRender(realign)`.
  // `document-ready` (rather than the default intersection-observer
  // strategy) runs this as early as the client script can, minimizing the
  // window where a snapshot could observe pre-measurement state.
  // eslint-disable-next-line qwik/no-use-visible-task
  useVisibleTask$(
    () => {
      recalc();
    },
    {strategy: 'document-ready'},
  );

  return {showPaginationControls, disableScrollBefore, disableScrollAfter, translateX, scroll};
}
