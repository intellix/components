// Angular finds its grid tiles via `@ContentChildren(MatGridTile, {descendants: true})`
// — a live QueryList the list re-derives on every change-detection pass.
// Qwik has no content-query equivalent, and `<MatGridList>` needs every
// tile's rowspan/colspan *before* it can compute its own `height` /
// `padding-bottom` style (TileStyler needs the full tile set up front — see
// mat-grid-list.tsx). The fix: JSX children are plain data at the point the
// function that receives them runs — `<MatGridTile rowspan={2} .../>` is
// just a JSXNode with `props.rowspan === 2`, already evaluated, no QRL
// involved. Qwik's `component$` strips `children` from the props its render
// function receives (by design — see mat-grid-list.tsx's header comment),
// so this only works because `<MatGridList>` is a plain function, not a
// `component$`. Walking the tree once, synchronously, during that plain
// function's own execution gives the same "spans known up front, in
// document order" result as upstream's QueryList, entirely SSR-safe.
import type {JSXChildren, JSXNode} from '@qwik.dev/core';

function isJsxNode(value: unknown): value is JSXNode {
  return typeof value === 'object' && value !== null && 'type' in (value as object);
}

function toList(children: JSXChildren | undefined | null): JSXChildren[] {
  if (children == null) return [];
  return Array.isArray(children) ? children : [children];
}

/**
 * Depth-first walk of a children tree collecting every node whose `type` is
 * `target`, in document order. Descends into plain-element children (string
 * tags carry their children on `node.children`) and into other components'
 * projected content (component tags carry it on `node.props.children`) —
 * but does NOT descend into a *matched* node's own content, mirroring
 * `{descendants: true}` without matching inside an already-matched tile.
 */
export function collectTypedChildren<P>(
  children: JSXChildren | undefined | null,
  target: unknown,
): {props: P}[] {
  const out: {props: P}[] = [];

  const visit = (node: JSXChildren): void => {
    if (node == null || typeof node === 'boolean') return;
    if (Array.isArray(node)) {
      for (const child of node) visit(child);
      return;
    }
    if (!isJsxNode(node)) return; // string | number — leaf, nothing to collect
    if (node.type === target) {
      out.push(node as unknown as {props: P});
      return;
    }
    const props = node.props as {children?: JSXChildren} | undefined;
    if (props && 'children' in props) visit(props.children as JSXChildren);
    if (node.children != null) visit(node.children);
  };

  for (const child of toList(children)) visit(child);
  return out;
}

/**
 * Splits a *direct* children list into three buckets by type, preserving
 * relative order within each bucket. Used by MatGridTileHeader/Footer to
 * reproduce upstream's `grid-tile-text.html` projection order (avatar, then
 * lines, then default content) — see mat-grid-tile-text.tsx. Intentionally
 * shallow (direct children only): upstream's `<ng-content select="...">`
 * only matches projected top-level content too in the common case, and
 * nothing in this package exercises deeper nesting.
 */
export function partitionDirectChildren(
  children: JSXChildren | undefined | null,
  avatarType: unknown,
  lineType: unknown,
): {avatar: JSXNode[]; lines: JSXNode[]; rest: JSXChildren[]} {
  const avatar: JSXNode[] = [];
  const lines: JSXNode[] = [];
  const rest: JSXChildren[] = [];
  for (const child of toList(children)) {
    if (isJsxNode(child) && child.type === avatarType) {
      avatar.push(child);
    } else if (isJsxNode(child) && child.type === lineType) {
      lines.push(child);
    } else {
      rest.push(child);
    }
  }
  return {avatar, lines, rest};
}
