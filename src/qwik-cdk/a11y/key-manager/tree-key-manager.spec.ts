import {describe, expect, it} from 'vitest';
import {resolveTreeKeydown, type TreeKeyManagerItem} from './tree-key-manager';

/** Builds the Fruit/Vegetables fixture used throughout `mat-tree`'s parity
 *  scenarios (see `src/dev-app/qwik-parity/tree.ts`): two expandable roots,
 *  Fruit -> [Apple, Banana], Vegetables -> [Leafy greens -> [Spinach, Kale],
 *  Carrot]. `expandedKeys` controls which of the expandable nodes are
 *  "currently expanded" for a given test. */
function fixture(expandedKeys: Set<string> = new Set()): TreeKeyManagerItem<string>[] {
  const all: TreeKeyManagerItem<string>[] = [
    {
      key: 'fruit',
      parentKey: null,
      isExpandable: true,
      isDisabled: false,
      nodeToggle: true,
      data: 'Fruit',
    },
    {
      key: 'apple',
      parentKey: 'fruit',
      isExpandable: false,
      isDisabled: false,
      nodeToggle: false,
      data: 'Apple',
    },
    {
      key: 'banana',
      parentKey: 'fruit',
      isExpandable: false,
      isDisabled: false,
      nodeToggle: false,
      data: 'Banana',
    },
    {
      key: 'vegetables',
      parentKey: null,
      isExpandable: true,
      isDisabled: false,
      nodeToggle: true,
      data: 'Vegetables',
    },
    {
      key: 'leafy',
      parentKey: 'vegetables',
      isExpandable: true,
      isDisabled: false,
      nodeToggle: true,
      data: 'Leafy greens',
    },
    {
      key: 'spinach',
      parentKey: 'leafy',
      isExpandable: false,
      isDisabled: false,
      nodeToggle: false,
      data: 'Spinach',
    },
    {
      key: 'kale',
      parentKey: 'leafy',
      isExpandable: false,
      isDisabled: false,
      nodeToggle: false,
      data: 'Kale',
    },
    {
      key: 'carrot',
      parentKey: 'vegetables',
      isExpandable: false,
      isDisabled: false,
      nodeToggle: false,
      data: 'Carrot',
    },
  ];
  // Only entries whose full ancestor chain is expanded are "visible" —
  // mirrors `flatten-tree.ts`'s `visible` list, which is what the real
  // caller passes in.
  const isAncestorChainExpanded = (parentKey: string | null): boolean => {
    if (parentKey == null) return true;
    if (!expandedKeys.has(parentKey)) return false;
    const parent = all.find(e => e.key === parentKey)!;
    return isAncestorChainExpanded(parent.parentKey);
  };
  return all.filter(e => isAncestorChainExpanded(e.parentKey));
}

const isExpanded =
  (expandedKeys: Set<string>) =>
  (key: string): boolean =>
    expandedKeys.has(key);

