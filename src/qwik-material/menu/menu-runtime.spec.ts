import {$} from '@builder.io/qwik';
import {describe, expect, it} from 'vitest';
import {createMatMenu} from './menu-ref';
import {
  computeHasBackdrop,
  computePositions,
  getParentInnerPadding,
  resolveMenuConfig,
} from './menu-runtime';
import {MAT_MENU_DEFAULT_OPTIONS_FACTORY} from './mat-menu-tokens';

const noopContent$ = $(() => null as never);

describe('resolveMenuConfig', () => {
  it('falls back to upstream hardcoded defaults when nothing is set', () => {
    const resolved = resolveMenuConfig(createMatMenu({content$: noopContent$}), {});
    expect(resolved.xPosition).toBe(MAT_MENU_DEFAULT_OPTIONS_FACTORY.xPosition);
    expect(resolved.yPosition).toBe(MAT_MENU_DEFAULT_OPTIONS_FACTORY.yPosition);
    expect(resolved.overlapTrigger).toBe(MAT_MENU_DEFAULT_OPTIONS_FACTORY.overlapTrigger);
    expect(resolved.backdropClass).toBe(MAT_MENU_DEFAULT_OPTIONS_FACTORY.backdropClass);
    expect(resolved.hasBackdrop).toBeUndefined();
    expect(resolved.panelClassList).toEqual([]);
  });

  it('prefers the menu ref own fields over provider defaults and hardcoded defaults', () => {
    const resolved = resolveMenuConfig(
      createMatMenu({xPosition: 'before', content$: noopContent$}),
      {xPosition: 'after', yPosition: 'above'},
    );
    expect(resolved.xPosition).toBe('before'); // own field wins
    expect(resolved.yPosition).toBe('above'); // falls through to provider default
  });

  it('splits a space-separated panelClass string into an array', () => {
    const resolved = resolveMenuConfig(
      createMatMenu({panelClass: 'foo bar', content$: noopContent$}),
      {},
    );
    expect(resolved.panelClassList).toEqual(['foo', 'bar']);
  });

  it('keeps a panelClass array as-is', () => {
    const resolved = resolveMenuConfig(
      createMatMenu({panelClass: ['foo', 'bar'], content$: noopContent$}),
      {},
    );
    expect(resolved.panelClassList).toEqual(['foo', 'bar']);
  });

  it('passes aria-* fields through for the real overlay panel only', () => {
    const resolved = resolveMenuConfig(
      createMatMenu({
        'aria-label': 'Account actions',
        'aria-labelledby': 'label-id',
        'aria-describedby': 'desc-id',
        content$: noopContent$,
      }),
      {},
    );
    expect(resolved.ariaLabel).toBe('Account actions');
    expect(resolved.ariaLabelledby).toBe('label-id');
    expect(resolved.ariaDescribedby).toBe('desc-id');
  });
});

describe('computeHasBackdrop', () => {
  // Mirrors `MatMenuTriggerBase._openMenu`'s
  // `hasBackdrop == null ? !triggersSubmenu : hasBackdrop`.
  it('defaults to true for a root trigger when hasBackdrop is unset', () => {
    const resolved = resolveMenuConfig(createMatMenu({content$: noopContent$}), {});
    expect(computeHasBackdrop(resolved, false)).toBe(true);
  });

  it('defaults to false for a submenu trigger when hasBackdrop is unset', () => {
    const resolved = resolveMenuConfig(createMatMenu({content$: noopContent$}), {});
    expect(computeHasBackdrop(resolved, true)).toBe(false);
  });

  it('respects an explicit hasBackdrop regardless of submenu-ness', () => {
    const falseResolved = resolveMenuConfig(
      createMatMenu({hasBackdrop: false, content$: noopContent$}),
      {},
    );
    expect(computeHasBackdrop(falseResolved, false)).toBe(false);

    const trueResolved = resolveMenuConfig(
      createMatMenu({hasBackdrop: true, content$: noopContent$}),
      {},
    );
    expect(computeHasBackdrop(trueResolved, true)).toBe(true);
  });
});

describe('computePositions', () => {
  // Mirrors `MatMenuTriggerBase._setPosition`.
  it('defaults to after/below, origin below the trigger, no overlap', () => {
    const resolved = resolveMenuConfig(createMatMenu({content$: noopContent$}), {});
    const [primary] = computePositions(resolved, false, 0);
    expect(primary).toEqual({
      originX: 'start',
      originY: 'bottom',
      overlayX: 'start',
      overlayY: 'top',
      offsetY: 0,
    });
  });

  it('overlapTrigger keeps origin/overlay on the same edge (no flip to bottom/top)', () => {
    const resolved = resolveMenuConfig(
      createMatMenu({overlapTrigger: true, content$: noopContent$}),
      {},
    );
    const [primary] = computePositions(resolved, false, 0);
    expect(primary.originY).toBe('top');
    expect(primary.overlayY).toBe('top');
  });

  it('xPosition "before" swaps origin/overlay to end/start', () => {
    const resolved = resolveMenuConfig(
      createMatMenu({xPosition: 'before', content$: noopContent$}),
      {},
    );
    const [primary] = computePositions(resolved, false, 0);
    expect(primary.originX).toBe('end');
    expect(primary.overlayX).toBe('end');
  });

  it('yPosition "above" flips the vertical pair', () => {
    const resolved = resolveMenuConfig(
      createMatMenu({yPosition: 'above', content$: noopContent$}),
      {},
    );
    const [primary] = computePositions(resolved, false, 0);
    expect(primary.originY).toBe('top');
    expect(primary.overlayY).toBe('bottom');
  });

  it('a submenu aligns to the trigger edge and offsets by the parent inner padding', () => {
    const resolved = resolveMenuConfig(createMatMenu({content$: noopContent$}), {});
    const [primary] = computePositions(resolved, true, 8);
    // Default below (overlayY 'top') -> offsetY is negative the padding.
    expect(primary.offsetY).toBe(-8);
    // Default xPosition 'after' -> submenu aligns its own start edge to the
    // trigger's end edge (mirrors upstream: originX = 'end', overlayX = 'start').
    expect(primary.originX).toBe('end');
    expect(primary.overlayX).toBe('start');
  });

  it('a submenu positioned above offsets by +padding instead', () => {
    const resolved = resolveMenuConfig(
      createMatMenu({yPosition: 'above', content$: noopContent$}),
      {},
    );
    const [primary] = computePositions(resolved, true, 8);
    expect(primary.offsetY).toBe(8);
  });

  it('returns 4 fallback positions with the offsets mirrored on the alternate pair', () => {
    const resolved = resolveMenuConfig(createMatMenu({content$: noopContent$}), {});
    const positions = computePositions(resolved, true, 8);
    expect(positions).toHaveLength(4);
    expect(positions[0].offsetY).toBe(-8);
    expect(positions[2].offsetY).toBe(8);
  });
});

describe('getParentInnerPadding', () => {
  it('returns the offsetTop of the closest ancestor panel first item', () => {
    document.body.innerHTML = `
      <div class="mat-mdc-menu-panel">
        <button class="mat-mdc-menu-item" id="first"></button>
        <button class="mat-mdc-menu-item" id="second"></button>
      </div>
    `;
    const first = document.getElementById('first')!;
    const second = document.getElementById('second')!;
    Object.defineProperty(first, 'offsetTop', {value: 8, configurable: true});
    expect(getParentInnerPadding(second)).toBe(8);
  });

  it('returns 0 when there is no ancestor panel', () => {
    const el = document.createElement('button');
    expect(getParentInnerPadding(el)).toBe(0);
  });
});
