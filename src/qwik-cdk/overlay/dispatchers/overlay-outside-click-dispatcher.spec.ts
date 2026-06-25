import {describe, it, expect} from 'vitest';
import {OverlayOutsideClickDispatcher} from '../public-api';

describe('OverlayOutsideClickDispatcher', () => {
  it('routes outside click to per-ref handler from add(ref, handlers)', () => {
    const d = new OverlayOutsideClickDispatcher();
    const events: MouseEvent[] = [];
    // Provide a minimal OverlayRef stub with hasAttached returning true and no overlayElement.
    const ref: any = {
      hasAttached: () => true,
      overlayElement: null,
    };
    d.add(ref, {onOutsideClick: (e: MouseEvent) => events.push(e)});
    document.body.dispatchEvent(new MouseEvent('click', {bubbles: true}));
    expect(events.length).toBe(1);
    d.remove(ref);
    d.dispose();
  });
});
