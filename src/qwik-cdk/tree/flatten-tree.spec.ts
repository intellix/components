import {describe, expect, it} from 'vitest';
import {
  collectInitialExpanded,
  flattenTree,
  initialActiveKey,
  type CdkTreeNodeInput,
} from './flatten-tree';

/** Fruit/Vegetables fixture mirroring `src/dev-app/qwik-parity/tree.ts`'s
 *  `foodData()`: Fruit -> [Apple, Banana], Vegetables -> [Leafy greens ->
 *  [Spinach, Kale], Carrot]. */
function foodNodes(opts: {fruitExpanded?: boolean} = {}): CdkTreeNodeInput<string>[] {
  return [
    {
      key: 'fruit',
      data: 'Fruit',
      isExpandable: true,
      isExpanded: opts.fruitExpanded,
      content: 'Fruit',
      children: [
        {key: 'apple', data: 'Apple', content: 'Apple'},
        {key: 'banana', data: 'Banana', content: 'Banana'},
      ],
    },
    {
      key: 'vegetables',
      data: 'Vegetables',
      isExpandable: true,
      content: 'Vegetables',
      children: [
        {
          key: 'leafy',
          data: 'Leafy greens',
          isExpandable: true,
          content: 'Leafy greens',
          children: [
            {key: 'spinach', data: 'Spinach', content: 'Spinach'},
            {key: 'kale', data: 'Kale', content: 'Kale'},
          ],
        },
        {key: 'carrot', data: 'Carrot', content: 'Carrot'},
      ],
    },
  ];
}

describe('flattenTree', () => {
  it('all contains every node regardless of expansion', () => {
    const {all} = flattenTree(foodNodes(), () => false);
    expect(all.map(e => e.key)).toEqual([
      'fruit',
      'apple',
      'banana',
      'vegetables',
      'leafy',
      'spinach',
      'kale',
      'carrot',
    ]);
  });

  it('visible excludes descendants of collapsed ancestors', () => {
    const {visible} = flattenTree(foodNodes(), () => false);
    expect(visible.map(e => e.key)).toEqual(['fruit', 'vegetables']);
  });

  it('visible includes only expanded branches, recursively', () => {
    const expanded = new Set(['vegetables']);
    const {visible} = flattenTree(foodNodes(), key => expanded.has(key));
    // leafy itself is visible (its parent, vegetables, is expanded) but its
    // own children (spinach/kale) are not, since leafy itself is collapsed.
    expect(visible.map(e => e.key)).toEqual(['fruit', 'vegetables', 'leafy', 'carrot']);
  });

  it('visible includes grandchildren when the whole ancestor chain is expanded', () => {
    const expanded = new Set(['vegetables', 'leafy']);
    const {visible} = flattenTree(foodNodes(), key => expanded.has(key));
    expect(visible.map(e => e.key)).toEqual([
      'fruit',
      'vegetables',
      'leafy',
      'spinach',
      'kale',
      'carrot',
    ]);
  });

  it('computes 0-indexed level', () => {
    const {all} = flattenTree(foodNodes(), () => true);
    const byKey = new Map(all.map(e => [e.key, e]));
    expect(byKey.get('fruit')!.level).toBe(0);
    expect(byKey.get('apple')!.level).toBe(1);
    expect(byKey.get('leafy')!.level).toBe(1);
    expect(byKey.get('spinach')!.level).toBe(2);
  });

  it('computes parentKey', () => {
    const {all} = flattenTree(foodNodes(), () => true);
    const byKey = new Map(all.map(e => [e.key, e]));
    expect(byKey.get('fruit')!.parentKey).toBeNull();
    expect(byKey.get('apple')!.parentKey).toBe('fruit');
    expect(byKey.get('spinach')!.parentKey).toBe('leafy');
  });

  it('computes posinset/setsize from ALL siblings, regardless of expansion', () => {
    const {all} = flattenTree(foodNodes(), () => false);
    const byKey = new Map(all.map(e => [e.key, e]));
    expect(byKey.get('fruit')!.posinset).toBe(1);
    expect(byKey.get('fruit')!.setsize).toBe(2);
    expect(byKey.get('vegetables')!.posinset).toBe(2);
    expect(byKey.get('vegetables')!.setsize).toBe(2);
    // leafy/carrot's posinset/setsize are computed even though they're not
    // "visible" in this call (vegetables is collapsed) — matches upstream
    // populating `_ariaSets` unconditionally during the recursive walk.
    expect(byKey.get('leafy')!.posinset).toBe(1);
    expect(byKey.get('leafy')!.setsize).toBe(2);
    expect(byKey.get('carrot')!.posinset).toBe(2);
  });

  it('defaults nodeToggle to isExpandable when not set', () => {
    const {all} = flattenTree(foodNodes(), () => true);
    const byKey = new Map(all.map(e => [e.key, e]));
    expect(byKey.get('fruit')!.nodeToggle).toBe(true);
    expect(byKey.get('apple')!.nodeToggle).toBe(false);
  });

  it('respects an explicit nodeToggle override', () => {
    const nodes: CdkTreeNodeInput<string>[] = [
      {key: 'x', data: 'X', isExpandable: true, nodeToggle: false, content: 'X'},
    ];
    const {all} = flattenTree(nodes, () => true);
    expect(all[0].nodeToggle).toBe(false);
  });
});

describe('collectInitialExpanded', () => {
  it('returns an empty map when nothing is pre-expanded', () => {
    expect(collectInitialExpanded(foodNodes())).toEqual({});
  });

  it('seeds true for every node with isExpanded set', () => {
    expect(collectInitialExpanded(foodNodes({fruitExpanded: true}))).toEqual({fruit: true});
  });
});

describe('initialActiveKey', () => {
  it('returns the first non-disabled visible entry', () => {
    const {visible} = flattenTree(foodNodes(), () => false);
    expect(initialActiveKey(visible)).toBe('fruit');
  });

  it('skips disabled entries', () => {
    const nodes: CdkTreeNodeInput<string>[] = [
      {key: 'a', data: 'A', isDisabled: true, content: 'A'},
      {key: 'b', data: 'B', content: 'B'},
    ];
    const {visible} = flattenTree(nodes, () => false);
    expect(initialActiveKey(visible)).toBe('b');
  });

  it('returns null for an empty tree', () => {
    expect(initialActiveKey([])).toBeNull();
  });
});
