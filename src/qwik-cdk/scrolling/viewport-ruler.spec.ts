/**
 * Adapted from `src/cdk/scrolling/viewport-ruler.spec.ts`'s non-Angular-specific
 * assertions. happy-dom's `window.innerWidth`/`innerHeight` are real (non-zero, configurable)
 * values, unlike `clientHeight`/`scrollHeight` (see `qwik-cdk/text-field/
 * textarea-autosize.spec.ts`'s identical note) — so viewport SIZE is testable directly;
 * scroll POSITION still depends on `getBoundingClientRect()`, which happy-dom always
 * reports as all-zero, so those assertions only check the documented fallback shape (`{top:
 * 0, left: 0}`), not real scrolled values.
 */
import {describe, expect, it} from 'vitest';
import {createViewportRuler} from './viewport-ruler';

describe('createViewportRuler', () => {
  it('getViewportSize() reports the window inner size', () => {
    const ruler = createViewportRuler();
    const size = ruler.getViewportSize();
    expect(size.width).toBe(window.innerWidth);
    expect(size.height).toBe(window.innerHeight);
    ruler.destroy();
  });

  it('getViewportScrollPosition() returns a {top, left} shape', () => {
    const ruler = createViewportRuler();
    const position = ruler.getViewportScrollPosition();
    expect(position).toHaveProperty('top');
    expect(position).toHaveProperty('left');
    ruler.destroy();
  });

  it('getViewportRect() combines size and scroll position', () => {
    const ruler = createViewportRuler();
    const rect = ruler.getViewportRect();
    const size = ruler.getViewportSize();
    const position = ruler.getViewportScrollPosition();

    expect(rect.width).toBe(size.width);
    expect(rect.height).toBe(size.height);
    expect(rect.top).toBe(position.top);
    expect(rect.left).toBe(position.left);
    expect(rect.bottom).toBe(position.top + size.height);
    expect(rect.right).toBe(position.left + size.width);
    ruler.destroy();
  });

  it('onChange() notifies listeners on window resize', () => {
    const ruler = createViewportRuler();
    const events: Event[] = [];
    const unsubscribe = ruler.onChange(e => events.push(e));

    window.dispatchEvent(new Event('resize'));
    expect(events.length).toBe(1);

    unsubscribe();
    window.dispatchEvent(new Event('resize'));
    expect(events.length).toBe(1); // no further notifications once unsubscribed

    ruler.destroy();
  });

  it('onChange() notifies listeners on orientationchange', () => {
    const ruler = createViewportRuler();
    const events: Event[] = [];
    ruler.onChange(e => events.push(e));

    window.dispatchEvent(new Event('orientationchange'));
    expect(events.length).toBe(1);
    ruler.destroy();
  });

  it('destroy() removes the window listeners', () => {
    const ruler = createViewportRuler();
    const events: Event[] = [];
    ruler.onChange(e => events.push(e));
    ruler.destroy();

    window.dispatchEvent(new Event('resize'));
    expect(events.length).toBe(0);
  });
});
