import {describe, it, expect, beforeEach, afterEach} from 'vitest';
import {RippleRenderer} from './ripple-renderer';
import {RippleState, type RippleConfig} from './ripple-ref';
import {getRippleRenderer} from './ripple-registry';
import {
  fadeOutAllNonPersistentRipples,
  fadeOutAllRipples,
  launchRipple,
  rippleAnimationConfig,
  rippleOnMouseDown,
  rippleOnTouchStart,
} from './ripple-dom';

/**
 * Ports the meaningful behavioral assertions of upstream's
 * `src/material/core/ripple/ripple.spec.ts` (Angular `TestBed` + Karma)
 * onto this port's framework-free `RippleRenderer`/`ripple-dom.ts`, vitest +
 * happy-dom style (matching every other qwik-material spec). Angular-only
 * concerns dropped: `MAT_RIPPLE_GLOBAL_OPTIONS`/global-options tests (no
 * global-options system in this port — every component reads its own
 * disable/centered/color props directly), `fixture.detectChanges()`/change
 * detection, and the `ngOnDestroy` cleanup test (there is no directive
 * instance to destroy — a container simply falling out of the DOM is
 * handled by the `WeakMap` registry, not an explicit teardown call).
 *
 * happy-dom has no real layout engine (`getBoundingClientRect()` always
 * returns an all-zero rect) and no real CSS transitions, so two things are
 * stubbed per-test to reproduce a real browser's behavior precisely enough
 * to exercise `RippleRenderer`'s actual transition-driven lifecycle (the
 * thing worth testing) rather than its "animations forcibly disabled via
 * CSS" fallback path (a real, but different, upstream behavior — tested
 * separately, below):
 *  - `container.getBoundingClientRect` → a realistic, non-zero rect, same
 *    role as upstream's real `rippleTarget.getBoundingClientRect()`.
 *  - `window.getComputedStyle` → echoes back the ripple element's own
 *    inline `transitionDuration`/a non-`none` `transitionProperty`, so
 *    `fadeInRipple`'s own CSS-detection heuristic sees a normal, animated
 *    element instead of always tripping its "animations are canceled"
 *    branch (which happy-dom's unstyled default would otherwise always do).
 */

function stubContainerRect(
  el: HTMLElement,
  rect: {left: number; top: number; width: number; height: number},
): void {
  el.getBoundingClientRect = () =>
    ({
      left: rect.left,
      top: rect.top,
      width: rect.width,
      height: rect.height,
      right: rect.left + rect.width,
      bottom: rect.top + rect.height,
      x: rect.left,
      y: rect.top,
      toJSON() {
        return this;
      },
    }) as DOMRect;
}

function stubRealisticComputedStyle(): () => void {
  const original = window.getComputedStyle;
  window.getComputedStyle = ((el: Element) => {
    const style = (el as HTMLElement).style;
    return {
      transitionProperty: 'transform, opacity',
      transitionDuration: style.transitionDuration || '225ms',
    } as CSSStyleDeclaration;
  }) as typeof window.getComputedStyle;
  return () => {
    window.getComputedStyle = original;
  };
}

function flushTransition(container: Element, index = 0): void {
  const ripples = container.querySelectorAll('.mat-ripple-element');
  ripples[index].dispatchEvent(new Event('transitionend'));
}

function mousedown(container: HTMLElement, clientX = 0, clientY = 0): MouseEvent {
  const event = new MouseEvent('mousedown', {clientX, clientY, buttons: 1, detail: 1});
  container.dispatchEvent(event);
  return event;
}

const noopTarget = (disabled = false, config: RippleConfig = {}) => ({
  rippleDisabled: disabled,
  rippleConfig: config,
});

