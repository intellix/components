import {describe, it, expect} from 'vitest';
import {DialogRef, DialogConfig} from './public-api';

describe('DialogRef', () => {
  it('resolves closed promise with result when close() called', async () => {
    const cfg = new DialogConfig();
    cfg.id = 'd1';
    const overlayRef: any = {
      dispose() {},
      updatePosition() {},
      updateSize() {},
      addPanelClass() {},
      removePanelClass() {},
    };
    const isOpen: any = {value: true};
    const instance: any = {value: null};
    const ref = new DialogRef(overlayRef, cfg, isOpen, instance);
    ref.close('done');
    await expect(ref.closed).resolves.toBe('done');
    expect(isOpen.value).toBe(false);
  });
});
