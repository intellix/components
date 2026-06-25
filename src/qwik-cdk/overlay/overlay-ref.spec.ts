import {describe, it, expect} from 'vitest';
import {OverlayRef} from './public-api';

describe('OverlayRef', () => {
  it('updateSize sets px on width/height', () => {
    const entry: any = {
      id: 'x',
      state: {
        panelClasses: {value: []},
        backdropShowing: {value: false},
        detached: {value: false},
        width: {value: undefined},
        height: {value: undefined},
        minWidth: {value: undefined},
        minHeight: {value: undefined},
        maxWidth: {value: undefined},
        maxHeight: {value: undefined},
      },
    };
    const ref = new OverlayRef({remove() {}} as any, entry);
    ref.updateSize({width: 100, height: '50vh'});
    expect(entry.state.width.value).toBe('100px');
    expect(entry.state.height.value).toBe('50vh');
  });
});
