import {useSignal, useTask$, useVisibleTask$, type QRL, type Signal} from '@qwik.dev/core';
import {createNoopCollectionViewer, isDataSource, type DataSource} from './data-source';

/** What `useDataSourceConnection()`'s factory may return — mirrors upstream `CdkTable.dataSource`'s
 *  `DataSource<T> | Observable<T[]> | T[]` union, minus the bare-`Subscribable` case (wrap it in
 *  an `ArrayDataSource` if that's what you have — `new ArrayDataSource(mySubscribable)`). */
export type DataSourceLike<T> = DataSource<T> | readonly T[];

/**
 * Bridges a `DataSource<T>` (or a plain array) into a reactive `Signal<readonly T[]>` a
 * component can render rows from — e.g. feed it straight into `MatTable`'s existing
 * `rows` prop (`qwik-material/table`). This is how `qwik-cdk/table`/`qwik-material/table`
 * render rows from a `DataSource`-like source: by composition, through this hook, rather
 * than `MatTable` growing a `dataSource` prop itself (keeping its existing, already-tested
 * `rows: T[]` contract untouched — see `qwik-cdk/table/SYNC.md`).
 *
 * `source` is a `QRL` FACTORY, not an already-constructed `DataSource` — deliberately: a
 * `DataSource` instance has methods (closures), so it can never safely cross the Qwik
 * SSR→resume boundary as a plain prop/signal value (see `data-source.ts`'s doc comment).
 * Passing a factory lets this hook construct a FRESH instance in whichever environment
 * needs one — once synchronously during SSR (for the initial snapshot) and once more on the
 * client after resume (for the live subscription) — exactly mirroring how Angular SSR +
 * hydration already never carries a service instance across the wire either; only the
 * rendered view has to agree.
 *
 * SSR behavior: the initial snapshot is whatever the source's `connect()` emits
 * SYNCHRONOUSLY (e.g. `ArrayDataSource` always does, via `subscribableOf`). A source that
 * only emits asynchronously (e.g. one backed by a fetch) renders an empty array during SSR,
 * then fills in once the client subscribes — the same two-pass behavior Angular SSR +
 * hydration has for an async-only `DataSource`.
 *
 * ```tsx
 * const rows = useDataSourceConnection($(() => new ArrayDataSource(allRows)));
 * return <MatTable columns={columns} displayedColumns={ids} rows={toTableRows(rows.value)} />;
 * ```
 */
export function useDataSourceConnection<T>(source: QRL<() => DataSourceLike<T>>): Signal<readonly T[]> {
  const rows = useSignal<readonly T[]>([]);

  // Runs once, synchronously-as-possible, in whichever environment first renders this
  // component (SSR if SSR'd, otherwise the client's first render) — takes ONLY the
  // synchronous snapshot, then tears straight back down. No `track()`, so under SSR this
  // never re-runs on the client — the task below is what keeps rows live there.
  useTask$(async () => {
    const value = await source();
    if (Array.isArray(value)) {
      rows.value = value;
      return;
    }
    if (isDataSource(value)) {
      const viewer = createNoopCollectionViewer();
      const unsubscribe = value.connect(viewer).subscribe(next => {
        rows.value = next;
      });
      unsubscribe();
      value.disconnect(viewer);
    }
  });

  // Client-only, guaranteed to run regardless of SSR (unlike the task above, which only
  // reruns when a tracked signal changes — there is none here on purpose). Re-creates the
  // source FRESH rather than reusing whatever the task above constructed — see this
  // function's doc comment for why a `DataSource` instance must never be captured across
  // the SSR→resume boundary in the first place (same "create fresh inside the task" pattern
  // as `qwik-cdk/a11y`'s `createFocusTrap`/`createFocusMonitor`).
  useVisibleTask$(async ({cleanup}) => {
    const value = await source();
    if (Array.isArray(value)) return; // a static array has no live updates to subscribe to.
    if (!isDataSource(value)) return;
    const viewer = createNoopCollectionViewer();
    const unsubscribe = value.connect(viewer).subscribe(next => {
      rows.value = next;
    });
    cleanup(() => {
      unsubscribe();
      value.disconnect(viewer);
    });
  });

  return rows;
}
