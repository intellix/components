import {isBrowser} from '@qwik.dev/core/build';

export interface ViewportSize {
  width: number;
  height: number;
}

export interface ViewportScrollPosition {
  top: number;
  left: number;
}

export interface ViewportRect extends ViewportScrollPosition {
  bottom: number;
  right: number;
  width: number;
  height: number;
}

/**
 * Port of `src/cdk/scrolling/viewport-ruler.ts`'s `ViewportRuler`. A plain
 * `createViewportRuler()` factory instead of an `@Injectable({providedIn: 'root'})`
 * service — same convention as `createFocusMonitor` in `qwik-cdk/a11y`. `change()`'s
 * `Observable<Event>` (with an `auditTime` throttle baked in) is replaced by `onChange(cb):
 * () => void` plain callback registration with NO throttle — no RxJS dependency; a caller
 * that wants throttling can debounce `cb` itself (upstream's default throttle, `20`ms, was
 * itself just a convenience default, not load-bearing behavior).
 */
export interface ViewportRuler {
  /** Returns the viewport's width and height. */
  getViewportSize(): Readonly<ViewportSize>;
  /** Gets a rect for the viewport's bounds (top/left/bottom/right/width/height). */
  getViewportRect(): Readonly<ViewportRect>;
  /** Gets the (top, left) scroll position of the viewport. */
  getViewportScrollPosition(): ViewportScrollPosition;
  /** Registers a listener for viewport resize/orientation changes. Returns an unsubscribe fn. */
  onChange(listener: (event: Event) => void): () => void;
  /** Tears down the window listeners this instance installed. */
  destroy(): void;
}

export function createViewportRuler(): ViewportRuler {
  const listeners = new Set<(event: Event) => void>();
  let cachedSize: ViewportSize | null = null;
  let windowListenersInstalled = false;

  const handleChange = (event: Event) => {
    cachedSize = null;
    listeners.forEach(l => l(event));
  };

  function ensureWindowListeners(): void {
    if (windowListenersInstalled || !isBrowser) return;
    windowListenersInstalled = true;
    window.addEventListener('resize', handleChange);
    window.addEventListener('orientationchange', handleChange);
  }

  function updateViewportSize(): void {
    cachedSize = isBrowser ? {width: window.innerWidth, height: window.innerHeight} : {width: 0, height: 0};
  }

  const ruler: ViewportRuler = {
    getViewportSize() {
      if (!cachedSize) updateViewportSize();
      const size = {width: cachedSize!.width, height: cachedSize!.height};
      // Don't cache outside the browser — nothing meaningful to invalidate it there.
      if (!isBrowser) cachedSize = null;
      return size;
    },

    getViewportRect() {
      const scrollPosition = ruler.getViewportScrollPosition();
      const {width, height} = ruler.getViewportSize();
      return {
        top: scrollPosition.top,
        left: scrollPosition.left,
        bottom: scrollPosition.top + height,
        right: scrollPosition.left + width,
        height,
        width,
      };
    },

    getViewportScrollPosition() {
      if (!isBrowser) return {top: 0, left: 0};

      // The top-left corner of the viewport is determined by the scroll position of the
      // document body — normally just (scrollLeft, scrollTop). Chrome and Firefox disagree
      // about whether `document.body` or `document.documentElement` is the scrolled element,
      // so reading `scrollTop`/`scrollLeft` directly is inconsistent; the bounding rect of
      // `document.documentElement` is consistent (`top`/`left` equal negative the scroll
      // position).
      const documentElement = document.documentElement;
      const documentRect = documentElement.getBoundingClientRect();

      const top =
        -documentRect.top ||
        document.body?.scrollTop ||
        window.scrollY ||
        documentElement.scrollTop ||
        0;
      const left =
        -documentRect.left ||
        document.body?.scrollLeft ||
        window.scrollX ||
        documentElement.scrollLeft ||
        0;

      return {top, left};
    },

    onChange(listener) {
      ensureWindowListeners();
      listeners.add(listener);
      return () => listeners.delete(listener);
    },

    destroy() {
      listeners.clear();
      if (windowListenersInstalled) {
        window.removeEventListener('resize', handleChange);
        window.removeEventListener('orientationchange', handleChange);
        windowListenersInstalled = false;
      }
    },
  };

  return ruler;
}
