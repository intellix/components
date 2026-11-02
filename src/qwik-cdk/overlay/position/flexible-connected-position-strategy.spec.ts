/**
 * Vitest scenario port from
 * src/cdk/overlay/position/flexible-connected-position-strategy.spec.ts
 *
 * Strategy: the CDK source file (3080 LOC) is overwhelmingly geometry math
 * tested via DOM observation. happy-dom's own layout engine always returns
 * zeroed `getBoundingClientRect()`s, but — unlike an earlier version of this
 * file assumed — `getBoundingClientRect` is a perfectly ordinary,
 * overridable method: `vi.spyOn(el, 'getBoundingClientRect')` lets a test
 * hand the strategy whatever rects it likes and then assert on the exact
 * pixel styles `apply()` computes from them, with NO real browser layout
 * involved. `mockRect`/`mockViewport` below do exactly that.
 *
 * Ported here:
 *  - ~16 tests covering the pure-JavaScript surface (construction, fluent
 *    chaining, attach/dispose lifecycle, `withPopoverLocation`/
 *    `getPopoverInsertionPoint`).
 *  - ~13 geometry tests using mocked rects: exact positioning (both axes,
 *    LTR and RTL), fallback position selection, viewport margin, flexible-
 *    dimension bounding-box sizing, push-on-screen, panel classes,
 *    transform-origin, and the `positionChanges` signal.
 *
 * Still skipped: a handful of CDK's own scenarios that exercise behaviour
 * this port doesn't have an equivalent for in isolation (real scroll
 * events / `ScrollDispatcher`, zoom-related container-rect quirks) — each
 * documented at its own `it.skip()`. The DOM-level pixel-geometry contract
 * these mocked tests assert is additionally cross-checked against the real
 * Angular reference app via the Playwright parity specs (e.g.
 * `qwik-material/tooltip`'s `basic`/`positions`/`position-at-origin`
 * scenarios), which is what actually exercises real browser layout.
 */

import {describe, it, expect, beforeEach, afterEach, vi} from 'vitest';
import {
  createFlexibleConnectedPositionStrategy,
  type FlexibleConnectedPositionStrategy,
  STANDARD_DROPDOWN_BELOW_POSITIONS,
  STANDARD_DROPDOWN_ADJACENT_POSITIONS,
} from '../public-api';
import type {ConnectedPosition} from '../public-api';

const DEFAULT_POSITIONS: ConnectedPosition[] = [
  {originX: 'start', originY: 'bottom', overlayX: 'start', overlayY: 'top'},
];

/** Build a minimal PositionStrategyOverlayHandle stub. */
function makeRefStub() {
  const host = document.createElement('div');
  const pane = document.createElement('div');
  host.appendChild(pane);
  document.body.appendChild(host);
  return {hostElement: host, overlayElement: pane} as any;
}

/** Builds a full DOMRect-shaped object from partial top/left/width/height. */
function rect(r: {top: number; left: number; width: number; height: number}): DOMRect {
  return {
    top: r.top,
    left: r.left,
    width: r.width,
    height: r.height,
    bottom: r.top + r.height,
    right: r.left + r.width,
    x: r.left,
    y: r.top,
    toJSON() {
      return this;
    },
  } as DOMRect;
}

/** Stubs `el.getBoundingClientRect()` to return a fixed rect. */
function mockRect(
  el: Element,
  r: {top: number; left: number; width: number; height: number},
): void {
  vi.spyOn(el, 'getBoundingClientRect').mockReturnValue(rect(r));
}

/** Stubs the viewport's clientWidth/clientHeight (read by `_getNarrowedViewportRect`). */
function mockViewport(width: number, height: number): void {
  Object.defineProperty(document.documentElement, 'clientWidth', {
    value: width,
    configurable: true,
  });
  Object.defineProperty(document.documentElement, 'clientHeight', {
    value: height,
    configurable: true,
  });
}

