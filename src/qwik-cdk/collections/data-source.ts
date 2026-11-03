import type {CollectionViewer} from './collection-viewer';
import type {Subscribable} from './subscribable';

/**
 * Port of `src/cdk/collections/data-source.ts`. `connect()` returns this
 * package's `Subscribable<readonly T[]>` (see `subscribable.ts`) instead of
 * upstream's `Observable<readonly T[]>` — qwik-cdk has no RxJS dependency.
 *
 * Kept as an upstream-shaped `abstract class` (not a plain interface) so a
 * consumer can `extends DataSource<T>` exactly like upstream, and so
 * `isDataSource()` below has the same duck-typed detection upstream uses.
 * **Not** meant to be stored inside a Qwik `Signal`/`Store`/context value —
 * like any object with methods, it isn't serializable across the SSR→resume
 * boundary (see this package's top-level docs on the pitfall). A `DataSource`
 * instance should be constructed fresh by whichever environment needs it
 * (SSR render pass, client resume), exactly the way Angular SSR + hydration
 * already does NOT carry a `DataSource` instance across the wire either —
 * only the rendered view needs to match. `use-data-source-connection.ts`'s
 * `useDataSourceConnection()` hook is the Qwik-safe way to consume one from a
 * component (it accepts a `QRL` factory, constructing a fresh instance in
 * each environment, instead of accepting an already-built instance as a
 * prop).
 */
export abstract class DataSource<T> {
  /**
   * Connects a collection viewer (such as a data-table) to this data source. Note that
   * the stream provided will be accessed during change detection and should not directly change
   * values that are bound in template views.
   * @param collectionViewer The component that exposes a view over the data provided by this
   *     data source.
   * @returns A `Subscribable` that emits a new value when the data changes.
   */
  abstract connect(collectionViewer: CollectionViewer): Subscribable<readonly T[]>;

  /**
   * Disconnects a collection viewer (such as a data-table) from this data source. Can be used
   * to perform any clean-up or tear-down operations when a view is being destroyed.
   *
   * @param collectionViewer The component that exposes a view over the data provided by this
   *     data source.
   */
  abstract disconnect(collectionViewer: CollectionViewer): void;
}

/** Checks whether an object is a data source. */
export function isDataSource(value: unknown): value is DataSource<unknown> {
  // Check if the value is a DataSource by observing if it has a connect function. Cannot
  // be checked as an `instanceof DataSource` since people could create their own sources
  // that match the interface, but don't extend DataSource.
  return !!value && typeof (value as DataSource<unknown>).connect === 'function';
}

/**
 * A default, no-op `CollectionViewer` for callers that don't need to report
 * a viewed range (e.g. `useDataSourceConnection()` when the table doesn't do
 * its own virtualization — matches upstream callers that pass the component
 * itself as the viewer purely for identity/cleanup bookkeeping).
 */
export function createNoopCollectionViewer(): CollectionViewer {
  return {
    viewChange: {
      subscribe() {
        return () => {};
      },
    },
  };
}
