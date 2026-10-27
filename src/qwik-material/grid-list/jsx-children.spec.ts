import {describe, it, expect} from 'vitest';
import {collectTypedChildren, partitionDirectChildren} from './jsx-children';

// Real (non-smoke) coverage: a JSXNode is plain data (`{type, props, children}`)
// at the point a parent component$ runs (see this file's upstream header
// comment), so these fakes exercise the exact walk without needing Qwik's
// render pipeline — which this package's vitest setup doesn't use for any
// component (see mat-grid-list-scenarios.spec.tsx's header comment).

const TileType = Symbol('MatGridTile');
const OtherComponentType = Symbol('SomeOtherComponent');
const AvatarType = Symbol('MatGridAvatar');
const LineType = Symbol('MatLine');

function tileNode(props: Record<string, unknown>) {
  return {type: TileType, props, children: null, key: null};
}
function divNode(children: unknown) {
  return {type: 'div', props: {}, children, key: null};
}
function componentNode(type: unknown, children: unknown) {
  return {type, props: {children}, children: null, key: null};
}

describe('collectTypedChildren', () => {
  it('returns [] for null/undefined children', () => {
    expect(collectTypedChildren(null, TileType)).toEqual([]);
    expect(collectTypedChildren(undefined, TileType)).toEqual([]);
  });

  it('collects direct matches, in order, from an array', () => {
    const a = tileNode({rowspan: 2});
    const b = tileNode({rowspan: 1});
    const out = collectTypedChildren([a, b], TileType);
    expect(out.map(n => n.props)).toEqual([{rowspan: 2}, {rowspan: 1}]);
  });

  it('wraps a single non-array child into a one-element result', () => {
    const a = tileNode({colspan: 3});
    expect(collectTypedChildren(a, TileType).map(n => n.props)).toEqual([{colspan: 3}]);
  });

  it('descends into a plain-element wrapper (node.children)', () => {
    const inner = tileNode({rowspan: 1});
    const wrapper = divNode([inner]);
    expect(collectTypedChildren([wrapper], TileType).map(n => n.props)).toEqual([{rowspan: 1}]);
  });

  it("descends into another component's projected content (node.props.children)", () => {
    const inner = tileNode({rowspan: 1});
    const wrapper = componentNode(OtherComponentType, [inner]);
    expect(collectTypedChildren([wrapper], TileType).map(n => n.props)).toEqual([{rowspan: 1}]);
  });

  it("does not descend into a matched node's own children", () => {
    const nestedTile = tileNode({rowspan: 9});
    const outerTile = tileNode({rowspan: 1});
    (outerTile as {children: unknown}).children = [nestedTile];
    const out = collectTypedChildren([outerTile], TileType);
    expect(out).toHaveLength(1);
    expect(out[0].props).toEqual({rowspan: 1});
  });

  it('skips strings, numbers, booleans and null leaves', () => {
    const a = tileNode({rowspan: 1});
    const out = collectTypedChildren(['text', 42, true, null, a], TileType);
    expect(out.map(n => n.props)).toEqual([{rowspan: 1}]);
  });
});

describe('partitionDirectChildren', () => {
  it('buckets avatar/line/rest, preserving order within each bucket', () => {
    const avatar1 = {type: AvatarType, props: {}, children: null, key: null};
    const line1 = {type: LineType, props: {}, children: null, key: null};
    const line2 = {type: LineType, props: {}, children: null, key: null};
    const other = 'plain text';

    const {avatar, lines, rest} = partitionDirectChildren(
      [other, avatar1, line1, line2],
      AvatarType,
      LineType,
    );

    expect(avatar).toEqual([avatar1]);
    expect(lines).toEqual([line1, line2]);
    expect(rest).toEqual([other]);
  });

  it('returns empty buckets for no children', () => {
    expect(partitionDirectChildren(null, AvatarType, LineType)).toEqual({
      avatar: [],
      lines: [],
      rest: [],
    });
  });
});
