import {describe, it, expect, vi, beforeEach, afterEach} from 'vitest';
import {
  hideRippleKind,
  isRippleKindShown,
  isShowingAnyRipple,
  showRippleKind,
  type RippleCapableThumb,
} from './slider-ripple';

describe('slider-ripple', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('showRippleKind creates a slot with the kind-specific class', () => {
    const thumb: RippleCapableThumb = {};
    showRippleKind(thumb, 'hover', false);
    expect(thumb.hoverRipple).toBeDefined();
    expect(thumb.hoverRipple?.extraClass).toBe('mat-mdc-slider-hover-ripple');
    expect(thumb.hoverRipple?.exiting).toBe(false);
  });

  it('showRippleKind is idempotent while already showing', () => {
    const thumb: RippleCapableThumb = {};
    showRippleKind(thumb, 'focus', false);
    const first = thumb.focusRipple;
    showRippleKind(thumb, 'focus', false);
    expect(thumb.focusRipple).toBe(first);
  });

  it('hover/focus (0ms exit) are removed synchronously on hide', () => {
    const thumb: RippleCapableThumb = {};
    showRippleKind(thumb, 'hover', false);
    hideRippleKind(thumb, 'hover');
    expect(thumb.hoverRipple).toBeUndefined();
  });

  it('active (400ms exit) stays present until the timer fires', () => {
    const thumb: RippleCapableThumb = {};
    showRippleKind(thumb, 'active', false);
    hideRippleKind(thumb, 'active');
    expect(thumb.activeRipple).toBeDefined();
    expect(thumb.activeRipple?.exiting).toBe(true);
    vi.advanceTimersByTime(399);
    expect(thumb.activeRipple).toBeDefined();
    vi.advanceTimersByTime(1);
    expect(thumb.activeRipple).toBeUndefined();
  });

  it('noopAnimations forces both durations to 0 regardless of kind', () => {
    const thumb: RippleCapableThumb = {};
    showRippleKind(thumb, 'active', true);
    hideRippleKind(thumb, 'active');
    expect(thumb.activeRipple).toBeUndefined();
  });

  it('isShowingAnyRipple is true while any of the three slots is visible (not exiting)', () => {
    const thumb: RippleCapableThumb = {};
    expect(isShowingAnyRipple(thumb)).toBe(false);
    showRippleKind(thumb, 'focus', false);
    expect(isShowingAnyRipple(thumb)).toBe(true);
    expect(isRippleKindShown(thumb, 'focus')).toBe(true);
    expect(isRippleKindShown(thumb, 'hover')).toBe(false);
  });

  it('a stale exit timer from a superseded show is a no-op', () => {
    const thumb: RippleCapableThumb = {};
    showRippleKind(thumb, 'active', false);
    hideRippleKind(thumb, 'active'); // schedules removal in 400ms
    vi.advanceTimersByTime(200);
    // Re-shown before the first timer fires — gets a fresh token.
    showRippleKind(thumb, 'active', false);
    const second = thumb.activeRipple;
    vi.advanceTimersByTime(200); // first timer's original 400ms elapses
    // Still showing — the stale timer didn't clear the new slot.
    expect(thumb.activeRipple).toBe(second);
  });
});
