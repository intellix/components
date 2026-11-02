import {describe, it, expect, vi} from 'vitest';
import type {Signal} from '@qwik.dev/core';
import {
  createMatBottomSheetRef,
  MARK_CLOSED,
  MARK_OPENED,
  REGISTER_ANIMATION_HANDLERS,
  TRIGGER_ENTER,
} from './mat-bottom-sheet-ref';

function makeSignal<T>(v: T): Signal<T> {
  return {value: v} as Signal<T>;
}

function makeCdkRefStub() {
  const calls: string[] = [];
  return {
    dispose: () => calls.push('dispose'),
    detachBackdrop: () => calls.push('detachBackdrop'),
    calls,
  };
}

describe('createMatBottomSheetRef', () => {
  it('exposes id and config', () => {
    const ref = createMatBottomSheetRef({
      cdkRef: makeCdkRefStub(),
      config: {ariaLabel: 'hi'},
      instance: makeSignal(null),
      id: 'cdk-dialog-1',
    });
    expect(ref.id).toBe('cdk-dialog-1');
    expect(ref.config.ariaLabel).toBe('hi');
  });

  it('[TRIGGER_ENTER] invokes the registered enter() handler', () => {
    const ref = createMatBottomSheetRef({
      cdkRef: makeCdkRefStub(),
      config: {},
      instance: makeSignal(null),
      id: 'x',
    });
    const enter = vi.fn();
    const exit = vi.fn();
    ref[REGISTER_ANIMATION_HANDLERS]({enter, exit});
    ref[TRIGGER_ENTER]();
    expect(enter).toHaveBeenCalledTimes(1);
    expect(exit).not.toHaveBeenCalled();
  });

  it('[TRIGGER_ENTER] called BEFORE [REGISTER_ANIMATION_HANDLERS] still fires enter() once registration lands', () => {
    // Regression: `useMatBottomSheet().open$` calls `[TRIGGER_ENTER]()`
    // synchronously right after creating the overlay entry when no sheet
    // is already open — but the real `MatBottomSheetContainer` only
    // registers its handlers once Qwik actually renders that entry, which
    // never happens synchronously within the same call. Without the
    // "sticky" request flag, this trigger would be silently dropped and
    // the sheet would never animate in.
    const ref = createMatBottomSheetRef({
      cdkRef: makeCdkRefStub(),
      config: {},
      instance: makeSignal(null),
      id: 'x',
    });
    ref[TRIGGER_ENTER]();
    const enter = vi.fn();
    ref[REGISTER_ANIMATION_HANDLERS]({enter, exit: () => {}});
    expect(enter).toHaveBeenCalledTimes(1);
  });

  it('dismiss() called BEFORE [REGISTER_ANIMATION_HANDLERS] still fires exit() once registration lands', () => {
    const ref = createMatBottomSheetRef({
      cdkRef: makeCdkRefStub(),
      config: {},
      instance: makeSignal(null),
      id: 'x',
    });
    ref.dismiss();
    const exit = vi.fn();
    ref[REGISTER_ANIMATION_HANDLERS]({enter: () => {}, exit});
    expect(exit).toHaveBeenCalledTimes(1);
  });

  it('[MARK_OPENED] resolves afterOpened', async () => {
    const ref = createMatBottomSheetRef({
      cdkRef: makeCdkRefStub(),
      config: {},
      instance: makeSignal(null),
      id: 'x',
    });
    ref[MARK_OPENED]();
    await expect(ref.afterOpened).resolves.toBeUndefined();
  });

  it('dismiss() detaches the backdrop immediately and invokes the registered exit() handler', () => {
    const cdk = makeCdkRefStub();
    const ref = createMatBottomSheetRef({
      cdkRef: cdk,
      config: {},
      instance: makeSignal(null),
      id: 'x',
    });
    const exit = vi.fn();
    ref[REGISTER_ANIMATION_HANDLERS]({enter: () => {}, exit});
    ref.dismiss('bye');
    expect(cdk.calls).toContain('detachBackdrop');
    expect(exit).toHaveBeenCalledTimes(1);
  });

  it('[MARK_CLOSED] disposes the overlay and resolves afterDismissed with the dismiss result', async () => {
    const cdk = makeCdkRefStub();
    const ref = createMatBottomSheetRef<string>({
      cdkRef: cdk,
      config: {},
      instance: makeSignal(null),
      id: 'x',
    });
    ref.dismiss('result-value');
    ref[MARK_CLOSED]();
    await expect(ref.afterDismissed).resolves.toBe('result-value');
    expect(cdk.calls).toContain('dispose');
  });

  it('dismiss() called twice is idempotent — exit() only triggers once', () => {
    const ref = createMatBottomSheetRef({
      cdkRef: makeCdkRefStub(),
      config: {},
      instance: makeSignal(null),
      id: 'x',
    });
    const exit = vi.fn();
    ref[REGISTER_ANIMATION_HANDLERS]({enter: () => {}, exit});
    ref.dismiss('first');
    ref.dismiss('second');
    expect(exit).toHaveBeenCalledTimes(1);
  });

  it('[MARK_CLOSED] called twice is idempotent — dispose() only runs once', () => {
    const cdk = makeCdkRefStub();
    const ref = createMatBottomSheetRef({
      cdkRef: cdk,
      config: {},
      instance: makeSignal(null),
      id: 'x',
    });
    ref.dismiss();
    ref[MARK_CLOSED]();
    ref[MARK_CLOSED]();
    expect(cdk.calls.filter(c => c === 'dispose')).toHaveLength(1);
  });

  it('disableClose mirrors config.disableClose', () => {
    const ref = createMatBottomSheetRef({
      cdkRef: makeCdkRefStub(),
      config: {disableClose: true},
      instance: makeSignal(null),
      id: 'x',
    });
    expect(ref.disableClose).toBe(true);
  });

  it('SSR no-op (ssr: true) resolves afterOpened/afterDismissed immediately', async () => {
    const ref = createMatBottomSheetRef<string>({
      cdkRef: makeCdkRefStub(),
      config: {},
      instance: makeSignal(null),
      id: 'cdk-dialog-ssr-noop',
      ssr: true,
    });
    await expect(ref.afterOpened).resolves.toBeUndefined();
    await expect(ref.afterDismissed).resolves.toBeUndefined();
  });
});
