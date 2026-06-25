import {describe, it, expect} from 'vitest';
import {OverlayKeyboardDispatcher} from '../public-api';

describe('OverlayKeyboardDispatcher', () => {
  it('routes keydown to topmost attached overlay', () => {
    const d = new OverlayKeyboardDispatcher();
    const events: KeyboardEvent[] = [];
    const ref: any = {_keydownEvents: (e: KeyboardEvent) => events.push(e)};
    d.add(ref);
    document.dispatchEvent(new KeyboardEvent('keydown', {key: 'Escape'}));
    expect(events.length).toBe(1);
    d.remove(ref);
    d.dispose();
  });

  it('routes keydown to per-ref handler from add(ref, handlers)', () => {
    const d = new OverlayKeyboardDispatcher();
    const events: KeyboardEvent[] = [];
    const ref: any = {};
    d.add(ref, {onKeydown: (e: KeyboardEvent) => events.push(e)});
    document.dispatchEvent(new KeyboardEvent('keydown', {key: 'Escape'}));
    expect(events.length).toBe(1);
    d.remove(ref);
    d.dispose();
  });
});
