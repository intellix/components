import {describe, expect, it} from 'vitest';
import {shouldAutoClose} from './unique-selection';

// Conceptual port of src/cdk/accordion/accordion-item.spec.ts's "Expansion
// and collapse" / unique-selection-dispatcher-driven assertions, reframed
// around the pure predicate (no TestBed, no RxJS — see unique-selection.ts).

describe('shouldAutoClose', () => {
  it('closes an expanded sibling when a different item opens in a single-select accordion (upstream: "should ensure only one item is expanded at a time")', () => {
    expect(
      shouldAutoClose({multi: false, selfId: 'a', openedId: 'b', currentlyExpanded: true}),
    ).toBe(true);
  });

  it('does not touch an already-collapsed sibling (upstream: "should not change expanded state based on unrelated items")', () => {
    expect(
      shouldAutoClose({multi: false, selfId: 'a', openedId: 'b', currentlyExpanded: false}),
    ).toBe(false);
  });

  it('never closes the item that itself just opened (self-broadcast)', () => {
    expect(
      shouldAutoClose({multi: false, selfId: 'a', openedId: 'a', currentlyExpanded: true}),
    ).toBe(false);
  });

  it('never closes anything when the accordion allows multiple expanded items (upstream: "should allow multiple items to be expanded simultaneously")', () => {
    expect(
      shouldAutoClose({multi: true, selfId: 'a', openedId: 'b', currentlyExpanded: true}),
    ).toBe(false);
  });

  it('multi=true short-circuits even for a self-broadcast edge case', () => {
    expect(
      shouldAutoClose({multi: true, selfId: 'a', openedId: 'a', currentlyExpanded: true}),
    ).toBe(false);
  });
});
