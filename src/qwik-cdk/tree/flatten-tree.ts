import type {JSXOutput} from '@builder.io/qwik';

/**
 * One node of a tree, as the consumer provides it. This is the node-
 * definition shape this port settles on (see `SYNC.md` "Why nodes are
 * data, not slotted templates" for the full rationale) — a recursive,
 * SSR-readable, migration-friendly replacement for upstream's
 * `*matTreeNodeDef`/`childrenAccessor` combination:
 *
 * - Hierarchy is a plain recursive `children` array, not a `childrenAccessor`
 *   function — Qwik component props must be serializable, and a function
 *   can't be (see `qwik-material/table/SYNC.md`'s "a `component$`'s render
 *   function cannot be async" finding, which rules out calling a consumer
 *   function synchronously during render too, for the same reason
 *   `MatTable` ended up with pre-realized data instead of callbacks).
 *   Since the dev-app scenarios' own `childrenAccessor = node =>
 *   node.children ?? []` is already this shape, migrating a real
 *   `childrenAccessor`-based tree means calling it once, up front, to
 *   build this recursive array — trivial.
 * - `isExpandable`/`isDisabled`/`isExpanded` are explicit flags (never
 *   inferred from `children.length` or a `when` predicate), mirroring
 *   upstream's OWN `isExpandable` input, which is likewise never inferred
 *   (see the scenario file's header comment) — carrying that explicitness
 *   straight into the port's API keeps a migration mechanical.
 * - `content` is the node's pre-built inner JSX (what upstream's
 *   `*matTreeNodeDef` template would have rendered) — exactly
 *   `MatColumnDef.header`'s shape, generalized to tree nodes. The ONE piece
 *   of content that needs LIVE access to the tree's own internal state —
 *   the toggle button's label/expanded-ness — is NOT baked into `content`
 *   as a static value; instead the consumer places a `<CdkTreeNodeToggle>`
 *   (`cdk-tree-node-toggle.tsx`) inside `content`, which reads the tree's
 *   shared state via context and re-renders itself independently,
 *   mirroring how `MatSortHeader` reads `MAT_SORT_STATE` from inside a
 *   `MatColumnDef.header` value in `qwik-material/table`.
 */
export interface CdkTreeNodeInput<T = unknown> {
  /** Stable identity for this node — used for tracking, expansion state,
   *  the roving tabindex, and keyboard navigation. Must be unique across
   *  the whole tree. */
  key: string;
  /** The underlying data for this node (handed back via `onActivation$`/
   *  `onExpandedChange$`). */
  data: T;
  /** Direct children, in document order. Omit (or pass `[]`) for a leaf. */
  children?: CdkTreeNodeInput<T>[];
  /** Mirrors `[isExpandable]` — must be set explicitly; never inferred
   *  from `children`'s presence. Controls whether `aria-expanded` is
   *  rendered at all. */
  isExpandable?: boolean;
  /** Mirrors `[isDisabled]`. Adds no visible attribute/class (matches
   *  upstream) — only excludes the node from keyboard navigation/initial
   *  focus and no-ops its own click-to-focus handler. */
  isDisabled?: boolean;
  /** Mirrors `[isExpanded]` — read ONCE, the first time this key is seen,
   *  to seed initial expansion state (see `collectInitialExpanded`).
   *  Ongoing expansion is owned by `MatTree` internally thereafter
   *  (toggle clicks, arrow-key expand/collapse), exactly as upstream's
   *  `CdkTree._expansionModel` is internal once seeded. */
  isExpanded?: boolean;
  /** Mirrors whether `matTreeNodeToggle` is applied to the NODE element
   *  itself (as opposed to only an inner button) — when true, Enter/Space
   *  while this node is focused toggles expansion instead of calling
   *  `onActivation$` (see `tree-key-manager.ts`'s header comment on
   *  `CdkTreeNodeToggle`'s `stopPropagation`). Defaults to `isExpandable`'s
   *  value, matching every expandable node in the reference scenarios
   *  (which all carry `matTreeNodeToggle` on both the node and its inner
   *  button). Set `false` to let Enter/Space activate an expandable node
   *  instead. */
  nodeToggle?: boolean;
  /** This node's inner content — see the interface doc comment above. */
  content: JSXOutput | string;
}

