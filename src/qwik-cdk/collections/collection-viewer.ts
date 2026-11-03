import type {Subscribable} from './subscribable';

/** Represents a range of numbers with a specified start and end. */
export type ListRange = {start: number; end: number};

/**
 * Interface for any component that provides a view of some data collection and wants to provide
 * information regarding the view and any changes made.
 *
 * `viewChange` is `Subscribable<ListRange>` (this package's RxJS-free
 * replacement for `Observable<ListRange>`) instead of upstream's
 * `Observable<ListRange>` — see `subscribable.ts`'s doc comment.
 */
export interface CollectionViewer {
  /**
   * A stream that emits whenever the `CollectionViewer` starts looking at a new portion of the
   * data. The `start` index is inclusive, while the `end` is exclusive.
   */
  viewChange: Subscribable<ListRange>;
}
