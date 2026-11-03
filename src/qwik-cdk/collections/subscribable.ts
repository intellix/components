/**
 * Minimal replacement for an RxJS `Observable<T>` used throughout this entry
 * point (`DataSource.connect()`, `CollectionViewer.viewChange`) — qwik-cdk has
 * no RxJS dependency (same convention as `ListKeyManager`'s `onChange(cb)` /
 * `FocusMonitor`'s callback-subscription sets elsewhere in this package).
 *
 * A `Subscribable<T>` may call its observer synchronously, zero or more times,
 * from inside `subscribe()` itself (mirroring RxJS's `of(value)` / a
 * `BehaviorSubject`'s replay-on-subscribe behavior — `ArrayDataSource` relies
 * on exactly this for its "renders correctly during SSR" contract: a plain
 * array source must hand back its one-and-only value the instant something
 * subscribes, with no microtask delay, so the subscriber can read it inside
 * the SAME synchronous render pass).
 */
export interface Subscribable<T> {
  /**
   * Registers `observer` for future (and possibly immediate/synchronous)
   * values. Returns an unsubscribe function.
   */
  subscribe(observer: (value: T) => void): () => void;
}

/** A `Subscribable` that synchronously replays `value` to every subscriber, then never again. */
export function subscribableOf<T>(value: T): Subscribable<T> {
  return {
    subscribe(observer) {
      observer(value);
      return () => {};
    },
  };
}

/** Type guard: does `value` look like a `Subscribable` (has a `subscribe` function)? */
export function isSubscribable(value: unknown): value is Subscribable<unknown> {
  return !!value && typeof (value as Subscribable<unknown>).subscribe === 'function';
}
