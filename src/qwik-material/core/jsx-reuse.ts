import {jsx} from '@qwik.dev/core';

/**
 * Duck-types a `JSXOutput` value as a `JSXNode` using only the fields the public `JSXNode<T>`
 * interface guarantees (`type`/`props`/`children`/`key`) — safe across Qwik versions, unlike the
 * internal `_isJSXNode`/`JSXNodeImpl` brand check.
 */
function isJsxNodeLike(value: unknown): value is {
  type: unknown;
  props: Record<string, unknown>;
  children: unknown;
  key: string | null;
} {
  return (
    typeof value === 'object' &&
    value !== null &&
    'type' in value &&
    'props' in value &&
    'children' in value &&
    'key' in value
  );
}

/**
 * Deep-clones a captured `JSXOutput` tree into brand-new node objects via the public `jsx()`
 * factory, so it's safe to render a SECOND (or Nth) time.
 *
 * Why this exists: a few components in this port deliberately capture a caller's `JSXOutput`
 * ONCE (stashed on a long-lived handle/signal, outside the normal JSX-children/`<Slot/>`
 * call-site flow) and re-render that SAME node tree every time an overlay opens — e.g.
 * `qwik-material/datepicker`'s `MatDatepicker`/`MatDateRangePicker` `actions` prop, captured by
 * `mat-datepicker.tsx` and replayed by `datepicker-runtime.ts`'s `openDatepickerPanel`/
 * `openDateRangePickerPanel` into a BRAND NEW `MatDatepickerContent` overlay instance on every
 * open (see that file's own doc comment for why: upstream re-attaches the same actions
 * `TemplatePortal` on every open; this port recreates the buttons per open instead). Confirmed
 * correct under Qwik v1 (`actions (field)` passed the Angular-vs-Qwik parity harness 3
 * consecutive times). Under Qwik v2's vnode renderer, `JSXNodeImpl` caches render-time state
 * directly on the node object itself (its `props` getter lazily memoizes a proxy via
 * `this._proxy ||= createPropsProxy(this)`) — confirmed live: a datepicker actions row's
 * Cancel/Apply buttons render with their correct text on the FIRST open of a session, then with
 * completely EMPTY labels (`.mdc-button__label` present but childless) on every subsequent open
 * reusing the same captured JSX reference, even once the Slot-forwarding half of the same bug
 * (see `mat-datepicker-content.tsx`'s `ActionsOutlet`) was separately fixed. Rebuilding a fresh,
 * never-before-rendered node tree before each use sidesteps it — call this at the point where a
 * previously-captured `JSXOutput` is about to be handed to a new render tree, not where it was
 * originally captured (the first use needs no clone, and over-cloning is harmless but wasteful).
 */
export function cloneJsxForReuse<T>(node: T): T {
  if (Array.isArray(node)) {
    return node.map(cloneJsxForReuse) as unknown as T;
  }
  if (!isJsxNodeLike(node)) {
    return node;
  }
  const clonedChildren = cloneJsxForReuse(node.children);
  const nextProps = {...node.props, children: clonedChildren};
  return jsx(node.type as never, nextProps as never, node.key) as unknown as T;
}
