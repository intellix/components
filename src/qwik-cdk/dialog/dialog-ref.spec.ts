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
});
