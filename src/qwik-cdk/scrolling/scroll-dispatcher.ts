import {isBrowser} from '@qwik.dev/core/build';

/**
 * What `ScrollDispatcher` needs from a registered scrollable — a minimal structural
 * interface instead of upstream's concrete `CdkScrollable` directive class (this package has
 * no directive-on-a-component concept; `use-cdk-scrollable.ts`'s `useCdkScrollable()` hook
 * builds one of these for whatever element it's attached to).
 */
export interface CdkScrollableHandle {
  /** The scrollable's own element (for `getAncestorScrollContainers()`'s DOM-ancestry walk). */
  readonly element: Element;
  /** Registers `listener` for the element's native `scroll` events. Returns an unsubscribe fn. */
  elementScrolled(listener: (event: Event) => void): () => void;
}

/**
 * Port of `src/cdk/scrolling/scroll-dispatcher.ts`'s `ScrollDispatcher`. A plain
 * `createScrollDispatcher()` factory instead of an `@Injectable({providedIn: 'root'})`
 * service — same convention as `createFocusMonitor` in `qwik-cdk/a11y`. `scrolled()`/
 * `ancestorScrolled()`'s `Observable<CdkScrollable | void>` (with an `auditTime` throttle
 * baked in) is replaced by plain callback registration (`(cb): () => void`, no RxJS) with NO
 * built-in throttle — a caller that wants one can debounce `cb` itself.
 */
export interface ScrollDispatcher {
  /** Every currently-registered scrollable, mapped to its own unsubscribe function — mirrors
   *  upstream's `scrollContainers: Map<CdkScrollable, Subscription>` field shape. */
  readonly scrollContainers: ReadonlyMap<CdkScrollableHandle, () => void>;
  /** Registers `scrollable` and starts listening for its scroll events. Returns a function
   *  that deregisters it (equivalent to calling `deregister(scrollable)` yourself). */
  register(scrollable: CdkScrollableHandle): () => void;
  /** De-registers a scrollable and unsubscribes from its scroll events. */
  deregister(scrollable: CdkScrollableHandle): void;
  /**
   * Registers a listener that fires whenever any registered scrollable (or the window/
   * document) is scrolled. Returns an unsubscribe function.
   */
  scrolled(listener: (scrollable: CdkScrollableHandle | undefined) => void): () => void;
  /** Like `scrolled()`, but only for scroll events from a scrollable ANCESTOR of `element`. */
  ancestorScrolled(
    element: Element,
    listener: (scrollable: CdkScrollableHandle | undefined) => void,
  ): () => void;
  /** Returns every registered scrollable that contains `element`. */
  getAncestorScrollContainers(element: Element): CdkScrollableHandle[];
  /** Tears down every registration and the shared document listener. */
  destroy(): void;
}

export function createScrollDispatcher(): ScrollDispatcher {
  const scrollContainers = new Map<CdkScrollableHandle, () => void>();
  const scrolledListeners = new Set<(scrollable: CdkScrollableHandle | undefined) => void>();
  let cleanupGlobalListener: (() => void) | undefined;

  function notifyScrolled(scrollable: CdkScrollableHandle | undefined): void {
    scrolledListeners.forEach(l => l(scrollable));
  }

  function ensureGlobalListener(): void {
    if (cleanupGlobalListener || !isBrowser) return;
    const handler = () => notifyScrolled(undefined);
    document.addEventListener('scroll', handler, {passive: true});
    cleanupGlobalListener = () => document.removeEventListener('scroll', handler);
  }

  function containsElement(scrollable: CdkScrollableHandle, element: Element): boolean {
    let el: Element | null = element;
    const scrollableElement = scrollable.element;
    do {
      if (el === scrollableElement) return true;
    } while ((el = el!.parentElement));
    return false;
  }

  const dispatcher: ScrollDispatcher = {
    scrollContainers,

    register(scrollable) {
      if (!scrollContainers.has(scrollable)) {
        const unlisten = scrollable.elementScrolled(() => notifyScrolled(scrollable));
        scrollContainers.set(scrollable, unlisten);
      }
      return () => dispatcher.deregister(scrollable);
    },

    deregister(scrollable) {
      const unlisten = scrollContainers.get(scrollable);
      if (unlisten) {
        unlisten();
        scrollContainers.delete(scrollable);
      }
    },

    scrolled(listener) {
      if (!isBrowser) return () => {};
      ensureGlobalListener();
      scrolledListeners.add(listener);
      return () => {
        scrolledListeners.delete(listener);
        if (scrolledListeners.size === 0) {
          cleanupGlobalListener?.();
          cleanupGlobalListener = undefined;
        }
      };
    },

    ancestorScrolled(element, listener) {
      const ancestors = dispatcher.getAncestorScrollContainers(element);
      return dispatcher.scrolled(scrollable => {
        if (!scrollable || ancestors.includes(scrollable)) listener(scrollable);
      });
    },

    getAncestorScrollContainers(element) {
      const containers: CdkScrollableHandle[] = [];
      scrollContainers.forEach((_unlisten, scrollable) => {
        if (containsElement(scrollable, element)) containers.push(scrollable);
      });
      return containers;
    },

    destroy() {
      cleanupGlobalListener?.();
      cleanupGlobalListener = undefined;
      scrollContainers.forEach(unlisten => unlisten());
      scrollContainers.clear();
      scrolledListeners.clear();
    },
  };

  return dispatcher;
}
