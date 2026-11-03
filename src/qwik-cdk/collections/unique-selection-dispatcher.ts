/**
 * Port of `src/cdk/collections/unique-selection-dispatcher.ts`. Users of the
 * dispatcher never need to see this type, but TypeScript requires it to be exported.
 */
export type UniqueSelectionDispatcherListener = (id: string, name: string) => void;

/**
 * Coordinates unique selection based on name — e.g. native radio inputs only fire a
 * `change` event on the item being newly selected, so something still has to tell every
 * *other* same-`name` item to uncheck itself.
 *
 * Upstream is a global, root-injected `@Injectable` singleton. This port is a plain
 * `createUniqueSelectionDispatcher()` factory instead (no Angular DI) — same convention as
 * `createFocusMonitor`/`createListKeyManager` elsewhere in this package. Construct ONE
 * instance and share it (e.g. via a Qwik context) across whichever components need
 * cross-talk; do not call the factory per-component expecting them to coordinate — each
 * call creates an independent dispatcher with its own listener set.
 *
 * **No current consumer in this port** — `qwik-material/radio`'s standalone (non-grouped)
 * radios use a `useOnDocument('change', …)` listener instead (see that package's SYNC.md),
 * and `qwik-cdk/accordion`'s equivalent need is served by a per-instance `Signal` broadcast
 * (see `accordion/SYNC.md`'s "`UniqueSelectionDispatcher`" deviation) rather than this
 * global-dispatcher shape, for the same reason documented there: every listener that
 * matters is already reachable through the SAME subtree's context, so the "is this the same
 * group" half of upstream's `(id, name)` check doesn't need runtime bookkeeping at all in
 * either of those cases. Exported for API completeness / a future consumer that genuinely
 * needs cross-subtree, name-keyed coordination outside of a shared context (upstream's
 * actual use case: unrelated radio groups anywhere in the app sharing one root-injected
 * service).
 */
export interface UniqueSelectionDispatcher {
  /**
   * Notify other items that selection for the given name has been set.
   * @param id ID of the item.
   * @param name Name of the item.
   */
  notify(id: string, name: string): void;
  /**
   * Listen for future changes to item selection.
   * @return Function used to deregister listener
   */
  listen(listener: UniqueSelectionDispatcherListener): () => void;
  /** Removes every registered listener. */
  destroy(): void;
}

export function createUniqueSelectionDispatcher(): UniqueSelectionDispatcher {
  let listeners: UniqueSelectionDispatcherListener[] = [];

  return {
    notify(id, name) {
      for (const listener of listeners) listener(id, name);
    },
    listen(listener) {
      listeners.push(listener);
      return () => {
        listeners = listeners.filter(registered => listener !== registered);
      };
    },
    destroy() {
      listeners = [];
    },
  };
}
