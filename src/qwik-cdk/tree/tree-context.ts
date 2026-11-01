import {createContextId, type QRL, type Signal} from '@qwik.dev/core';

/**
 * Shared state a tree (`MatTree`) provides and `CdkTreeNodeToggle` (placed
 * anywhere inside a node's `content`, however deep) reads/writes.
 * `expanded`/`activeKey` are Qwik reactive primitives (a `useStore` proxy
 * and a `useSignal`), not plain values or closures — passing a
 * signal/store through context for a descendant to mutate is a standard,
 * fully serializable Qwik pattern (unlike a plain callback FUNCTION, which
 * is NOT serializable — see `qwik-cdk/tree/SYNC.md`'s design notes for why
 * that distinction shaped this whole port). `onExpandedChange`/`dataByKey`
 * are, respectively, a QRL (itself always serializable, regardless of
 * where it's stashed) and a plain `Map` of DATA ONLY (no `JSXOutput`,
 * unlike the `FlatTreeEntry`s it's built from) — both safe for the same
 * reason.
 */
export interface CdkTreeToggleState {
  /** `{[key]: expanded}`, owned by the tree. Mutated directly (no setter
   *  function needed — store proxies are mutable from any descendant). */
  expanded: Record<string, boolean>;
  /** The currently-focused (roving tabindex) node key, owned by the tree. */
  activeKey: Signal<string | null>;
  /** The tree's own `onExpandedChange$` prop (`MatTreeProps.onExpandedChange$`)
   *  — `CdkTreeNodeToggle` calls this too (in addition to its own, more
   *  narrowly-scoped `onToggle$` prop) so a toggle-CLICK-driven change is
   *  reported through the SAME tree-level callback a keyboard-driven
   *  expand/collapse/`*` already is, mirroring upstream's single
   *  `(expandedChange)` output firing for every cause. */
  onExpandedChange?: QRL<(key: string, expanded: boolean, data: unknown) => void>;
  /** Node data by key, for `onExpandedChange`'s third argument — see above. */
  dataByKey: Map<string, unknown>;
}

export const CDK_TREE_TOGGLE_STATE = createContextId<CdkTreeToggleState>('cdk-tree-toggle-state');
