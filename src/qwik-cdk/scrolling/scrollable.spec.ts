/**
 * Adapted from `src/cdk/scrolling/scrollable.spec.ts`'s non-Angular-specific assertions.
 * happy-dom's `scrollWidth`/`scrollHeight`/`clientWidth`/`clientHeight` are always `0` (no
 * real layout engine — see `qwik-cdk/text-field/textarea-autosize.spec.ts`'s identical
 * note), so these tests stub `scrollTo`/`scrollTop`/`scrollLeft` directly to verify the
 * RTL-normalizing ARGUMENT MAPPING (does `{start: 10}` become `{left: 10}` in LTR and
 * `{right: 10}` in RTL, etc.) rather than real pixel measurements.
 */
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';
import {getRtlScrollAxisType, RtlScrollAxisType} from '../platform/features/scrolling';
import {measureScrollOffset, scrollToElement} from './scrollable';

describe('scrollToElement', () => {
  let element: HTMLElement;
  let scrollToSpy: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    element = document.createElement('div');
    document.body.appendChild(element);
    scrollToSpy = vi.fn();
    element.scrollTo = scrollToSpy;
    // Force the `supportsScrollBehavior()` branch (`element.scrollTo` present and not
    // detected as polyfilled, since real native functions stringify as `[native code]`).
    Object.defineProperty(scrollToSpy, 'toString', {value: () => 'function () { [native code] }'});
  });

  afterEach(() => {
    element.remove();
  });

  it('passes top/left straight through in LTR', () => {
    scrollToElement(element, {top: 5, left: 10}, false);
    expect(scrollToSpy).toHaveBeenCalledWith(expect.objectContaining({top: 5, left: 10}));
  });

  it('maps start to left in LTR', () => {
    scrollToElement(element, {start: 20}, false);
    expect(scrollToSpy).toHaveBeenCalledWith(expect.objectContaining({left: 20}));
  });

  it('maps end to right in LTR', () => {
    scrollToElement(element, {end: 30}, false);
    expect(scrollToSpy).toHaveBeenCalledWith(expect.objectContaining({right: 30}));
  });

  // The RTL cases additionally depend on `getRtlScrollAxisType()`'s real-DOM-measurement
  // result (NORMAL/NEGATED/INVERTED — see `src/cdk/platform/features/scrolling.ts`), which
  // happy-dom's `scrollLeft` emulation may resolve differently than a real Chrome/Firefox
  // would. Rather than hard-code one browser's axis, these two compute the SAME expected
  // `{left, right}` pair the algorithm itself derives for whichever axis this environment
  // actually detects — verifying the wiring (start/end → left/right, RTL-aware), not
  // re-asserting upstream's own browser-detection heuristic.
  it('maps start (RTL) to right, then re-derives left for the detected axis', () => {
    scrollToElement(element, {start: 20}, true);
    const axis = getRtlScrollAxisType();
    const expectedRight = 20;
    const expectedLeft =
      axis === RtlScrollAxisType.NORMAL
        ? undefined
        : axis === RtlScrollAxisType.INVERTED
          ? expectedRight
          : -expectedRight;
    expect(scrollToSpy).toHaveBeenCalledWith(
      expect.objectContaining(
        expectedLeft === undefined ? {right: expectedRight} : {right: expectedRight, left: expectedLeft},
      ),
    );
  });

  it('maps end (RTL) to left, then re-derives right for the detected axis', () => {
    scrollToElement(element, {end: 30}, true);
    const axis = getRtlScrollAxisType();
    if (axis === RtlScrollAxisType.NORMAL) {
      expect(scrollToSpy).toHaveBeenCalledWith(expect.objectContaining({left: 30}));
      return;
    }
    const expectedRight = -30; // scrollWidth(0) - clientWidth(0) - left(30)
    const expectedLeft = axis === RtlScrollAxisType.INVERTED ? expectedRight : -expectedRight;
    expect(scrollToSpy).toHaveBeenCalledWith(
      expect.objectContaining({left: expectedLeft, right: expectedRight}),
    );
  });

  it('rewrites bottom as a top offset using scrollHeight/clientHeight', () => {
    Object.defineProperty(element, 'scrollHeight', {value: 500, configurable: true});
    Object.defineProperty(element, 'clientHeight', {value: 100, configurable: true});
    scrollToElement(element, {bottom: 50}, false);
    expect(scrollToSpy).toHaveBeenCalledWith(expect.objectContaining({top: 350}));
  });

  it('falls back to scrollTop/scrollLeft assignment when scrollTo is unsupported', () => {
    // @ts-expect-error - simulate an older engine with no `Element.prototype.scrollTo`.
    delete element.scrollTo;
    scrollToElement(element, {top: 15, left: 25}, false);
    expect(element.scrollTop).toBe(15);
    expect(element.scrollLeft).toBe(25);
  });
});

describe('measureScrollOffset', () => {
  let element: HTMLElement;

  beforeEach(() => {
    element = document.createElement('div');
    document.body.appendChild(element);
  });

  afterEach(() => {
    element.remove();
  });

  it("'top' reads scrollTop directly", () => {
    Object.defineProperty(element, 'scrollTop', {value: 42, configurable: true});
    expect(measureScrollOffset(element, 'top')).toBe(42);
  });

  it("'bottom' derives from scrollHeight - clientHeight - scrollTop", () => {
    Object.defineProperty(element, 'scrollHeight', {value: 500, configurable: true});
    Object.defineProperty(element, 'clientHeight', {value: 100, configurable: true});
    Object.defineProperty(element, 'scrollTop', {value: 50, configurable: true});
    expect(measureScrollOffset(element, 'bottom')).toBe(350);
  });

  it("'start' reads scrollLeft directly in LTR (NORMAL axis)", () => {
    Object.defineProperty(element, 'scrollLeft', {value: 7, configurable: true});
    expect(measureScrollOffset(element, 'start', false)).toBe(7);
  });

  it("'left' and 'start' agree in LTR", () => {
    Object.defineProperty(element, 'scrollLeft', {value: 7, configurable: true});
    expect(measureScrollOffset(element, 'left', false)).toBe(
      measureScrollOffset(element, 'start', false),
    );
  });
});
