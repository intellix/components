import {describe, expect, it} from 'vitest';
import {
  computeContentMargins,
  containerHasBackdrop,
  drawerHasBackdrop,
  hasOpenNonSide,
  isShowingBackdrop,
  isShowingBackdropForInert,
  trapEnabledFor,
  type DrawerRegistration,
} from './drawer-state';

/**
 * Pure-function unit tests for the registry-derived computations
 * (`drawer-state.ts`) — these have no DOM dependency, so (unlike the
 * component-rendering behavior, which this package's vitest can't reliably
 * exercise — see `mat-sidenav-scenarios.spec.tsx`) they're real,
 * non-trivial unit tests, mirroring `src/material/sidenav/drawer.spec.ts`'s
 * `updateContentMargins()`/backdrop-related assertions directly against the
 * ported logic.
 */

function makeEntry(overrides: Partial<DrawerRegistration> = {}): DrawerRegistration {
  return {
    position: 'start',
    mode: 'over',
    opened: false,
    inertEligible: true,
    disableClose: false,
    width: 0,
    hostRef: {value: undefined} as DrawerRegistration['hostRef'],
    requestClose$: (() => {}) as unknown as DrawerRegistration['requestClose$'],
    ...overrides,
  };
}

describe('drawerHasBackdrop', () => {
  it('defaults to true for over/push, false for side, when no override is set', () => {
    expect(drawerHasBackdrop(makeEntry({mode: 'over'}), null)).toBe(true);
    expect(drawerHasBackdrop(makeEntry({mode: 'push'}), null)).toBe(true);
    expect(drawerHasBackdrop(makeEntry({mode: 'side'}), null)).toBe(false);
  });

  it('an explicit override applies regardless of mode', () => {
    expect(drawerHasBackdrop(makeEntry({mode: 'side'}), true)).toBe(true);
    expect(drawerHasBackdrop(makeEntry({mode: 'over'}), false)).toBe(false);
  });

  it('a missing drawer with an explicit override still returns the override', () => {
    expect(drawerHasBackdrop(undefined, true)).toBe(true);
    expect(drawerHasBackdrop(undefined, null)).toBe(false);
  });
});

describe('containerHasBackdrop', () => {
  it('true when either start or end drawer defaults to having one', () => {
    expect(containerHasBackdrop({a: makeEntry({mode: 'over', position: 'start'})}, null)).toBe(
      true,
    );
    expect(containerHasBackdrop({a: makeEntry({mode: 'side', position: 'start'})}, null)).toBe(
      false,
    );
  });

  it('an explicit false override removes the backdrop for every mode, including over/push', () => {
    expect(containerHasBackdrop({a: makeEntry({mode: 'over'})}, false)).toBe(false);
  });
});

describe('isShowingBackdrop', () => {
  it('true only once a backdrop-having drawer is actually open', () => {
    const registry = {a: makeEntry({mode: 'over', opened: false})};
    expect(isShowingBackdrop(registry, null)).toBe(false);
    registry.a = makeEntry({mode: 'over', opened: true});
    expect(isShowingBackdrop(registry, null)).toBe(true);
  });

  it('false for an open side-mode drawer with no override', () => {
    expect(isShowingBackdrop({a: makeEntry({mode: 'side', opened: true})}, null)).toBe(false);
  });

  it('false for an open drawer when hasBackdrop is explicitly false', () => {
    expect(isShowingBackdrop({a: makeEntry({mode: 'over', opened: true})}, false)).toBe(false);
  });
});

describe('isShowingBackdropForInert', () => {
  it('matches isShowingBackdrop for a drawer that has gone through a real toggle', () => {
    const registry = {a: makeEntry({mode: 'over', opened: true, inertEligible: true})};
    expect(isShowingBackdropForInert(registry, null)).toBe(true);
  });

  it('false for a drawer opened from its very first render, even with a shown backdrop', () => {
    // A genuine upstream lifecycle quirk (see `inertEligible`'s doc comment in drawer-state.ts),
    // verified live against Angular via mat-sidenav's `autosize` scenario.
    const registry = {a: makeEntry({mode: 'push', opened: true, inertEligible: false})};
    expect(isShowingBackdrop(registry, null)).toBe(true);
    expect(isShowingBackdropForInert(registry, null)).toBe(false);
  });
});

describe('hasOpenNonSide', () => {
  it('true for an open over/push drawer, false for an open side drawer', () => {
    expect(hasOpenNonSide({a: makeEntry({mode: 'over', opened: true})})).toBe(true);
    expect(hasOpenNonSide({a: makeEntry({mode: 'side', opened: true})})).toBe(false);
  });

  it('false when nothing is open', () => {
    expect(hasOpenNonSide({a: makeEntry({mode: 'over', opened: false})})).toBe(false);
  });
});

describe('computeContentMargins', () => {
  it('an open side-mode start drawer only adds margin-left', () => {
    const margins = computeContentMargins({
      a: makeEntry({position: 'start', mode: 'side', opened: true, width: 180}),
    });
    expect(margins).toEqual({left: 180, right: null});
  });

  it('an open push-mode start drawer adds margin-left AND subtracts margin-right', () => {
    const margins = computeContentMargins({
      a: makeEntry({position: 'start', mode: 'push', opened: true, width: 200}),
    });
    expect(margins).toEqual({left: 200, right: -200});
  });

  it('two open side drawers (start + end) contribute independently, no subtraction', () => {
    const margins = computeContentMargins({
      a: makeEntry({position: 'start', mode: 'side', opened: true, width: 150}),
      b: makeEntry({position: 'end', mode: 'side', opened: true, width: 120}),
    });
    expect(margins).toEqual({left: 150, right: 120});
  });

  it('a closed drawer contributes nothing', () => {
    const margins = computeContentMargins({
      a: makeEntry({position: 'start', mode: 'side', opened: false, width: 180}),
    });
    expect(margins).toEqual({left: null, right: null});
  });

  it('an over-mode drawer never contributes a margin, open or closed', () => {
    const margins = computeContentMargins({
      a: makeEntry({position: 'start', mode: 'over', opened: true, width: 300}),
    });
    expect(margins).toEqual({left: null, right: null});
  });

  it('zero is normalized to null (matches upstream `left = left || null!`)', () => {
    // A push-mode start drawer with a push-mode end drawer of the SAME width cancels out.
    const margins = computeContentMargins({
      a: makeEntry({position: 'start', mode: 'push', opened: true, width: 100}),
      b: makeEntry({position: 'end', mode: 'push', opened: true, width: 100}),
    });
    expect(margins).toEqual({left: null, right: null});
  });
});

describe('trapEnabledFor', () => {
  it('enabled only when this drawer is open AND the container is showing a backdrop', () => {
    const openOver = makeEntry({mode: 'over', opened: true});
    expect(trapEnabledFor(openOver, {a: openOver}, null)).toBe(true);

    const openSide = makeEntry({mode: 'side', opened: true});
    expect(trapEnabledFor(openSide, {a: openSide}, null)).toBe(false);

    const closedOver = makeEntry({mode: 'over', opened: false});
    expect(trapEnabledFor(closedOver, {a: closedOver}, null)).toBe(false);
  });
});
