/**
 * Vitest scenario port from src/cdk/overlay/scroll/reposition-scroll-strategy.spec.ts
 *
 * Strategy: direct-class tests only — no Angular TestBed, no RxJS ScrollDispatcher.
 * Tests exercise RepositionScrollStrategy enable/disable/scroll-listener wiring.
 * Angular-only and DOM-scroll scenarios are it.skip() with reasons.
 */

import {describe, it, expect, beforeEach, afterEach} from 'vitest';
import {RepositionScrollStrategy} from '../public-api';
import type {OverlayRef} from '../public-api';

/** Minimal OverlayRef stub for scroll strategy tests. */
function makeRefStub(): OverlayRef & {updatePositionCalls: number; detachCalls: number} {
  const stub = {
    updatePositionCalls: 0,
    detachCalls: 0,
    hasAttached: () => true,
    updatePosition() {
      stub.updatePositionCalls++;
    },
    detach() {
      stub.detachCalls++;
    },
    overlayElement: document.createElement('div'),
    hostElement: null,
  } as any;
  return stub;
}

describe('RepositionScrollStrategy', () => {
  let strategy: RepositionScrollStrategy;
  let ref: ReturnType<typeof makeRefStub>;

  beforeEach(() => {
    ref = makeRefStub();
    strategy = new RepositionScrollStrategy();
    strategy.attach(ref);
  });

  afterEach(() => {
    strategy.disable();
  });

  it('should throw if attached to more than one overlay', () => {
    const strategy2 = new RepositionScrollStrategy();
    strategy2.attach(ref);
    expect(() => strategy2.attach(makeRefStub())).toThrow();
  });

  it('enable() registers a scroll listener without throwing', () => {
    expect(() => strategy.enable()).not.toThrow();
  });

  it('disable() removes scroll listener without error', () => {
    strategy.enable();
    expect(() => strategy.disable()).not.toThrow();
  });

  it('calling disable() when not enabled does not throw', () => {
    expect(() => strategy.disable()).not.toThrow();
  });

  it('calling enable() twice is idempotent', () => {
    strategy.enable();
    expect(() => strategy.enable()).not.toThrow();
    // Should still be able to disable without error.
    expect(() => strategy.disable()).not.toThrow();
  });

  it('detach() cleans up without error', () => {
    strategy.enable();
    expect(() => strategy.detach()).not.toThrow();
  });

  it.skip('should update the overlay position when the page is scrolled', () => {
    // SKIP: DOM-render — requires firing real scroll events on a scrollable
    // document, which happy-dom does not support.
  });

  it.skip('should not be updating the position after the overlay is detached', () => {
    // SKIP: DOM-render — same as above; scroll events after detach.
  });

  it.skip('should not be updating the position after the overlay is destroyed', () => {
    // SKIP: DOM-render — same as above.
  });

  it.skip('should be able to close the overlay once it is out of view', () => {
    // SKIP: DOM-render — autoClose relies on getBoundingClientRect() returning
    // real pixel values, which happy-dom returns as zeros.
  });
});