describe('resolveTreeKeydown', () => {
  it('returns none for Tab (lets it tab out of the tree)', () => {
    const entries = fixture();
    expect(resolveTreeKeydown('fruit', 'Tab', entries, isExpanded(new Set()))).toEqual({
      type: 'none',
    });
  });

  it('returns none when the active key is not in the list', () => {
    const entries = fixture();
    expect(resolveTreeKeydown('missing', 'ArrowDown', entries, isExpanded(new Set()))).toEqual({
      type: 'none',
    });
  });

  it('ArrowDown focuses the next visible item, clamping at the end', () => {
    const entries = fixture(new Set(['fruit', 'vegetables']));
    expect(
      resolveTreeKeydown(
        'fruit',
        'ArrowDown',
        entries,
        isExpanded(new Set(['fruit', 'vegetables'])),
      ),
    ).toEqual({type: 'focus', key: 'apple'});
    const last = entries[entries.length - 1].key;
    expect(
      resolveTreeKeydown(last, 'ArrowDown', entries, isExpanded(new Set(['fruit', 'vegetables']))),
    ).toEqual({
      type: 'none',
    });
  });

  it('ArrowUp focuses the previous visible item, clamping at the start', () => {
    const entries = fixture();
    expect(resolveTreeKeydown('fruit', 'ArrowUp', entries, isExpanded(new Set()))).toEqual({
      type: 'none',
    });
    expect(resolveTreeKeydown('vegetables', 'ArrowUp', entries, isExpanded(new Set()))).toEqual({
      type: 'focus',
      key: 'fruit',
    });
  });

  it('ArrowDown/ArrowUp skip disabled items without wrapping', () => {
    const entries: TreeKeyManagerItem<string>[] = [
      {
        key: 'a',
        parentKey: null,
        isExpandable: false,
        isDisabled: false,
        nodeToggle: false,
        data: 'A',
      },
      {
        key: 'b',
        parentKey: null,
        isExpandable: false,
        isDisabled: true,
        nodeToggle: false,
        data: 'B',
      },
      {
        key: 'c',
        parentKey: null,
        isExpandable: false,
        isDisabled: false,
        nodeToggle: false,
        data: 'C',
      },
    ];
    expect(resolveTreeKeydown('a', 'ArrowDown', entries, isExpanded(new Set()))).toEqual({
      type: 'focus',
      key: 'c',
    });
    expect(resolveTreeKeydown('c', 'ArrowUp', entries, isExpanded(new Set()))).toEqual({
      type: 'focus',
      key: 'a',
    });
  });

  it('ArrowRight on a collapsed expandable item expands it (focus stays)', () => {
    const entries = fixture();
    expect(resolveTreeKeydown('fruit', 'ArrowRight', entries, isExpanded(new Set()))).toEqual({
      type: 'expand',
      key: 'fruit',
    });
  });

  it('ArrowRight on an expanded item focuses its first child', () => {
    const entries = fixture(new Set(['fruit']));
    expect(
      resolveTreeKeydown('fruit', 'ArrowRight', entries, isExpanded(new Set(['fruit']))),
    ).toEqual({
      type: 'focus',
      key: 'apple',
    });
  });

  it('ArrowRight on a leaf is a no-op', () => {
    const entries = fixture(new Set(['fruit']));
    expect(
      resolveTreeKeydown('apple', 'ArrowRight', entries, isExpanded(new Set(['fruit']))),
    ).toEqual({
      type: 'none',
    });
  });

  it('ArrowLeft on an expanded item collapses it (focus stays)', () => {
    const entries = fixture(new Set(['fruit']));
    expect(
      resolveTreeKeydown('fruit', 'ArrowLeft', entries, isExpanded(new Set(['fruit']))),
    ).toEqual({
      type: 'collapse',
      key: 'fruit',
    });
  });

  it('ArrowLeft on a collapsed/leaf item focuses its parent', () => {
    const entries = fixture(new Set(['fruit']));
    expect(
      resolveTreeKeydown('apple', 'ArrowLeft', entries, isExpanded(new Set(['fruit']))),
    ).toEqual({
      type: 'focus',
      key: 'fruit',
    });
  });

  it('ArrowLeft on a root item is a no-op (no parent)', () => {
    const entries = fixture();
    expect(resolveTreeKeydown('fruit', 'ArrowLeft', entries, isExpanded(new Set()))).toEqual({
      type: 'none',
    });
  });

  it('ArrowLeft does nothing if the parent is disabled', () => {
    const entries: TreeKeyManagerItem<string>[] = [
      {
        key: 'p',
        parentKey: null,
        isExpandable: true,
        isDisabled: true,
        nodeToggle: true,
        data: 'P',
      },
      {
        key: 'c',
        parentKey: 'p',
        isExpandable: false,
        isDisabled: false,
        nodeToggle: false,
        data: 'C',
      },
    ];
    expect(resolveTreeKeydown('c', 'ArrowLeft', entries, isExpanded(new Set(['p'])))).toEqual({
      type: 'none',
    });
  });

  it('respects rtl: ArrowLeft expands / ArrowRight collapses', () => {
    const entries = fixture();
    expect(
      resolveTreeKeydown('fruit', 'ArrowLeft', entries, isExpanded(new Set()), {
        horizontalOrientation: 'rtl',
      }),
    ).toEqual({type: 'expand', key: 'fruit'});
    const expandedEntries = fixture(new Set(['fruit']));
    expect(
      resolveTreeKeydown('fruit', 'ArrowRight', expandedEntries, isExpanded(new Set(['fruit'])), {
        horizontalOrientation: 'rtl',
      }),
    ).toEqual({type: 'collapse', key: 'fruit'});
  });

  it('Home/End focus the first/last visible item, skipping disabled', () => {
    const entries = fixture(new Set(['fruit', 'vegetables']));
    expect(
      resolveTreeKeydown('apple', 'Home', entries, isExpanded(new Set(['fruit', 'vegetables']))),
    ).toEqual({
      type: 'focus',
      key: 'fruit',
    });
    expect(
      resolveTreeKeydown('apple', 'End', entries, isExpanded(new Set(['fruit', 'vegetables']))),
    ).toEqual({
      type: 'focus',
      key: entries[entries.length - 1].key,
    });
  });

  it('Enter/Space on a node with its own toggle returns toggle, not activate', () => {
    const entries = fixture();
    expect(resolveTreeKeydown('fruit', 'Enter', entries, isExpanded(new Set()))).toEqual({
      type: 'toggle',
      key: 'fruit',
    });
    expect(resolveTreeKeydown('fruit', ' ', entries, isExpanded(new Set()))).toEqual({
      type: 'toggle',
      key: 'fruit',
    });
  });

  it('Enter/Space on a leaf (no own toggle) activates it', () => {
    const entries = fixture(new Set(['fruit']));
    expect(resolveTreeKeydown('apple', 'Enter', entries, isExpanded(new Set(['fruit'])))).toEqual({
      type: 'activate',
      key: 'apple',
      data: 'Apple',
    });
  });

  it('Enter/Space on an expandable node WITHOUT its own toggle activates it', () => {
    const entries: TreeKeyManagerItem<string>[] = [
      {
        key: 'x',
        parentKey: null,
        isExpandable: true,
        isDisabled: false,
        nodeToggle: false,
        data: 'X',
      },
    ];
    expect(resolveTreeKeydown('x', 'Enter', entries, isExpanded(new Set()))).toEqual({
      type: 'activate',
      key: 'x',
      data: 'X',
    });
  });

  it('* expands every root sibling when the active item has no parent', () => {
    const entries = fixture();
    expect(resolveTreeKeydown('fruit', '*', entries, isExpanded(new Set()))).toEqual({
      type: 'expand-many',
      keys: ['fruit', 'vegetables'],
    });
  });

  it('* expands every sibling at the active item level otherwise', () => {
    const entries = fixture(new Set(['vegetables']));
    expect(resolveTreeKeydown('leafy', '*', entries, isExpanded(new Set(['vegetables'])))).toEqual({
      type: 'expand-many',
      keys: ['leafy'],
    });
  });

  it('* returns none if no sibling (including self) is expandable', () => {
    const entries = fixture(new Set(['fruit']));
    expect(resolveTreeKeydown('apple', '*', entries, isExpanded(new Set(['fruit'])))).toEqual({
      type: 'none',
    });
  });

  it('an unrecognized key returns none', () => {
    const entries = fixture();
    expect(resolveTreeKeydown('fruit', 'a', entries, isExpanded(new Set()))).toEqual({
      type: 'none',
    });
  });
});
