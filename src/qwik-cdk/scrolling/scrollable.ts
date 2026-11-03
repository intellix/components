import {isBrowser} from '@qwik.dev/core/build';
import {
  getRtlScrollAxisType,
  RtlScrollAxisType,
  supportsScrollBehavior,
} from '../platform/features/scrolling';

export type _Without<T> = {[P in keyof T]?: never};
export type _XOR<T, U> = (_Without<T> & U) | (_Without<U> & T);
export type _Top = {top?: number};
export type _Bottom = {bottom?: number};
export type _Left = {left?: number};
export type _Right = {right?: number};
export type _Start = {start?: number};
export type _End = {end?: number};
export type _XAxis = _XOR<_XOR<_Left, _Right>, _XOR<_Start, _End>>;
export type _YAxis = _XOR<_Top, _Bottom>;

/**
 * An extended version of `ScrollToOptions` that allows expressing scroll offsets relative to
 * the top, bottom, left, right, start, or end of the viewport rather than just the top and
 * left. `top`/`bottom` are mutually exclusive, as are `left`/`right`/`start`/`end`.
 */
export type ExtendedScrollToOptions = _XAxis & _YAxis & ScrollOptions;

/**
 * Port of `src/cdk/scrolling/scrollable.ts`'s `CdkScrollable.scrollTo()`/
 * `measureScrollOffset()` — the RTL-normalizing scroll math, as plain functions operating on
 * an element directly instead of directive instance methods (same "logic in module
 * functions, not stored instances" convention as `qwik-cdk/collections/
 * use-selection-model.ts`'s mutators). `isRtl` replaces upstream's `inject(Directionality,
 * {optional: true})?.value === 'rtl'` — pass it explicitly (e.g. from
 * `qwik-cdk/bidi`'s `useDirectionality()` if you have a provider, or your own RTL signal);
 * defaults to reading the element's own computed `direction` if omitted.
 */

function resolveIsRtl(element: Element, isRtl?: boolean): boolean {
  if (isRtl != null) return isRtl;
  if (!isBrowser) return false;
  // ssr-leak-ok: feature-detected via `isBrowser` on the line above. Only ever called from
  // `scrollToElement`/`measureScrollOffset`, themselves only ever meaningfully invoked
  // client-side (scrolling is a live-browser-only concern — see `use-cdk-scrollable.ts`).
  return getComputedStyle(element).direction === 'rtl';
}

/** A plain, freely-mutable working shape for the top/left/right/bottom math below —
 *  `ExtendedScrollToOptions`'s `_XOR`-based exclusivity types exist to guide CALLERS (only
 *  one of `left`/`right`/`start`/`end` at a time), not to describe this function's own
 *  intermediate, all-four-fields-touched computation. */
interface MutableScrollOffsets {
  top?: number;
  left?: number;
  right?: number;
  bottom?: number;
  behavior?: ScrollBehavior;
}

/**
 * Scrolls `element` to the specified offsets — a normalized version of the browser's native
 * `scrollTo` that's consistent about what `left`/`right` mean in RTL (browsers disagree).
 */
export function scrollToElement(
  element: HTMLElement,
  options: ExtendedScrollToOptions,
  isRtl?: boolean,
): void {
  const rtl = resolveIsRtl(element, isRtl);
  const opts = options as ExtendedScrollToOptions & {start?: number; end?: number};
  const resolved: MutableScrollOffsets = {top: opts.top, left: opts.left, behavior: opts.behavior};

  // Rewrite start & end offsets as right or left offsets.
  if (resolved.left == null) {
    resolved.left = rtl ? opts.end : opts.start;
  }
  resolved.right = opts.right;
  if (resolved.right == null) {
    resolved.right = rtl ? opts.start : opts.end;
  }

  // Rewrite the bottom offset as a top offset.
  if (opts.bottom != null) {
    resolved.top = element.scrollHeight - element.clientHeight - opts.bottom;
  }

  // Rewrite the right offset as a left offset.
  if (rtl && getRtlScrollAxisType() != RtlScrollAxisType.NORMAL) {
    if (resolved.left != null) {
      resolved.right = element.scrollWidth - element.clientWidth - resolved.left;
    }
    if (getRtlScrollAxisType() == RtlScrollAxisType.INVERTED) {
      resolved.left = resolved.right;
    } else if (getRtlScrollAxisType() == RtlScrollAxisType.NEGATED) {
      resolved.left = resolved.right ? -resolved.right : resolved.right;
    }
  } else if (resolved.right != null) {
    resolved.left = element.scrollWidth - element.clientWidth - resolved.right;
  }

  applyScrollToOptions(element, resolved);
}

function applyScrollToOptions(element: HTMLElement, options: MutableScrollOffsets): void {
  if (supportsScrollBehavior()) {
    element.scrollTo(options);
  } else {
    if (options.top != null) element.scrollTop = options.top;
    if (options.left != null) element.scrollLeft = options.left;
  }
}

/**
 * Measures `element`'s scroll offset relative to the specified edge — normalized the same
 * way `scrollToElement()` is, so `left`/`right`/`start`/`end` always mean the same thing
 * regardless of RTL/browser quirks.
 */
export function measureScrollOffset(
  element: HTMLElement,
  from: 'top' | 'left' | 'right' | 'bottom' | 'start' | 'end',
  isRtl?: boolean,
): number {
  const LEFT = 'left';
  const RIGHT = 'right';

  if (from == 'top') return element.scrollTop;
  if (from == 'bottom') return element.scrollHeight - element.clientHeight - element.scrollTop;

  const rtl = resolveIsRtl(element, isRtl);
  let edge: 'left' | 'right' = from === 'start' ? (rtl ? RIGHT : LEFT) : from === 'end' ? (rtl ? LEFT : RIGHT) : from;

  if (rtl && getRtlScrollAxisType() == RtlScrollAxisType.INVERTED) {
    // scrollLeft is (scrollWidth - clientWidth) when scrolled all the way left, 0 all the way right.
    return edge === LEFT
      ? element.scrollWidth - element.clientWidth - element.scrollLeft
      : element.scrollLeft;
  }
  if (rtl && getRtlScrollAxisType() == RtlScrollAxisType.NEGATED) {
    // scrollLeft is -(scrollWidth - clientWidth) when scrolled all the way left, 0 all the way right.
    return edge === LEFT
      ? element.scrollLeft + element.scrollWidth - element.clientWidth
      : -element.scrollLeft;
  }
  // NORMAL (and non-RTL): scrollLeft is 0 all the way left, (scrollWidth - clientWidth) all the way right.
  return edge === LEFT ? element.scrollLeft : element.scrollWidth - element.clientWidth - element.scrollLeft;
}
