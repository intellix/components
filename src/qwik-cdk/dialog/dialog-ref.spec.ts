import {describe, it, expect} from 'vitest';
import {createDialogRef, type DialogConfig} from './public-api';

describe('DialogRef', () => {
  it('resolves closed promise with result when close() called', async () => {
    const cfg: DialogConfig = {id: 'd1'};
    const overlayRef: any = {
      dispose() {},
      updatePosition() {},
      updateSize() {},
      addPanelClass() {},
      removePanelClass() {},
    };
    const isOpen: any = {value: true};
    const instance: any = {value: null};
    const ref = createDialogRef({overlayRef, config: cfg, isOpen, componentInstance: instance});
    ref.close('done');
    await expect(ref.closed).resolves.toBe('done');
    expect(isOpen.value).toBe(false);
  });

  it('setInput merges onto config.componentProps and pushes the result via overlayRef.updateProps', () => {
    const updateCalls: Record<string, unknown>[] = [];
    const overlayRef: any = {
      dispose() {},
      updatePosition() {},
      updateSize() {},
      addPanelClass() {},
      removePanelClass() {},
      updateProps(partial: Record<string, unknown>) {
        updateCalls.push(partial);
      },
    };
    const cfg: DialogConfig = {id: 'd1', componentProps: {a: 1}};
    const ref = createDialogRef({
      overlayRef,
      config: cfg,
      isOpen: {value: true} as any,
      componentInstance: {value: null} as any,
    });

    ref.setInput('b', 2);
    expect(updateCalls).toEqual([{contentProps: {a: 1, b: 2}}]);

    ref.setInput('a', 99);
    expect(updateCalls).toEqual([{contentProps: {a: 1, b: 2}}, {contentProps: {a: 99, b: 2}}]);
    // The original config object is left untouched.
    expect(cfg.componentProps).toEqual({a: 1});
  });
});
