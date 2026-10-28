import {createContextId, type Signal} from '@builder.io/qwik';

/**
 * Shared state a tree (`MatTree`) provides and `CdkTreeNodeToggle` (placed
 * anywhere inside a node's `content`, however deep) reads/writes. Both
 * members are Qwik reactive primitives (a `useStore` proxy and a
 * `useSignal`), not plain values or closures — passing a signal/store
 * through context for a descendant to mutate is a standard, fully
 * serializable Qwik pattern (unlike a plain callback function, which is
 * NOT serializable — see `qwik-cdk/tree/SYNC.md`'s design notes for why
 * that distinction shaped this whole port).
 */
export interface CdkTreeToggleState {
  /** `{[key]: expanded}`, owned by the tree. Mutated directly (no setter
   *  function needed — store proxies are mutable from any descendant). */
  expanded: Record<string, boolean>;
  /** The currently-focused (roving tabindex) node key, owned by the tree. */
  activeKey: Signal<string | null>;
}

export const CDK_TREE_TOGGLE_STATE = createContextId<CdkTreeToggleState>('cdk-tree-toggle-state');
