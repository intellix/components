import {describe, expect, it, vi} from 'vitest';
import type {Signal} from '@qwik.dev/core';
import {
  createMatSnackBarRef,
  MARK_DISMISSED,
  MARK_OPENED,
  REGISTER_EXIT_HANDLER,
} from './mat-snack-bar-ref';

function makeSignal<T>(v: T): Signal<T> {
  return {value: v} as Signal<T>;
}

describe('createMatSnackBarRef', () => {
  it('exposes the id it was constructed with', () => {
    const ref = createMatSnackBarRef({
      id: 'mat-snack-bar-0',
      instance: makeSignal(null),
      dispose() {},
    });
    expect(ref.id).toBe('mat-snack-bar-0');
  });

  it('instance stays whatever signal was passed in (always null in practice — see class doc comment)', () => {
    const instance = makeSignal<string | null>(null);
    const ref = createMatSnackBarRef({id: 'x', instance, dispose() {}});
    expect(ref.instance).toBe(instance);
  });

  it('dismiss() calls the registered exit handler', () => {
    const ref = createMatSnackBarRef({id: 'x', instance: makeSignal(null), dispose() {}});
    const handler = vi.fn();
    ref[REGISTER_EXIT_HANDLER](handler);
    ref.dismiss();
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it('dismiss() replays immediately if called BEFORE the exit handler is registered', () => {
    // Mirrors the "replace" path in mat-snack-bar.tsx: dismiss() may be
    // called on a ref whose container hasn't mounted (and thus hasn't
    // registered its real exit handler) yet.
    const ref = createMatSnackBarRef({id: 'x', instance: makeSignal(null), dispose() {}});
    ref.dismiss();
    const handler = vi.fn();
    ref[REGISTER_EXIT_HANDLER](handler);
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it('dismiss() called twice only invokes the exit handler once', () => {
    const ref = createMatSnackBarRef({id: 'x', instance: makeSignal(null), dispose() {}});
    const handler = vi.fn();
    ref[REGISTER_EXIT_HANDLER](handler);
    ref.dismiss();
    ref.dismiss();
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it('[MARK_DISMISSED] disposes and resolves afterDismissed with dismissedByAction: false by default', async () => {
    const dispose = vi.fn();
    const ref = createMatSnackBarRef({id: 'x', instance: makeSignal(null), dispose});
    ref[MARK_DISMISSED]();
    await expect(ref.afterDismissed).resolves.toEqual({dismissedByAction: false});
    expect(dispose).toHaveBeenCalledTimes(1);
  });

  it('[MARK_DISMISSED] called twice disposes only once and keeps the first resolution', async () => {
    const dispose = vi.fn();
    const ref = createMatSnackBarRef({id: 'x', instance: makeSignal(null), dispose});
    ref[MARK_DISMISSED]();
    ref[MARK_DISMISSED]();
    expect(dispose).toHaveBeenCalledTimes(1);
    await expect(ref.afterDismissed).resolves.toEqual({dismissedByAction: false});
  });

  it('dismissWithAction() marks dismissedByAction true and resolves onAction before dismissing', async () => {
    const ref = createMatSnackBarRef({id: 'x', instance: makeSignal(null), dispose() {}});
    const handler = vi.fn();
    ref[REGISTER_EXIT_HANDLER](handler);
    ref.dismissWithAction();
    await expect(ref.onAction).resolves.toBeUndefined();
    expect(handler).toHaveBeenCalledTimes(1);
    ref[MARK_DISMISSED]();
    await expect(ref.afterDismissed).resolves.toEqual({dismissedByAction: true});
  });

  it('dismissWithAction() called twice only resolves onAction once', async () => {
    const ref = createMatSnackBarRef({id: 'x', instance: makeSignal(null), dispose() {}});
    const onActionSpy = vi.fn();
    ref.onAction.then(onActionSpy);
    ref.dismissWithAction();
    ref.dismissWithAction();
    await Promise.resolve();
    await Promise.resolve();
    expect(onActionSpy).toHaveBeenCalledTimes(1);
  });

  it('[MARK_OPENED] resolves afterOpened', async () => {
    const ref = createMatSnackBarRef({id: 'x', instance: makeSignal(null), dispose() {}});
    ref[MARK_OPENED]();
    await expect(ref.afterOpened).resolves.toBeUndefined();
  });

  it('_dismissAfter(duration) dismisses after the timer fires', () => {
    vi.useFakeTimers();
    const ref = createMatSnackBarRef({id: 'x', instance: makeSignal(null), dispose() {}});
    const handler = vi.fn();
    ref[REGISTER_EXIT_HANDLER](handler);
    ref._dismissAfter(1000);
    expect(handler).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1000);
    expect(handler).toHaveBeenCalledTimes(1);
    vi.useRealTimers();
  });

  it('dismiss() clears a pending _dismissAfter timeout', () => {
    vi.useFakeTimers();
    const ref = createMatSnackBarRef({id: 'x', instance: makeSignal(null), dispose() {}});
    const handler = vi.fn();
    ref[REGISTER_EXIT_HANDLER](handler);
    ref._dismissAfter(1000);
    ref.dismiss();
    expect(handler).toHaveBeenCalledTimes(1);
    vi.advanceTimersByTime(1000);
    // Still just once — the duration timer should have been cleared by dismiss().
    expect(handler).toHaveBeenCalledTimes(1);
    vi.useRealTimers();
  });

  it('constructs pre-closed (SSR no-op) when closed: true — all promises resolve immediately', async () => {
    const ref = createMatSnackBarRef({
      id: 'ssr',
      instance: makeSignal(null),
      dispose() {},
      closed: true,
    });
    await expect(ref.afterOpened).resolves.toBeUndefined();
    await expect(ref.afterDismissed).resolves.toEqual({dismissedByAction: false});
  });
});
