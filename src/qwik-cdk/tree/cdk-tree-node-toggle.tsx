import {$, component$, useContext, type JSXOutput, type QRL} from '@builder.io/qwik';
import {CDK_TREE_TOGGLE_STATE} from './tree-context';

export interface CdkTreeNodeToggleProps {
  /** The key (`CdkTreeNodeInput.key`) of the node this toggles. */
  node: string;
  /** Mirrors `matTreeNodeToggleRecursive` — toggling expands/collapses
   *  every descendant too, not just this node. **Not implemented**: no
   *  `angular-parity.spec.ts` scenario exercises it, and doing so
   *  correctly needs the tree to hand this component a descendant-key
   *  lookup, which (being a plain function, not a signal/store/QRL) can't
   *  cross the context boundary the same safe way `expanded`/`activeKey`
   *  do — see `SYNC.md`. Accepted for API shape parity; currently a no-op
   *  beyond toggling `node` itself. */
  recursive?: boolean;
  /** Host tag. Default `'button'` (every reference scenario uses a plain
   *  `<button type="button">`). */
  as?: 'button' | 'span';
  class?: string | ReadonlyArray<string>;
  'aria-label'?: string;
  /** Content shown while collapsed. Falls back to `children`. */
  collapsedLabel?: JSXOutput | string;
  /** Content shown while expanded. Falls back to `children`. */
  expandedLabel?: JSXOutput | string;
  children?: JSXOutput | string;
  /** Fires after this toggle flips `node`'s expansion state — mirrors
   *  `CdkTreeNode.expandedChange`, scoped to toggle-driven changes. */
  onToggle$?: QRL<(key: string, expanded: boolean) => void>;
}

function findNodeElement(from: Element, key: string): HTMLElement | null {
  const root = from.closest('[role="tree"]');
  if (!root) return null;
  const candidates = root.querySelectorAll<HTMLElement>('[data-cdk-tree-node-key]');
  for (const el of candidates) {
    if (el.dataset.cdkTreeNodeKey === key) return el;
  }
  return null;
}

/**
 * Faithful port of `[cdkTreeNodeToggle]` (`src/cdk/tree/toggle.ts`).
 * Renders the toggle element ITSELF (polymorphic `as`, default
 * `'button'`) rather than wrapping a separately-authored one, since
 * upstream applies this as a directive directly on a consumer element
 * (the pattern noted in the DOM-parity remediation design doc §4). Static
 * `tabIndex={-1}` matches upstream's host `'tabindex': '-1'` binding
 * exactly (real roving focus always lands on the tree NODE, never the
 * toggle button itself — see `SYNC.md`).
 *
 * Reads the node's current expanded state and the tree's roving-focus key
 * via `CDK_TREE_TOGGLE_STATE` context (provided by `MatTree`), so it
 * works correctly wherever the consumer places it inside a node's
 * `content`. On click (or Enter/Space — upstream's `_toggle` is bound to
 * both): flips `node`'s expansion, steals the roving tabindex onto `node`
 * (`tree._keyManager.focusItem(node)` — upstream does this even when the
 * node is disabled; `_toggle()` never checks it, and neither does this),
 * and moves real DOM focus onto the node's row element.
 */
export const CdkTreeNodeToggle = component$<CdkTreeNodeToggleProps>(props => {
  const state = useContext(CDK_TREE_TOGGLE_STATE);
  const expanded = !!state.expanded[props.node];

  const toggle$ = $(async (event: Event) => {
    event.stopPropagation();
    const next = !state.expanded[props.node];
    state.expanded[props.node] = next;
    state.activeKey.value = props.node;
    if (props.onToggle$) {
      await props.onToggle$(props.node, next);
    }
    const target = event.target as Element | null;
    const nodeEl = target ? findNodeElement(target, props.node) : null;
    nodeEl?.focus();
  });

  const onKeyDown$ = $((event: KeyboardEvent) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      void toggle$(event);
    }
  });

  const content = expanded
    ? (props.expandedLabel ?? props.children)
    : (props.collapsedLabel ?? props.children);

  if (props.as === 'span') {
    return (
      <span
        tabIndex={-1}
        class={props.class}
        aria-label={props['aria-label']}
        onClick$={toggle$}
        onKeyDown$={onKeyDown$}
      >
        {content}
      </span>
    );
  }

  return (
    <button
      type="button"
      tabIndex={-1}
      class={props.class}
      aria-label={props['aria-label']}
      onClick$={toggle$}
      onKeyDown$={onKeyDown$}
    >
      {content}
    </button>
  );
});
