import {describe, it, expect} from 'vitest';
import type {Signal} from '@qwik.dev/core';
import {createMatDialogRef, MatDialogState, MARK_OPENED, MARK_CLOSED} from './mat-dialog-ref';
import type {MatDialogRef} from './mat-dialog-ref';

function makeSignal<T>(v: T): Signal<T> {
  return {value: v} as Signal<T>;
}

function makeCdkRefStub() {
  const calls: string[] = [];
  return {
    dispose: () => calls.push('dispose'),
    updatePosition: () => calls.push('updatePosition'),
    updateSize: (_opts: any) => calls.push('updateSize'),
    addPanelClass: (_c: any) => calls.push('addPanelClass'),
    removePanelClass: (_c: any) => calls.push('removePanelClass'),
    calls,
  };
}

describe('createMatDialogRef', () => {
  it('exposes id from config', () => {
    const ref = createMatDialogRef({
      cdkRef: makeCdkRefStub(),
      config: {id: 'my-dialog'},
      state: makeSignal(MatDialogState.OPEN),
      componentInstance: makeSignal(null),
    });
    expect(ref.id).toBe('my-dialog');
  });

  it('close(result) transitions state to CLOSING and resolves beforeClosed', async () => {
    const state = makeSignal(MatDialogState.OPEN);
    const ref = createMatDialogRef<string>({
      cdkRef: makeCdkRefStub(),
      config: {id: 'x'},
      state,
      componentInstance: makeSignal(null),
    });
    ref.close('ok');
    expect(state.value).toBe(MatDialogState.CLOSING);
    await expect(ref.beforeClosed).resolves.toBe('ok');
  });

  it('[MARK_CLOSED] transitions state to CLOSED and resolves afterClosed with the close result', async () => {
    const state = makeSignal(MatDialogState.OPEN);
    const cdk = makeCdkRefStub();
    const ref = createMatDialogRef<string>({
      cdkRef: cdk,
      config: {id: 'x'},
      state,
      componentInstance: makeSignal(null),
    });
    ref.close('bye');
    ref[MARK_CLOSED]();
    await expect(ref.afterClosed).resolves.toBe('bye');
    expect(state.value).toBe(MatDialogState.CLOSED);
    expect(cdk.calls).toContain('dispose');
  });

  it('[MARK_OPENED] resolves afterOpened', async () => {
    const ref = createMatDialogRef({
      cdkRef: makeCdkRefStub(),
      config: {id: 'x'},
      state: makeSignal(MatDialogState.OPEN),
      componentInstance: makeSignal(null),
    });
    ref[MARK_OPENED]();
    await expect(ref.afterOpened).resolves.toBeUndefined();
  });

  it('close() called twice is idempotent', () => {
    const state = makeSignal(MatDialogState.OPEN);
    const cdk = makeCdkRefStub();
    const ref = createMatDialogRef<string>({
      cdkRef: cdk,
      config: {id: 'x'},
      state,
      componentInstance: makeSignal(null),
    });
    ref.close('first');
    ref.close('second');
    // Second call is a no-op — state must still be CLOSING, not re-transitioned.
    expect(state.value).toBe(MatDialogState.CLOSING);
    // Only one beforeClosed resolution happens; harder to assert directly but the
    // idempotent guard on state prevents re-firing pendingResult.
  });

  it('mutations delegate to cdkRef and return this', () => {
    const cdk = makeCdkRefStub();
    const ref = createMatDialogRef({
      cdkRef: cdk,
      config: {id: 'x'},
      state: makeSignal(MatDialogState.OPEN),
      componentInstance: makeSignal(null),
    });
    expect(ref.updatePosition()).toBe(ref);
    expect(ref.updateSize('400px', '300px')).toBe(ref);
    expect(ref.addPanelClass('a')).toBe(ref);
    expect(ref.removePanelClass(['b'])).toBe(ref);
    expect(cdk.calls).toEqual([
      'updatePosition',
      'updateSize',
      'addPanelClass',
      'removePanelClass',
    ]);
  });

  it('SSR no-op (state pre-set to CLOSED) resolves all three promises immediately', async () => {
    const ref = createMatDialogRef<string>({
      cdkRef: makeCdkRefStub(),
      config: {id: 'ssr'},
      state: makeSignal(MatDialogState.CLOSED),
      componentInstance: makeSignal(null),
    });
    await expect(ref.afterOpened).resolves.toBeUndefined();
    await expect(ref.beforeClosed).resolves.toBeUndefined();
    await expect(ref.afterClosed).resolves.toBeUndefined();
  });
});