describe('RippleRenderer', () => {
  let container: HTMLElement;
  let restoreComputedStyle: () => void;

  beforeEach(() => {
    container = document.createElement('div');
    container.classList.add('mat-ripple');
    document.body.appendChild(container);
    stubContainerRect(container, {left: 0, top: 0, width: 300, height: 200});
    restoreComputedStyle = stubRealisticComputedStyle();
  });

  afterEach(() => {
    restoreComputedStyle();
    container.remove();
  });

  describe('fadeInRipple sizing', () => {
    it('sizes the ripple to cover the furthest corner from the click point', () => {
      const renderer = new RippleRenderer(container);
      // Click at (50, 75) within a 300x200 container → furthest corner is
      // 250px right, 125px down.
      renderer.fadeInRipple(50, 75, {});
      const ripple = container.querySelector('.mat-ripple-element') as HTMLElement;
      const expectedRadius = Math.sqrt(250 * 250 + 125 * 125);

      expect(parseFloat(ripple.style.left)).toBeCloseTo(50 - expectedRadius, 1);
      expect(parseFloat(ripple.style.top)).toBeCloseTo(75 - expectedRadius, 1);
      expect(parseFloat(ripple.style.width)).toBeCloseTo(2 * expectedRadius, 1);
      expect(parseFloat(ripple.style.height)).toBeCloseTo(2 * expectedRadius, 1);
      expect(ripple.classList.contains('mat-ripple-element')).toBe(true);
    });

    it('centered: true ripples from the container center regardless of (x, y)', () => {
      const renderer = new RippleRenderer(container);
      renderer.fadeInRipple(999, 999, {centered: true});
      const radius = Math.sqrt(300 * 300 + 200 * 200) / 2;
      const ripple = container.querySelector('.mat-ripple-element') as HTMLElement;

      expect(parseFloat(ripple.style.left)).toBeCloseTo(150 - radius, 1);
      expect(parseFloat(ripple.style.top)).toBeCloseTo(100 - radius, 1);
    });

    it('a fixed radius overrides the furthest-corner calculation', () => {
      const renderer = new RippleRenderer(container);
      renderer.fadeInRipple(0, 0, {radius: 24});
      const ripple = container.querySelector('.mat-ripple-element') as HTMLElement;
      expect(ripple.style.width).toBe('48px');
      expect(ripple.style.height).toBe('48px');
    });

    it('sets the color as an inline backgroundColor only when given', () => {
      const renderer = new RippleRenderer(container);
      renderer.fadeInRipple(0, 0, {color: 'rgb(1, 2, 3)'});
      const ripple = container.querySelector('.mat-ripple-element') as HTMLElement;
      expect(ripple.style.backgroundColor).toBe('rgb(1, 2, 3)');
    });

    it('defaults to the 225ms enter / 150ms exit animation config', () => {
      const renderer = new RippleRenderer(container);
      const ref = renderer.fadeInRipple(0, 0, {});
      expect(ref.element.style.transitionDuration).toBe('225ms');
    });

    it('honours a custom per-call animation config', () => {
      const renderer = new RippleRenderer(container);
      const ref = renderer.fadeInRipple(0, 0, {animation: {enterDuration: 120, exitDuration: 0}});
      expect(ref.element.style.transitionDuration).toBe('120ms');
    });

    it('sets transform: scale3d(1, 1, 1) to start the enter animation', () => {
      const renderer = new RippleRenderer(container);
      const ref = renderer.fadeInRipple(0, 0, {});
      expect(ref.element.style.transform).toBe('scale3d(1, 1, 1)');
    });
  });

  describe('RippleState lifecycle', () => {
    it('goes FADING_IN -> VISIBLE -> FADING_OUT -> HIDDEN and removes the element', () => {
      const renderer = new RippleRenderer(container);
      const ref = renderer.fadeInRipple(0, 0, {persistent: true});

      expect(ref.state).toBe(RippleState.FADING_IN);
      expect(container.querySelectorAll('.mat-ripple-element').length).toBe(1);

      flushTransition(container);
      expect(ref.state).toBe(RippleState.VISIBLE);
      expect(container.querySelectorAll('.mat-ripple-element').length).toBe(1);

      ref.fadeOut();
      expect(ref.state).toBe(RippleState.FADING_OUT);
      expect(container.querySelectorAll('.mat-ripple-element').length).toBe(1);

      flushTransition(container);
      expect(ref.state).toBe(RippleState.HIDDEN);
      expect(container.querySelectorAll('.mat-ripple-element').length).toBe(0);
    });
  });

  describe('pointer-driven ripples (handleMouseDown/handleTouchStart)', () => {
    it('creates a ripple on mousedown and removes it after mouseup settles', () => {
      const renderer = new RippleRenderer(container);
      const event = mousedown(container);
      renderer.handleMouseDown(event, container, noopTarget());

      expect(container.querySelectorAll('.mat-ripple-element').length).toBe(1);

      // mouseup fires while the ripple is still FADING_IN (hasn't even
      // settled to VISIBLE yet), so `_onPointerUp` itself does nothing yet
      // (matches upstream: only a VISIBLE — or `terminateOnPointerUp` —
      // ripple fades out on pointer-up). The first `transitionend` settles
      // the enter transition; since the pointer is no longer down by then,
      // that settling itself immediately starts the exit transition, which
      // the second `transitionend` then completes, removing the element.
      container.dispatchEvent(new MouseEvent('mouseup'));
      flushTransition(container);
      flushTransition(container);
      expect(container.querySelectorAll('.mat-ripple-element').length).toBe(0);
    });

    it('repeated mousedown creates additional ripples', () => {
      const renderer = new RippleRenderer(container);
      renderer.handleMouseDown(mousedown(container), container, noopTarget());
      renderer.handleMouseDown(mousedown(container), container, noopTarget());
      expect(container.querySelectorAll('.mat-ripple-element').length).toBe(2);
    });

    it('only persists the latest transient ripple once the enter transition settles while held', () => {
      const renderer = new RippleRenderer(container);
      renderer.handleMouseDown(mousedown(container), container, noopTarget());
      renderer.handleMouseDown(mousedown(container), container, noopTarget());
      expect(container.querySelectorAll('.mat-ripple-element').length).toBe(2);

      // Flush the fade-in transition of ripple 0 — it's no longer the most
      // recent transient ripple while the pointer is still down, so it
      // immediately starts (and, since exit duration also settles
      // synchronously below) finishes fading out.
      flushTransition(container, 0);
      flushTransition(container, 0);
      expect(container.querySelectorAll('.mat-ripple-element').length).toBe(1);
    });

    it('ignores a fake mousedown dispatched by a screen reader (buttons === 0)', () => {
      const renderer = new RippleRenderer(container);
      const event = new MouseEvent('mousedown', {buttons: 0, detail: 0});
      renderer.handleMouseDown(event, container, noopTarget());
      expect(container.querySelector('.mat-ripple-element')).toBeFalsy();
    });

    it('does not create a ripple when the target is disabled', () => {
      const renderer = new RippleRenderer(container);
      renderer.handleMouseDown(mousedown(container), container, noopTarget(true));
      expect(container.querySelector('.mat-ripple-element')).toBeFalsy();
    });

    it('creates ripples on touchstart, including multi-touch via changedTouches', () => {
      const renderer = new RippleRenderer(container);
      const touchEvent = new Event('touchstart') as unknown as TouchEvent;
      Object.defineProperty(touchEvent, 'changedTouches', {
        value: [
          {clientX: 0, clientY: 0},
          {clientX: 10, clientY: 10},
          {clientX: 20, clientY: 20},
        ],
      });
      renderer.handleTouchStart(touchEvent, container, noopTarget());
      expect(container.querySelectorAll('.mat-ripple-element').length).toBe(3);
    });

    it('removes ripples once touchend settles', () => {
      const renderer = new RippleRenderer(container);
      const touchEvent = new Event('touchstart') as unknown as TouchEvent;
      Object.defineProperty(touchEvent, 'changedTouches', {value: [{clientX: 0, clientY: 0}]});
      renderer.handleTouchStart(touchEvent, container, noopTarget());
      flushTransition(container);
      expect(container.querySelectorAll('.mat-ripple-element').length).toBe(1);

      container.dispatchEvent(new Event('touchend'));
      flushTransition(container);
      expect(container.querySelectorAll('.mat-ripple-element').length).toBe(0);
    });

    it('clears ripples when the touch sequence is cancelled', () => {
      const renderer = new RippleRenderer(container);
      const touchEvent = new Event('touchstart') as unknown as TouchEvent;
      Object.defineProperty(touchEvent, 'changedTouches', {value: [{clientX: 0, clientY: 0}]});
      renderer.handleTouchStart(touchEvent, container, noopTarget());
      flushTransition(container);

      container.dispatchEvent(new Event('touchcancel'));
      flushTransition(container);
      expect(container.querySelectorAll('.mat-ripple-element').length).toBe(0);
    });

    it('ignores synthetic mouse events shortly after a touchstart', () => {
      const renderer = new RippleRenderer(container);
      const touchEvent = new Event('touchstart') as unknown as TouchEvent;
      Object.defineProperty(touchEvent, 'changedTouches', {value: [{clientX: 0, clientY: 0}]});
      renderer.handleTouchStart(touchEvent, container, noopTarget());
      renderer.handleMouseDown(mousedown(container), container, noopTarget());

      // Still just the one ripple from the touchstart — the synthetic
      // mousedown that immediately follows it on real touch devices was
      // ignored.
      expect(container.querySelectorAll('.mat-ripple-element').length).toBe(1);
    });
  });

  describe('fadeOutAll / fadeOutAllNonPersistent', () => {
    it('fadeOutAll fades out ripples that have not finished entering yet', () => {
      const renderer = new RippleRenderer(container);
      renderer.fadeInRipple(0, 0, {});
      renderer.fadeOutAll();
      flushTransition(container);
      expect(container.querySelectorAll('.mat-ripple-element').length).toBe(0);
    });

    it('fadeOutAllNonPersistent leaves persistent ripples alone', () => {
      const renderer = new RippleRenderer(container);
      const persistent = renderer.fadeInRipple(0, 0, {persistent: true});
      renderer.fadeInRipple(0, 0, {});
      renderer.fadeOutAllNonPersistent();
      flushTransition(container, 1);
      expect(container.querySelectorAll('.mat-ripple-element').length).toBe(1);
      expect(persistent.state).not.toBe(RippleState.HIDDEN);
    });
  });

  describe('persistent ripples', () => {
    it('stay in the DOM through their own enter+exit settling until fadeOut() is called', () => {
      const renderer = new RippleRenderer(container);
      const ref = renderer.fadeInRipple(0, 0, {persistent: true});
      flushTransition(container);
      flushTransition(container);
      expect(container.querySelectorAll('.mat-ripple-element').length).toBe(1);

      ref.fadeOut();
      flushTransition(container);
      expect(container.querySelectorAll('.mat-ripple-element').length).toBe(0);
    });
  });

  describe('getRippleRenderer (registry)', () => {
    it('returns the same renderer instance for the same container', () => {
      const a = getRippleRenderer(container);
      const b = getRippleRenderer(container);
      expect(a).toBe(b);
    });

    it('returns a different renderer instance for a different container', () => {
      const other = document.createElement('div');
      expect(getRippleRenderer(container)).not.toBe(getRippleRenderer(other));
    });
  });
});

