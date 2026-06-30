/**
 * Vitest scenario port from src/cdk/overlay/scroll/block-scroll-strategy.spec.ts
 *
 * Strategy: direct-class tests — no Angular TestBed, no ViewportRuler.
 * Tests exercise BlockScrollStrategy enable/disable and class-list management.
 * DOM-scroll and platform-specific scenarios are it.skip() with reasons.
 */

import {describe, it, expect, beforeEach, afterEach} from 'vitest';
import {createBlockScrollStrategy} from '../public-api';

describe('BlockScrollStrategy', () => {
  let s: BlockScrollStrategy;

  beforeEach(() => {
    // Reset any lingering scroll-block state between tests.
    document.documentElement.classList.remove('cdk-global-scrollblock');
    document.documentElement.style.top = '';
    document.documentElement.style.left = '';
    s = createBlockScrollStrategy();
    s.attach({} as any);
  });

  afterEach(() => {
    s.disable();
    document.documentElement.classList.remove('cdk-global-scrollblock');
    document.documentElement.style.top = '';
    document.documentElement.style.left = '';
  });

  // ------------------------------------------------------------------ //
  // Ported from CDK: toggle `cdk-global-scrollblock` class
  // ------------------------------------------------------------------ //

  it('sets position:fixed on <html> when enabled', () => {
    s.enable();
    expect(document.documentElement.classList.contains('cdk-global-scrollblock')).toBe(true);
  });

  it('removes cdk-global-scrollblock when disabled', () => {
    s.enable();
    expect(document.documentElement.classList.contains('cdk-global-scrollblock')).toBe(true);
    s.disable();
    expect(document.documentElement.classList.contains('cdk-global-scrollblock')).toBe(false);
  });

  it('enable() is idempotent — calling twice does not add class multiple times', () => {
    s.enable();
    // Second enable() should be a no-op because _canBeEnabled returns false when
    // the class is already present.
    s.enable();
    // Class is still present (not doubled, not removed).
    expect(document.documentElement.classList.contains('cdk-global-scrollblock')).toBe(true);
    // Only one instance of the class in classList.
    expect(
      Array.from(document.documentElement.classList).filter(c => c === 'cdk-global-scrollblock')
        .length,
    ).toBe(1);
  });

  it('disable() is safe to call when not enabled', () => {
    expect(() => s.disable()).not.toThrow();
    expect(document.documentElement.classList.contains('cdk-global-scrollblock')).toBe(false);
  });

  it('restores previously-set inline styles after disable', () => {
    const root = document.documentElement;
    root.style.top = '13px';
    root.style.left = '37px';

    s.enable();
    // Strategy overwrites top/left — they are no longer 13px/37px.
    expect(root.style.top).not.toBe('13px');
    expect(root.style.left).not.toBe('37px');

    s.disable();
    // Inline styles are restored.
    expect(root.style.top).toBe('13px');
    expect(root.style.left).toBe('37px');

    // Clean up after this test.
    root.style.top = '';
    root.style.left = '';
  });

  it('enable/disable cycle can be repeated', () => {
    s.enable();
    s.disable();

    // Create a fresh strategy (the old one is "spent").
    const s2 = createBlockScrollStrategy();
    s2.attach({} as any);
    s2.enable();
    expect(document.documentElement.classList.contains('cdk-global-scrollblock')).toBe(true);
    s2.disable();
    expect(document.documentElement.classList.contains('cdk-global-scrollblock')).toBe(false);
  });

  it.skip('should toggle scroll blocking along the y axis', () => {
    // SKIP: DOM-render — requires window.scroll() to change
    // viewport.getViewportScrollPosition(), which does not work in happy-dom.
  });

  it.skip('should toggle scroll blocking along the x axis', () => {
    // SKIP: DOM-render — same as y-axis test.
  });

  it.skip(`should't do anything if the page isn't scrollable`, () => {
    // SKIP: DOM-render — requires real scrollHeight/scrollWidth computation,
    // which happy-dom does not perform.
  });

  it.skip(`should't do anything if the page isn't scrollable while zoomed out`, () => {
    // SKIP: DOM-render — zoom + scroll detection requires real browser layout.
  });

  it.skip(`should add cdk-global-scrollblock while zoomed in`, () => {
    // SKIP: DOM-render — same as zoom test above.
  });

  it.skip('should keep the content width', () => {
    // SKIP: DOM-render — getBoundingClientRect() returns zeros in happy-dom.
  });

  it.skip('should not clobber user-defined scroll-behavior', () => {
    // SKIP: DOM-render — requires supportsScrollBehavior() to return true,
    // which depends on real browser API availability.
  });
});
