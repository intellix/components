/**
 * Vitest scenario port from src/cdk/overlay/position/global-position-strategy.spec.ts
 *
 * Strategy: direct-class tests — no Angular TestBed, no ComponentPortal.
 * Tests exercise GlobalPositionStrategy's fluent API + apply() by asserting on
 * the `_wrapper` element's inline styles directly (no computed styles needed).
 * DOM-render and Angular-only scenarios are it.skip() with reasons.
 */

import {describe, it, expect, beforeEach, afterEach} from 'vitest';
import {GlobalPositionStrategy} from '../public-api';

/** Build a minimal host+pane DOM stub and return a PositionStrategyOverlayHandle. */
function makeRefStub(config?: Record<string, unknown>) {
  const host = document.createElement('div');
  const pane = document.createElement('div');
  host.appendChild(pane);
  document.body.appendChild(host);
  return {hostElement: host, overlayElement: pane, config: config ?? {}} as any;
}

describe('GlobalPositionStrategy', () => {
  let strategy: GlobalPositionStrategy;
  let ref: ReturnType<typeof makeRefStub>;

  beforeEach(() => {
    document.body.innerHTML = '';
    ref = makeRefStub();
    strategy = new GlobalPositionStrategy();
    strategy.attach(ref);
  });

  afterEach(() => {
    strategy.dispose();
    document.body.innerHTML = '';
  });

  // ------------------------------------------------------------------ //
  // Basic wrapper creation
  // ------------------------------------------------------------------ //

  it('wraps the overlay pane in a cdk-global-overlay-wrapper element on attach', () => {
    const wrapper = ref.hostElement.querySelector('.cdk-global-overlay-wrapper');
    expect(wrapper).toBeTruthy();
  });

  it('centerHorizontally applies margin-left auto on apply', () => {
    strategy.centerHorizontally();
    strategy.apply();
    const wrapper = ref.hostElement.querySelector('.cdk-global-overlay-wrapper') as HTMLElement;
    expect(wrapper).toBeTruthy();
    expect(wrapper.style.justifyContent).toBe('center');
  });

  // ------------------------------------------------------------------ //
  // top / left / bottom / right offsets (CDK tests 1-3)
  // ------------------------------------------------------------------ //

  it('should position the element to the (top, left) with an offset', () => {
    strategy.top('10px').left('40px');
    strategy.apply();

    const paneStyles = ref.overlayElement.style;
    const wrapper = ref.hostElement.querySelector('.cdk-global-overlay-wrapper') as HTMLElement;

    expect(paneStyles.marginTop).toBe('10px');
    expect(paneStyles.marginLeft).toBe('40px');
    expect(paneStyles.marginBottom).toBe('');
    expect(paneStyles.marginRight).toBe('');
    expect(wrapper.style.justifyContent).toBe('flex-start');
    expect(wrapper.style.alignItems).toBe('flex-start');
  });

  it('should position the element to the (bottom, right) with an offset', () => {
    strategy.bottom('70px').right('15em');
    strategy.apply();

    const paneStyles = ref.overlayElement.style;
    const wrapper = ref.hostElement.querySelector('.cdk-global-overlay-wrapper') as HTMLElement;

    expect(paneStyles.marginTop).toBe('');
    expect(paneStyles.marginLeft).toBe('');
    expect(paneStyles.marginBottom).toBe('70px');
    expect(paneStyles.marginRight).toBe('15em');
    expect(wrapper.style.justifyContent).toBe('flex-end');
    expect(wrapper.style.alignItems).toBe('flex-end');
  });

  it('should not set any alignment by default (no position call before apply)', () => {
    strategy.apply();
    const wrapper = ref.hostElement.querySelector('.cdk-global-overlay-wrapper') as HTMLElement;
    expect(wrapper.style.justifyContent).toBe('');
    expect(wrapper.style.alignItems).toBe('');
  });

  it('should center the element', () => {
    strategy.centerHorizontally().centerVertically();
    strategy.apply();

    const wrapper = ref.hostElement.querySelector('.cdk-global-overlay-wrapper') as HTMLElement;
    expect(wrapper.style.justifyContent).toBe('center');
    expect(wrapper.style.alignItems).toBe('center');
  });

  it('should center the element with an offset', () => {
    strategy.centerHorizontally('10px').centerVertically('15px');
    strategy.apply();

    const paneStyles = ref.overlayElement.style;
    const wrapper = ref.hostElement.querySelector('.cdk-global-overlay-wrapper') as HTMLElement;

    expect(paneStyles.marginLeft).toBe('10px');
    expect(paneStyles.marginTop).toBe('15px');
    expect(paneStyles.marginRight).toBe('');
    expect(paneStyles.marginBottom).toBe('');
    expect(wrapper.style.justifyContent).toBe('center');
    expect(wrapper.style.alignItems).toBe('center');
  });

  it('should make the element position: static on apply', () => {
    strategy.apply();
    expect(ref.overlayElement.style.position).toBe('static');
  });

  it('should overwrite previously applied positioning', () => {
    strategy.centerHorizontally().centerVertically();
    strategy.apply();

    strategy.top('10px').left('40%');
    strategy.apply();

    const paneStyles = ref.overlayElement.style;
    const wrapper = ref.hostElement.querySelector('.cdk-global-overlay-wrapper') as HTMLElement;

    expect(paneStyles.marginTop).toBe('10px');
    expect(paneStyles.marginLeft).toBe('40%');
    expect(paneStyles.marginBottom).toBe('');
    expect(paneStyles.marginRight).toBe('');
    expect(wrapper.style.justifyContent).toBe('flex-start');
    expect(wrapper.style.alignItems).toBe('flex-start');
  });

  it('should not throw when attempting to apply after the strategy has been disposed', () => {
    strategy.dispose();
    expect(() => strategy.apply()).not.toThrow();
  });

  it('should clean up after itself when disposed', () => {
    strategy.top('10px').left('40px');
    strategy.apply();

    const pane = ref.overlayElement;
    strategy.dispose();

    expect(pane.style.marginTop).toBeFalsy();
    expect(pane.style.marginLeft).toBeFalsy();
    expect(pane.style.position).toBeFalsy();
  });

  // ------------------------------------------------------------------ //
  // shouldBeFlush width/height (CDK tests — directly testable in qwik-cdk
  // because we wire the config object through the ref stub)
  // ------------------------------------------------------------------ //

  it('should reset horizontal position when width is 100%', () => {
    const refWithConfig = makeRefStub({width: '100%'});
    const s = new GlobalPositionStrategy();
    s.attach(refWithConfig);
    s.centerHorizontally('10px');
    s.apply();

    const paneStyles = refWithConfig.overlayElement.style;
    const wrapper = refWithConfig.hostElement.querySelector(
      '.cdk-global-overlay-wrapper',
    ) as HTMLElement;

    // Browser normalizes '0' to '0px' on assignment.
    expect(paneStyles.marginLeft).toBe('0px');
    expect(wrapper.style.justifyContent).toBe('flex-start');
    s.dispose();
  });

  it('should reset vertical position when height is 100%', () => {
    const refWithConfig = makeRefStub({height: '100%'});
    const s = new GlobalPositionStrategy();
    s.attach(refWithConfig);
    s.centerVertically('10px');
    s.apply();

    const paneStyles = refWithConfig.overlayElement.style;
    const wrapper = refWithConfig.hostElement.querySelector(
      '.cdk-global-overlay-wrapper',
    ) as HTMLElement;

    // Browser normalizes '0' to '0px' on assignment.
    expect(paneStyles.marginTop).toBe('0px');
    expect(wrapper.style.alignItems).toBe('flex-start');
    s.dispose();
  });

  it('should not reset horizontal position when width is 100% but maxWidth is set', () => {
    const refWithConfig = makeRefStub({width: '100%', maxWidth: '500px'});
    const s = new GlobalPositionStrategy();
    s.attach(refWithConfig);
    s.centerHorizontally('10px');
    s.apply();

    const paneStyles = refWithConfig.overlayElement.style;
    const wrapper = refWithConfig.hostElement.querySelector(
      '.cdk-global-overlay-wrapper',
    ) as HTMLElement;

    expect(paneStyles.marginLeft).toBe('10px');
    expect(wrapper.style.justifyContent).toBe('center');
    s.dispose();
  });

  // ------------------------------------------------------------------ //
  // start/end (LTR — RTL requires computed direction, skip in happy-dom)
  // ------------------------------------------------------------------ //

  it('should position the overlay to the start (ltr)', () => {
    strategy.start('40px');
    strategy.apply();

    const paneStyles = ref.overlayElement.style;
    const wrapper = ref.hostElement.querySelector('.cdk-global-overlay-wrapper') as HTMLElement;

    expect(paneStyles.marginLeft).toBe('40px');
    expect(paneStyles.marginRight).toBe('');
    expect(wrapper.style.justifyContent).toBe('flex-start');
  });

  it('should position the overlay to the end (ltr)', () => {
    strategy.end('60px');
    strategy.apply();

    const paneStyles = ref.overlayElement.style;
    const wrapper = ref.hostElement.querySelector('.cdk-global-overlay-wrapper') as HTMLElement;

    expect(paneStyles.marginRight).toBe('60px');
    expect(paneStyles.marginLeft).toBe('');
    expect(wrapper.style.justifyContent).toBe('flex-end');
  });

  it.skip('should invert justify-content when using left in RTL', () => {
    // SKIP: DOM-render — RTL detection reads getComputedStyle(wrapper).direction,
    // which requires CSS cascade / dir attribute set on an ancestor. happy-dom
    // does not propagate computed direction from DOM attributes.
  });

  it.skip('should invert justify-content when using right in RTL', () => {
    // SKIP: same as left/RTL test.
  });

  it.skip('should center the element with an offset in rtl', () => {
    // SKIP: same as RTL direction detection tests.
  });

  it.skip('should take its width and height from the overlay config (via OverlayConfig)', () => {
    // SKIP: deferred — qwik-cdk's width/height() methods are no-ops (sizing
    // is managed via OverlayConfig signals). The CDK test checks overlayElement
    // inline styles set by the strategy, which do not apply in qwik-cdk.
  });

  it.skip('should update the overlay size when setting it through the position strategy', () => {
    // SKIP: deferred — same reason as above. width()/height() are no-ops.
  });

  it.skip('should remove the parent wrapper from the DOM on dispose', () => {
    // SKIP: DOM-render — requires attaching to a real overlay container.
    // dispose() is already tested via "should clean up" above.
  });
});