describe('ripple-dom helpers', () => {
  let container: HTMLElement;
  let restoreComputedStyle: () => void;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    stubContainerRect(container, {left: 0, top: 0, width: 100, height: 100});
    restoreComputedStyle = stubRealisticComputedStyle();
  });

  afterEach(() => {
    restoreComputedStyle();
    container.remove();
  });

  it('rippleOnMouseDown is a no-op when the container is null/undefined', () => {
    const trigger = document.createElement('button');
    expect(() =>
      rippleOnMouseDown(mousedown(container), trigger, null, noopTarget()),
    ).not.toThrow();
    expect(() =>
      rippleOnMouseDown(mousedown(container), trigger, undefined, noopTarget()),
    ).not.toThrow();
  });

  it('rippleOnMouseDown launches into the container using the given trigger element', () => {
    const trigger = document.createElement('button');
    trigger.appendChild(container);
    document.body.appendChild(trigger);

    const event = new MouseEvent('mousedown', {clientX: 0, clientY: 0, buttons: 1, detail: 1});
    rippleOnMouseDown(event, trigger, container, noopTarget());
    expect(container.querySelectorAll('.mat-ripple-element').length).toBe(1);

    trigger.remove();
  });

  it('rippleOnTouchStart launches into the container using the given trigger element', () => {
    const trigger = document.createElement('button');
    trigger.appendChild(container);
    document.body.appendChild(trigger);

    const touchEvent = new Event('touchstart') as unknown as TouchEvent;
    Object.defineProperty(touchEvent, 'changedTouches', {value: [{clientX: 0, clientY: 0}]});

    rippleOnTouchStart(touchEvent, trigger, container, noopTarget());
    expect(container.querySelectorAll('.mat-ripple-element').length).toBe(1);

    trigger.remove();
  });

  it('launchRipple creates a ripple directly (MatRipple.launch() equivalent)', () => {
    launchRipple(container, 0, 0, {persistent: true});
    expect(container.querySelectorAll('.mat-ripple-element').length).toBe(1);
  });

  it('fadeOutAllRipples / fadeOutAllNonPersistentRipples delegate to the cached renderer', () => {
    launchRipple(container, 0, 0, {});
    fadeOutAllRipples(container);
    flushTransition(container);
    expect(container.querySelectorAll('.mat-ripple-element').length).toBe(0);
  });

  it('fadeOutAllNonPersistentRipples', () => {
    launchRipple(container, 0, 0, {persistent: true});
    launchRipple(container, 0, 0, {});
    fadeOutAllNonPersistentRipples(container);
    flushTransition(container, 1);
    expect(container.querySelectorAll('.mat-ripple-element').length).toBe(1);
  });

  describe('rippleAnimationConfig', () => {
    it('returns undefined (no override) when animations are enabled and no override given', () => {
      expect(rippleAnimationConfig(false)).toBeUndefined();
    });

    it('passes through a given override when animations are enabled', () => {
      expect(rippleAnimationConfig(false, {enterDuration: 10})).toEqual({enterDuration: 10});
    });

    it('forces both durations to 0 when animations are disabled, overriding any given config', () => {
      expect(rippleAnimationConfig(true, {enterDuration: 500, exitDuration: 500})).toEqual({
        enterDuration: 0,
        exitDuration: 0,
      });
    });
  });
});
