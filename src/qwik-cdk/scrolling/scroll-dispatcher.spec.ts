/**
 * Adapted from `src/cdk/scrolling/scroll-dispatcher.spec.ts`'s non-Angular-specific
 * assertions (the RxJS/zone-specific tests are dropped — see `SYNC.md`).
 */
import {describe, expect, it} from 'vitest';
import {createScrollDispatcher, type CdkScrollableHandle} from './scroll-dispatcher';

function fakeScrollable(element: Element): {
  handle: CdkScrollableHandle;
  fireScroll: () => void;
} {
  let listener: ((event: Event) => void) | undefined;
  return {
    handle: {
      element,
      elementScrolled(cb) {
        listener = cb;
        return () => {
          listener = undefined;
        };
      },
    },
    fireScroll: () => listener?.(new Event('scroll')),
  };
}

describe('createScrollDispatcher', () => {
  it('register() adds the scrollable to scrollContainers', () => {
    const dispatcher = createScrollDispatcher();
    const el = document.createElement('div');
    const {handle} = fakeScrollable(el);

    dispatcher.register(handle);
    expect(dispatcher.scrollContainers.has(handle)).toBe(true);
  });

  it('register() is idempotent for the same scrollable', () => {
    const dispatcher = createScrollDispatcher();
    const el = document.createElement('div');
    const {handle} = fakeScrollable(el);

    dispatcher.register(handle);
    dispatcher.register(handle);
    expect(dispatcher.scrollContainers.size).toBe(1);
  });

  it('deregister() removes the scrollable', () => {
    const dispatcher = createScrollDispatcher();
    const el = document.createElement('div');
    const {handle} = fakeScrollable(el);

    dispatcher.register(handle);
    dispatcher.deregister(handle);
    expect(dispatcher.scrollContainers.has(handle)).toBe(false);
  });

  it("register()'s return value deregisters, same as calling deregister() directly", () => {
    const dispatcher = createScrollDispatcher();
    const el = document.createElement('div');
    const {handle} = fakeScrollable(el);

    const deregister = dispatcher.register(handle);
    deregister();
    expect(dispatcher.scrollContainers.has(handle)).toBe(false);
  });

  it('notifies scrolled() listeners when a registered scrollable fires a scroll event', () => {
    const dispatcher = createScrollDispatcher();
    const el = document.createElement('div');
    const {handle, fireScroll} = fakeScrollable(el);
    const seen: (CdkScrollableHandle | undefined)[] = [];

    dispatcher.register(handle);
    dispatcher.scrolled(s => seen.push(s));
    fireScroll();

    expect(seen).toEqual([handle]);
  });

  it('getAncestorScrollContainers() finds registered scrollables that contain the element', () => {
    const dispatcher = createScrollDispatcher();
    const scrollableEl = document.createElement('div');
    const child = document.createElement('span');
    scrollableEl.appendChild(child);
    document.body.appendChild(scrollableEl);
    const {handle} = fakeScrollable(scrollableEl);

    dispatcher.register(handle);
    const ancestors = dispatcher.getAncestorScrollContainers(child);

    expect(ancestors).toEqual([handle]);
    scrollableEl.remove();
  });

  it('getAncestorScrollContainers() excludes scrollables that do not contain the element', () => {
    const dispatcher = createScrollDispatcher();
    const scrollableEl = document.createElement('div');
    const unrelated = document.createElement('span');
    document.body.append(scrollableEl, unrelated);
    const {handle} = fakeScrollable(scrollableEl);

    dispatcher.register(handle);
    const ancestors = dispatcher.getAncestorScrollContainers(unrelated);

    expect(ancestors).toEqual([]);
    scrollableEl.remove();
    unrelated.remove();
  });

  it('ancestorScrolled() only notifies for scroll events from a registered ancestor', () => {
    const dispatcher = createScrollDispatcher();
    const scrollableEl = document.createElement('div');
    const child = document.createElement('span');
    scrollableEl.appendChild(child);
    document.body.appendChild(scrollableEl);
    const {handle, fireScroll} = fakeScrollable(scrollableEl);
    const otherEl = document.createElement('div');
    document.body.appendChild(otherEl);
    const other = fakeScrollable(otherEl);

    dispatcher.register(handle);
    dispatcher.register(other.handle);

    const seen: (CdkScrollableHandle | undefined)[] = [];
    dispatcher.ancestorScrolled(child, s => seen.push(s));

    other.fireScroll();
    expect(seen).toEqual([]);

    fireScroll();
    expect(seen).toEqual([handle]);

    scrollableEl.remove();
    otherEl.remove();
  });

  it('destroy() clears every registration and listener', () => {
    const dispatcher = createScrollDispatcher();
    const el = document.createElement('div');
    const {handle, fireScroll} = fakeScrollable(el);
    const seen: unknown[] = [];

    dispatcher.register(handle);
    dispatcher.scrolled(s => seen.push(s));
    dispatcher.destroy();

    expect(dispatcher.scrollContainers.size).toBe(0);
    fireScroll();
    expect(seen).toEqual([]);
  });
});
