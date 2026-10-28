import {describe, expect, it, vi, beforeEach, afterEach} from 'vitest';
import {createLiveAnnouncer} from './live-announcer';

describe('LiveAnnouncer', () => {
  afterEach(() => {
    // Clean up any stray live elements between tests (mirrors upstream's own
    // "remove any old containers" defensive cleanup in `_createLiveElement`).
    document.querySelectorAll('.cdk-live-announcer-element').forEach(el => el.remove());
  });

  it('does not create a live element until announce() is called', () => {
    createLiveAnnouncer();
    expect(document.querySelector('.cdk-live-announcer-element')).toBeNull();
  });

  it('creates a visually-hidden, aria-atomic live element on first announce()', async () => {
    vi.useFakeTimers();
    const live = createLiveAnnouncer();
    const promise = live.announce('hello');
    const el = document.querySelector('.cdk-live-announcer-element');
    expect(el).not.toBeNull();
    expect(el!.classList.contains('cdk-visually-hidden')).toBe(true);
    expect(el!.getAttribute('aria-atomic')).toBe('true');
    expect(el!.id).toMatch(/^cdk-live-announcer-\d+$/);
    await vi.advanceTimersByTimeAsync(100);
    await promise;
    expect(el!.textContent).toBe('hello');
    vi.useRealTimers();
  });

  it('defaults politeness to "polite" and reflects a custom politeness as an attribute', async () => {
    vi.useFakeTimers();
    const live = createLiveAnnouncer();
    await Promise.all([live.announce('a'), vi.advanceTimersByTimeAsync(100)]);
    const el = document.querySelector('.cdk-live-announcer-element')!;
    expect(el.getAttribute('aria-live')).toBe('polite');

    await Promise.all([live.announce('b', 'assertive'), vi.advanceTimersByTimeAsync(100)]);
    expect(el.getAttribute('aria-live')).toBe('assertive');
    vi.useRealTimers();
  });

  it('clears the element after `duration` ms when provided', async () => {
    vi.useFakeTimers();
    const live = createLiveAnnouncer();
    await Promise.all([live.announce('hi', 'polite', 50), vi.advanceTimersByTimeAsync(100)]);
    const el = document.querySelector('.cdk-live-announcer-element')!;
    expect(el.textContent).toBe('hi');
    await vi.advanceTimersByTimeAsync(50);
    expect(el.textContent).toBe('');
    vi.useRealTimers();
  });

  it('clear() empties the live element immediately', async () => {
    vi.useFakeTimers();
    const live = createLiveAnnouncer();
    await Promise.all([live.announce('hi'), vi.advanceTimersByTimeAsync(100)]);
    const el = document.querySelector('.cdk-live-announcer-element')!;
    expect(el.textContent).toBe('hi');
    live.clear();
    expect(el.textContent).toBe('');
    vi.useRealTimers();
  });

  it('clear() before any announce() is a no-op (no element created)', () => {
    const live = createLiveAnnouncer();
    expect(() => live.clear()).not.toThrow();
    expect(document.querySelector('.cdk-live-announcer-element')).toBeNull();
  });

  it('destroy() removes the live element from the DOM', async () => {
    vi.useFakeTimers();
    const live = createLiveAnnouncer();
    await Promise.all([live.announce('hi'), vi.advanceTimersByTimeAsync(100)]);
    expect(document.querySelector('.cdk-live-announcer-element')).not.toBeNull();
    live.destroy();
    expect(document.querySelector('.cdk-live-announcer-element')).toBeNull();
    vi.useRealTimers();
  });

  it('exposes aria-owns on any open modal so the live region stays accessible', async () => {
    vi.useFakeTimers();
    const container = document.createElement('div');
    container.className = 'cdk-overlay-container';
    const modal = document.createElement('div');
    modal.setAttribute('aria-modal', 'true');
    container.appendChild(modal);
    document.body.appendChild(container);

    const live = createLiveAnnouncer();
    await Promise.all([live.announce('hi'), vi.advanceTimersByTimeAsync(100)]);
    const el = document.querySelector('.cdk-live-announcer-element')!;
    expect(modal.getAttribute('aria-owns')).toBe(el.id);

    container.remove();
    vi.useRealTimers();
  });
});