/** One node after flattening, with computed aria/keyboard-navigation
 *  metadata — the equivalent of upstream's `_levels`/`_parents`/
 *  `_ariaSets` maps, keyed by node instead. */
export interface FlatTreeEntry<T = unknown> {
  key: string;
  data: T;
  content: JSXOutput | string;
  /** 0-indexed depth (upstream's `aria-level` is `level + 1`). */
  level: number;
  parentKey: string | null;
  /** 1-indexed position among ALL siblings (regardless of their own
   *  expansion state) — `aria-posinset`. */
  posinset: number;
  /** Total sibling count (regardless of expansion) — `aria-setsize`. */
  setsize: number;
  isExpandable: boolean;
  isDisabled: boolean;
  nodeToggle: boolean;
  hasChildren: boolean;
}

export interface FlattenTreeResult<T> {
  /** Every node, regardless of its ancestors' expansion state — used for
   *  NESTED rendering (always present in the DOM) and for aria
   *  bookkeeping, matching upstream's `_flattenNestedNodesWithExpansion`
   *  always recursing into (and computing levels/parents/aria-sets for)
   *  every node even when its parent is collapsed. */
  all: FlatTreeEntry<T>[];
  /** Only nodes whose FULL ancestor chain is expanded — used for FLAT
   *  rendering (collapsed nodes' descendants aren't in the DOM at all)
   *  AND as the `TreeKeyManagerItem` list for keyboard navigation in
   *  EITHER mode (upstream scopes `TreeKeyManager`'s own item list to this
   *  same expansion-aware flattening regardless of flat/nested rendering —
   *  see the scenario file's keyboard-nav notes). */
  visible: FlatTreeEntry<T>[];
}

/**
 * Faithful port of `CdkTree._flattenNestedNodesWithExpansion` (the
 * recursive walk that computes level/parent/aria-set bookkeeping for every
 * node and filters the RETURNED list by ancestor expansion), generalized
 * to also keep every node (`all`) for nested rendering.
 */
export function flattenTree<T>(
  roots: readonly CdkTreeNodeInput<T>[],
  isExpanded: (key: string) => boolean,
): FlattenTreeResult<T> {
  const all: FlatTreeEntry<T>[] = [];
  const visible: FlatTreeEntry<T>[] = [];

  function walk(
    nodes: readonly CdkTreeNodeInput<T>[],
    level: number,
    parentKey: string | null,
    ancestorsExpanded: boolean,
  ): void {
    const setsize = nodes.length;
    nodes.forEach((node, i) => {
      const isExpandable = !!node.isExpandable;
      const entry: FlatTreeEntry<T> = {
        key: node.key,
        data: node.data,
        content: node.content,
        level,
        parentKey,
        posinset: i + 1,
        setsize,
        isExpandable,
        isDisabled: !!node.isDisabled,
        nodeToggle: node.nodeToggle ?? isExpandable,
        hasChildren: !!node.children?.length,
      };
      all.push(entry);
      if (ancestorsExpanded) {
        visible.push(entry);
      }
      if (node.children?.length) {
        walk(node.children, level + 1, node.key, ancestorsExpanded && isExpanded(node.key));
      }
    });
  }

  walk(roots, 0, null, true);
  return {all, visible};
}

/** Seeds the initial `{key: expanded}` map from every node's `isExpanded`
 *  input, read once at construction time (mirrors `CdkTreeNode.isExpanded`
 *  setter being driven by the `[isExpanded]` binding on first render). */
export function collectInitialExpanded<T>(
  roots: readonly CdkTreeNodeInput<T>[],
): Record<string, boolean> {
  const result: Record<string, boolean> = {};
  function walk(nodes: readonly CdkTreeNodeInput<T>[]): void {
    for (const node of nodes) {
      if (node.isExpanded) {
        result[node.key] = true;
      }
      if (node.children?.length) {
        walk(node.children);
      }
    }
  }
  walk(roots);
  return result;
}

/** The first non-disabled entry in document order — the initial roving-
 *  tabindex target (mirrors `TreeKeyManager._initializeFocus`'s
 *  `makeFocusable()` call, minus moving real browser focus, which SSR
 *  can't do and upstream itself deliberately avoids for the SAME reason —
 *  "the user isn't interacting with it"). */
export function initialActiveKey<T>(visible: readonly FlatTreeEntry<T>[]): string | null {
  return visible.find(e => !e.isDisabled)?.key ?? null;
}
