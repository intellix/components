import {describe, expect, it} from 'vitest';
import {focusVia} from './focus-origin';

// Plain DOM test (default happy-dom environment — unlike focus-origin.spec.tsx,
// which overrides to the node environment for createDOM() and so has no real
// `document` global available outside of it).
describe('focusVia', () => {
  it('writes the pending-origin attribute and calls .focus() on the element', () => {
    const el = document.createElement('div');
    let focusCalled = false;
    el.focus = () => {
      focusCalled = true;
    };
    focusVia(el, 'program');
    expect(el.getAttribute('data-cdk-pending-focus-origin')).toBe('program');
    expect(focusCalled).toBe(true);
  });

  it('removes the attribute instead of writing it when origin is null', () => {
    const el = document.createElement('div');
    el.setAttribute('data-cdk-pending-focus-origin', 'keyboard');
    el.focus = () => {};
    focusVia(el, null);
    expect(el.hasAttribute('data-cdk-pending-focus-origin')).toBe(false);
  });

  it('passes focus options through to .focus()', () => {
    const el = document.createElement('div');
    let receivedOptions: FocusOptions | undefined;
    el.focus = (options?: FocusOptions) => {
      receivedOptions = options;
    };
    focusVia(el, 'keyboard', {preventScroll: true});
    expect(receivedOptions).toEqual({preventScroll: true});
  });

  it('dispatches a synthetic bubbling focusin instead of calling .focus() when the element is already focused (no real focus event would fire otherwise — e.g. pressing End while already on the last item)', () => {
    const el = document.createElement('div');
    el.tabIndex = 0;
    document.body.appendChild(el);
    el.focus();
    expect(document.activeElement).toBe(el);

    let focusCalled = false;
    el.focus = () => {
      focusCalled = true;
    };
    let focusinReceived: FocusEvent | undefined;
    el.addEventListener('focusin', e => {
      focusinReceived = e as FocusEvent;
    });

    focusVia(el, 'program');

    expect(focusCalled).toBe(false);
    expect(focusinReceived).toBeDefined();
    expect(focusinReceived?.bubbles).toBe(true);
    expect(el.getAttribute('data-cdk-pending-focus-origin')).toBe('program');

    el.remove();
  });
});