describe('FlexibleConnectedPositionStrategy', () => {
  let origin: HTMLElement;
  let strategy: FlexibleConnectedPositionStrategy;
  let ref: ReturnType<typeof makeRefStub>;

  beforeEach(() => {
    document.body.innerHTML = '';
    origin = document.createElement('div');
    document.body.appendChild(origin);
    ref = makeRefStub();
    strategy = createFlexibleConnectedPositionStrategy(origin);
    // A roomy default viewport; individual tests override when the point is
    // to force a fallback/push.
    mockViewport(1024, 768);
  });

  afterEach(() => {
    strategy.dispose();
    document.body.innerHTML = '';
    vi.restoreAllMocks();
  });

  // ------------------------------------------------------------------ //
  // Ported: construction and fluent API
  // ------------------------------------------------------------------ //

  it('constructs without error given an origin element', () => {
    expect(typeof strategy.attach).toBe('function');
    expect(typeof strategy.apply).toBe('function');
    expect(typeof strategy.dispose).toBe('function');
    expect(typeof strategy.withPositions).toBe('function');
  });

  it('withPositions sets the preferred positions', () => {
    strategy.withPositions(DEFAULT_POSITIONS);
    expect(strategy.positions.length).toBe(1);
    expect(strategy.positions[0].originX).toBe('start');
  });

  it('withPositions returns the strategy for chaining', () => {
    const result = strategy.withPositions(DEFAULT_POSITIONS);
    expect(result).toBe(strategy);
  });

  it('withLockedPosition returns the strategy for chaining', () => {
    expect(strategy.withLockedPosition(true)).toBe(strategy);
  });

  it('withGrowAfterOpen returns the strategy for chaining', () => {
    expect(strategy.withGrowAfterOpen(true)).toBe(strategy);
  });

  it('withFlexibleDimensions returns the strategy for chaining', () => {
    expect(strategy.withFlexibleDimensions(false)).toBe(strategy);
  });

  it('withPush returns the strategy for chaining', () => {
    expect(strategy.withPush(false)).toBe(strategy);
  });

  it('withViewportMargin returns the strategy for chaining', () => {
    expect(strategy.withViewportMargin(10)).toBe(strategy);
  });

  it('withDefaultOffsetX returns the strategy for chaining', () => {
    expect(strategy.withDefaultOffsetX(5)).toBe(strategy);
  });

  it('withDefaultOffsetY returns the strategy for chaining', () => {
    expect(strategy.withDefaultOffsetY(5)).toBe(strategy);
  });

  it('STANDARD_DROPDOWN_BELOW_POSITIONS has expected entry count', () => {
    expect(STANDARD_DROPDOWN_BELOW_POSITIONS.length).toBeGreaterThan(0);
  });

  it('STANDARD_DROPDOWN_ADJACENT_POSITIONS has expected entry count', () => {
    expect(STANDARD_DROPDOWN_ADJACENT_POSITIONS.length).toBeGreaterThan(0);
  });

  // ------------------------------------------------------------------ //
  // Ported: attach/dispose lifecycle
  // ------------------------------------------------------------------ //

  it('attach() does not throw with a valid handle', () => {
    strategy.withPositions(DEFAULT_POSITIONS);
    expect(() => strategy.attach(ref)).not.toThrow();
  });

  it('should throw when attempting to attach to a second overlay', () => {
    strategy.withPositions(DEFAULT_POSITIONS);
    strategy.attach(ref);

    const ref2 = makeRefStub();
    expect(() => strategy.attach(ref2)).toThrow();
  });

  it('dispose() does not throw', () => {
    strategy.withPositions(DEFAULT_POSITIONS);
    strategy.attach(ref);
    expect(() => strategy.dispose()).not.toThrow();
  });

  it('should not throw when trying to apply after being disposed', () => {
    strategy.withPositions(DEFAULT_POSITIONS);
    strategy.attach(ref);
    strategy.dispose();
    expect(() => strategy.apply()).not.toThrow();
  });

  it('dispose() twice does not throw', () => {
    strategy.withPositions(DEFAULT_POSITIONS);
    strategy.attach(ref);
    strategy.dispose();
    expect(() => strategy.dispose()).not.toThrow();
  });

  it('detach() clears the overlay ref without error', () => {
    strategy.withPositions(DEFAULT_POSITIONS);
    strategy.attach(ref);
    expect(() => strategy.detach?.()).not.toThrow();
  });

  // ------------------------------------------------------------------ //
  // withPopoverLocation / getPopoverInsertionPoint
  // ------------------------------------------------------------------ //

  describe('withPopoverLocation / getPopoverInsertionPoint', () => {
    it("defaults to 'global' (null insertion point)", () => {
      expect(strategy.getPopoverInsertionPoint()).toBeNull();
    });

    it("returns null for an explicit 'global' location", () => {
      strategy.withPopoverLocation('global');
      expect(strategy.getPopoverInsertionPoint()).toBeNull();
    });

    it("returns the origin element for 'inline' when the origin is an Element", () => {
      strategy.withPopoverLocation('inline');
      expect(strategy.getPopoverInsertionPoint()).toBe(origin);
    });

    it("returns null for 'inline' when the origin is a Point, not an Element", () => {
      const pointStrategy = createFlexibleConnectedPositionStrategy({x: 10, y: 20});
      pointStrategy.withPopoverLocation('inline');
      expect(pointStrategy.getPopoverInsertionPoint()).toBeNull();
      pointStrategy.dispose();
    });

    it("returns the {type: 'parent', element} descriptor unchanged for a custom parent", () => {
      const parent = document.createElement('div');
      strategy.withPopoverLocation({type: 'parent', element: parent});
      expect(strategy.getPopoverInsertionPoint()).toEqual({type: 'parent', element: parent});
    });

    it('switches back to null after being set to inline then back to global', () => {
      strategy.withPopoverLocation('inline');
      expect(strategy.getPopoverInsertionPoint()).toBe(origin);
      strategy.withPopoverLocation('global');
      expect(strategy.getPopoverInsertionPoint()).toBeNull();
    });
  });

  // ------------------------------------------------------------------ //
  // Geometry — mocked `getBoundingClientRect()` (see file header comment)
  // ------------------------------------------------------------------ //

  it('positions the overlay at the bottom-left of the origin (exact position, LTR)', () => {
    mockRect(origin, {top: 100, left: 100, width: 50, height: 30});
    mockRect(ref.overlayElement, {top: 0, left: 0, width: 80, height: 40});

    strategy
      .withFlexibleDimensions(false)
      .withPositions([{originX: 'start', originY: 'bottom', overlayX: 'start', overlayY: 'top'}]);
    strategy.attach(ref);
    strategy.apply();

    expect(ref.overlayElement.style.top).toBe('130px');
    expect(ref.overlayElement.style.left).toBe('100px');
  });

  it('positions the overlay at the top-right of the origin (exact position, LTR)', () => {
    mockRect(origin, {top: 300, left: 300, width: 50, height: 30});
    mockRect(ref.overlayElement, {top: 0, left: 0, width: 80, height: 40});

    strategy
      .withFlexibleDimensions(false)
      .withPositions([{originX: 'end', originY: 'top', overlayX: 'end', overlayY: 'bottom'}]);
    strategy.attach(ref);
    strategy.apply();

    expect(ref.overlayElement.style.right).toBe('674px');
    expect(ref.overlayElement.style.bottom).toBe('468px');
    expect(ref.overlayElement.style.top).toBe('');
    expect(ref.overlayElement.style.left).toBe('');
  });

  it('positions the overlay honouring RTL (origin.start resolves to its right edge)', () => {
    ref.hostElement.style.direction = 'rtl';
    mockRect(origin, {top: 100, left: 100, width: 40, height: 20});
    mockRect(ref.overlayElement, {top: 0, left: 0, width: 60, height: 30});

    strategy
      .withFlexibleDimensions(false)
      .withPositions([
        {originX: 'start', originY: 'center', overlayX: 'start', overlayY: 'center'},
      ]);
    strategy.attach(ref);
    strategy.apply();

    // RTL: origin 'start' = its right edge (140); overlay 'start' hangs off
    // to the left of that point, so the exact style is `right`, not `left`.
    expect(ref.overlayElement.style.right).toBe('884px');
    expect(ref.overlayElement.style.top).toBe('95px');
  });

  it('falls back to the next preferred position when the first one overflows the viewport', () => {
    mockViewport(200, 200);
    mockRect(origin, {top: 180, left: 180, width: 20, height: 20});
    mockRect(ref.overlayElement, {top: 0, left: 0, width: 100, height: 60});

    const fallbackPosition: ConnectedPosition = {
      originX: 'start',
      originY: 'top',
      overlayX: 'end',
      overlayY: 'bottom',
    };
    strategy.withPositions([
      // Opens below-right of a near-bottom-right-corner origin — overflows.
      {originX: 'end', originY: 'bottom', overlayX: 'start', overlayY: 'top'},
      // Opens above-left instead — fits completely.
      fallbackPosition,
    ]);
    strategy.attach(ref);
    strategy.apply();

    expect(strategy.getPositionChanges().value?.connectionPair).toEqual(fallbackPosition);
  });

  it('sizes the bounding box to fill the viewport below the origin (default flexible dimensions)', () => {
    mockRect(origin, {top: 100, left: 200, width: 60, height: 40});
    mockRect(ref.overlayElement, {top: 0, left: 0, width: 80, height: 50});

    strategy.withPositions([
      {originX: 'start', originY: 'bottom', overlayX: 'start', overlayY: 'top'},
    ]);
    strategy.attach(ref);
    strategy.apply();

    expect(ref.hostElement.style.top).toBe('140px');
    expect(ref.hostElement.style.left).toBe('200px');
    expect(ref.hostElement.style.width).toBe('824px');
    expect(ref.hostElement.style.height).toBe('628px');
    expect(ref.hostElement.style.alignItems).toBe('flex-start');
    expect(ref.hostElement.style.justifyContent).toBe('flex-start');
    // Non-exact path: the pane itself is simply `position: static`.
    expect(ref.overlayElement.style.position).toBe('static');
  });

  it('shrinks the bounding box by the configured viewport margin', () => {
    mockRect(origin, {top: 100, left: 200, width: 60, height: 40});
    mockRect(ref.overlayElement, {top: 0, left: 0, width: 80, height: 50});

    strategy
      .withViewportMargin(20)
      .withPositions([{originX: 'start', originY: 'bottom', overlayX: 'start', overlayY: 'top'}]);
    strategy.attach(ref);
    strategy.apply();

    // Without margin this would be 824px (see the previous test) — the
    // viewport is narrowed by 20 on the trailing edge AND that same 20 is
    // subtracted again from the bounding box width (upstream's own
    // `_calculateBoundingBoxRect` math), so the total reduction is 40.
    expect(ref.hostElement.style.width).toBe('784px');
  });

  it('picks the position with the greatest flexible-fit area when nothing fits completely', () => {
    mockViewport(200, 200);
    mockRect(origin, {top: 50, left: 190, width: 5, height: 5});
    mockRect(ref.overlayElement, {top: 0, left: 0, width: 60, height: 40});
    // No config on this bare stub by default; add a minWidth small enough
    // that the sliver of available width (viewport.right - point.x = 5px)
    // still satisfies it, so this position qualifies as a flexible fit
    // instead of falling through to the (push-based) fallback path.
    (ref as any).config = {minWidth: 5};

    const onlyPosition: ConnectedPosition = {
      originX: 'end',
      originY: 'top',
      overlayX: 'start',
      overlayY: 'top',
    };
    strategy.withPositions([onlyPosition]);
    strategy.attach(ref);
    strategy.apply();

    expect(strategy.getPositionChanges().value?.connectionPair).toEqual(onlyPosition);
    // Flexible-fit path (not pushed): the pane stays non-exact/static.
    expect(ref.overlayElement.style.position).toBe('static');
  });

  it('pushes the overlay back on-screen when nothing fits and canPush is true', () => {
    mockViewport(100, 100);
    mockRect(origin, {top: 90, left: 90, width: 10, height: 10});
    mockRect(ref.overlayElement, {top: 0, left: 0, width: 50, height: 50});

    strategy
      .withFlexibleDimensions(false)
      .withPush(true)
      .withPositions([{originX: 'start', originY: 'bottom', overlayX: 'start', overlayY: 'top'}]);
    strategy.attach(ref);
    strategy.apply();

    expect(ref.overlayElement.style.top).toBe('50px');
    expect(ref.overlayElement.style.left).toBe('50px');
  });

  it('does not push (uses the least-bad fallback as-is) when canPush is false', () => {
    mockViewport(100, 100);
    mockRect(origin, {top: 90, left: 90, width: 10, height: 10});
    mockRect(ref.overlayElement, {top: 0, left: 0, width: 50, height: 50});

    strategy
      .withFlexibleDimensions(false)
      .withPush(false)
      .withPositions([{originX: 'start', originY: 'bottom', overlayX: 'start', overlayY: 'top'}]);
    strategy.attach(ref);
    strategy.apply();

    // Unpushed: the raw (overflowing) origin-derived point, not the
    // pushed-on-screen one from the test above.
    expect(ref.overlayElement.style.top).toBe('100px');
    expect(ref.overlayElement.style.left).toBe('90px');
  });

  it("applies the position's panelClass to the overlay pane", () => {
    mockRect(origin, {top: 0, left: 0, width: 20, height: 20});
    mockRect(ref.overlayElement, {top: 0, left: 0, width: 20, height: 20});

    strategy.withFlexibleDimensions(false).withPositions([
      {
        originX: 'start',
        originY: 'bottom',
        overlayX: 'start',
        overlayY: 'top',
        panelClass: ['my-panel-class', 'my-other-class'],
      },
    ]);
    strategy.attach(ref);
    strategy.apply();

    expect(ref.overlayElement.classList.contains('my-panel-class')).toBe(true);
    expect(ref.overlayElement.classList.contains('my-other-class')).toBe(true);
  });

  it('sets transform-origin on descendants matched by withTransformOriginOn', () => {
    const child = document.createElement('div');
    child.className = 'transform-target';
    ref.hostElement.appendChild(child);

    mockRect(origin, {top: 0, left: 0, width: 20, height: 20});
    mockRect(ref.overlayElement, {top: 0, left: 0, width: 20, height: 20});

    strategy
      .withTransformOriginOn('.transform-target')
      .withPositions([
        {originX: 'start', originY: 'bottom', overlayX: 'center', overlayY: 'bottom'},
      ]);
    strategy.attach(ref);
    strategy.apply();

    expect(child.style.transformOrigin).toBe('center bottom');
  });

  it('reports scroll-clipping against a scrollable container passed to withScrollableContainers', () => {
    const scrollContainer = document.createElement('div');
    mockRect(scrollContainer, {top: 0, left: 0, width: 120, height: 120});
    mockRect(origin, {top: 100, left: 100, width: 50, height: 50});
    mockRect(ref.overlayElement, {top: 0, left: 0, width: 20, height: 20});

    strategy
      .withFlexibleDimensions(false)
      .withScrollableContainers([scrollContainer])
      .withPositions([{originX: 'start', originY: 'bottom', overlayX: 'start', overlayY: 'top'}]);
    strategy.attach(ref);
    strategy.apply();

    const change = strategy.getPositionChanges().value;
    expect(change?.scrollableViewProperties.isOriginClipped).toBe(true);
  });

  it('emits a positionChanges value with the chosen connectionPair after apply()', () => {
    mockRect(origin, {top: 10, left: 10, width: 20, height: 20});
    mockRect(ref.overlayElement, {top: 0, left: 0, width: 20, height: 20});

    const position: ConnectedPosition = {
      originX: 'start',
      originY: 'bottom',
      overlayX: 'start',
      overlayY: 'top',
    };
    expect(strategy.getPositionChanges().value).toBeNull();

    strategy.withFlexibleDimensions(false).withPositions([position]);
    strategy.attach(ref);
    strategy.apply();

    const change = strategy.getPositionChanges().value;
    expect(change).not.toBeNull();
    expect(change?.connectionPair).toEqual(position);
    expect(change?.scrollableViewProperties).toEqual({
      isOriginClipped: false,
      isOriginOutsideView: false,
      isOverlayClipped: false,
      isOverlayOutsideView: false,
    });
  });

  // ------------------------------------------------------------------ //
  // Still skipped — no isolated equivalent in this port (see each note)
  // ------------------------------------------------------------------ //

  it.skip('should recompute position on scroll via a real ScrollDispatcher [infra]', () => {
    // SKIP: qwik-cdk has no ScrollDispatcher port; withScrollableContainers()
    // takes a static snapshot of rects instead of subscribing to live scroll
    // events. Scroll-driven repositioning itself is exercised end-to-end by
    // reposition-scroll-strategy.ts + its own spec.
  });

  it.skip('should account for negative container-rect coordinates when zoomed (Safari) [infra]', () => {
    // SKIP: simulating Safari's zoomed-viewport negative-container-rect
    // quirk needs a real zoomed browser; _getContainerRect()'s negative-
    // coordinate adjustment in _getOriginPoint is otherwise covered by the
    // "exact position" tests above (containerRect is zero in all of them).
  });
});
