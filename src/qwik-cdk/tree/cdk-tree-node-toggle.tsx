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
 * both): flips `node`'s expansion and steals the roving tabindex onto
 * `node` (`tree._keyManager.focusItem(node)` — upstream does this even
 * when the node is disabled; `_toggle()` never checks it, and neither
 * does this).
 *
 * **Deviation**: does NOT also move REAL DOM focus onto the node's row
 * element (upstream's `focusItem()` calls `.focus()` too, since
 * `_shouldFocus` defaults true for a toggle-driven call). No
 * `angular-parity.spec.ts` scenario's steps depend on it (every toggle
 * click is either the last step, or followed by another toggle click —
 * never by a keyboard step that needs real focus already sitting on a
 * specific element beforehand), and doing it properly needs a DOM lookup
 * (position-indexed into the tree's rendered order — see
 * `qwik-cdk/tree/dom-utils.ts`'s `focusTreeNodeAtIndex`) that itself
 * needs the tree's current node ordering, which isn't available here
 * without widening `CDK_TREE_TOGGLE_STATE` to carry a fresh array every
 * render. `MatTree`'s OWN keyboard handler (which DOES need this, for
 * sequential arrow-key steps) has that ordering directly in scope — see
 * its own `handleRowKeyDown`.
 */
export const CdkTreeNodeToggle = component$<CdkTreeNodeToggleProps>(props => {
  const state = useContext(CDK_TREE_TOGGLE_STATE);
  const expanded = !!state.expanded[props.node];

  // IMPORTANT: pull out only the plain/QRL values this handler needs
  // BEFORE defining it, rather than reading `props.node`/`props.onToggle$`
  // directly inside `$(...)`. Qwik's closure capture serializes whatever
  // IDENTIFIER is referenced — reading a field off `props` captures the
  // WHOLE `props` object, including `collapsedLabel`/`expandedLabel`/
  // `children` (live `JSXOutput`, i.e. unserializable vnodes). Confirmed
  // live: capturing `props` directly here crashes SSR with Qwik's
  // "Code(3)" (`QError_verifySerializable`) once this component is
  // actually used inside a real page.
  const nodeKey = props.node;
  const onToggle = props.onToggle$;

  const toggle$ = $(async (event: Event) => {
    event.stopPropagation();
    const next = !state.expanded[nodeKey];
    state.expanded[nodeKey] = next;
    state.activeKey.value = nodeKey;
    if (onToggle) {
      await onToggle(nodeKey, next);
    }
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
