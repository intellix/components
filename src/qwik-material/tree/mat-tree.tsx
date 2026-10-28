import {$, component$, useContextProvider, useSignal, useStore, type QRL} from '@builder.io/qwik';
import {
  CDK_TREE_TOGGLE_STATE,
  collectInitialExpanded,
  flattenTree,
  focusTreeNodeAtIndex,
  initialActiveKey,
  type CdkTreeNodeInput,
} from '@angular-community/qwik-cdk/tree';
import {resolveTreeKeydown} from '@angular-community/qwik-cdk/a11y';

export type {CdkTreeNodeInput, FlatTreeEntry} from '@angular-community/qwik-cdk/tree';

/** `mat-tree` (Material) concatenated with `cdk-tree` (base `CdkTree` host
 *  class) — see `angular-parity.spec.ts`'s shared-skeleton comment. */
const TREE_BASE_CLASSES = ['mat-tree', 'cdk-tree'];
const FLAT_NODE_BASE_CLASSES = ['mat-tree-node', 'cdk-tree-node'];
// `CdkNestedTreeNode extends CdkTreeNode` (TS inheritance), and Angular
// concatenates host classes across the inheritance chain — a real
// `<mat-nested-tree-node>` carries CdkTreeNode's base `cdk-tree-node`
// (inherited), CdkNestedTreeNode's own `cdk-nested-tree-node`, AND
// MatNestedTreeNode's own `mat-nested-tree-node`, all three at once
// (confirmed live against the Angular reference app — easy to miss since
// `cdk-tree-node` looks like a flat-tree-only class at a glance).
const NESTED_NODE_BASE_CLASSES = ['mat-nested-tree-node', 'cdk-nested-tree-node', 'cdk-tree-node'];

function toClassArray(value: string | ReadonlyArray<string> | undefined): string[] {
  if (!value) return [];
  return typeof value === 'string' ? [value] : [...value];
}

export interface MatTreeProps<T = unknown> {
  /** `'flat'` renders every visible node as a sibling `<mat-tree-node>`
   *  (collapsed descendants are absent from the DOM entirely — matches
   *  `mat-tree-node`/`childrenAccessor`). `'nested'` renders
   *  `<mat-nested-tree-node>` recursively, with children ALWAYS present
   *  in the DOM (visibility is a `style="display: none"` on a `role=
   *  "group"` wrapper div this component generates) — matches
   *  `mat-nested-tree-node`/`matTreeNodeOutlet`. Default `'flat'`. */
  variant?: 'flat' | 'nested';
  /** Root nodes. See `CdkTreeNodeInput` for the node-definition shape. */
  nodes: CdkTreeNodeInput<T>[];
  /** `matTreeNodePaddingIndent` — pixels of `padding-left` per level, flat
   *  variant only. Default `40`. */
  indent?: number;
  /** Whether flat nodes get the `padding-left` inline style at all —
   *  matches whether the consumer's `*matTreeNodeDef` template carried
   *  `matTreeNodePadding` upstream (not every scenario's does — see
   *  `disabled-skipped` in `tree.ts`, a flat tree with no padding
   *  directive at all). Default `true`. Nested variant ignores this
   *  entirely (nested trees get indentation from the group-wrapper
   *  structure, never `matTreeNodePadding`, matching every reference
   *  scenario). */
  padding?: boolean;
  id?: string;
  class?: string | ReadonlyArray<string>;
  /** Fires when a node without its own toggle (a leaf, in every reference
   *  scenario) is activated via Enter/Space, or when `(activation)` would
   *  otherwise fire upstream. */
  onActivation$?: QRL<(data: T, key: string) => void>;
  /** Fires whenever a node's expansion state actually changes — toggle
   *  click/Enter/Space, arrow-key expand/collapse, or `*`. Mirrors
   *  `CdkTreeNode.expandedChange`. */
  onExpandedChange$?: QRL<(key: string, expanded: boolean, data: T) => void>;
}

/**
 * Faithful port of `mat-tree` (`MatTree`/`MatTreeNode`/`MatNestedTreeNode`
 * extending `CdkTree`/`CdkTreeNode`/`CdkNestedTreeNode`) + `matTreeNodeToggle`'s
 * keyboard/roving-tabindex behavior (`TreeKeyManager`). See
 * `qwik-cdk/tree/SYNC.md` for why nodes are a recursive data array and
 * `SYNC.md` (this directory) for the full upstream-sync notes and
 * deviations.
 */
export const MatTree = component$((props: MatTreeProps<unknown>) => {
  const variant = props.variant ?? 'flat';
  const indent = props.indent ?? 40;
  const padding = props.padding ?? true;

  // Expansion state is owned INTERNALLY by the tree (see
  // qwik-cdk/tree/SYNC.md "Why expansion/focus state is owned internally
  // by the tree, not the consumer") — seeded once from each node's
  // `isExpanded` input, exactly like `CdkTree._expansionModel`.
  const expanded = useStore<Record<string, boolean>>(() => collectInitialExpanded(props.nodes));
  // Tracks, per node key, whether it has EVER been collapsed (including
  // "collapsed from the very first render") — the nested group wrapper's
  // `style` attribute, once ever written with a non-null value, is never
  // fully removed again on a later render, only emptied (`style=""`) —
  // see SYNC.md's "nested group style history" note.
  const everCollapsed = useStore<Record<string, boolean>>({});

  const isExpanded = (key: string): boolean => !!expanded[key];
  const {all, visible} = flattenTree(props.nodes, isExpanded);

  for (const entry of all) {
    if (entry.hasChildren && !isExpanded(entry.key)) {
      everCollapsed[entry.key] = true;
    }
  }

  // The initial roving-tabindex target: the first non-disabled visible
  // node, computed once (mirrors `TreeKeyManager`'s `makeFocusable()` at
  // init — flips tabindex WITHOUT moving real browser focus).
  //
  // LIVE-VERIFIED quirk, FLAT variant only (see angular-parity.spec.ts's
  // 'flat-initially-expanded' notes): if that first candidate was itself
  // pre-expanded via its `isExpanded` input (the only way it could already
  // have children in `visible` at this very first computation, before any
  // interaction), Angular's key-manager pipeline settles on its FIRST
  // CHILD instead of the node itself — an artifact of pre-expanding mid-
  // render, not a generally-reasoned rule. Nested trees do NOT shift
  // (confirmed live — 'nested-initially-expanded' lands on the pre-
  // expanded node itself), so this only applies for `variant === 'flat'`.
  const activeKey = useSignal<string | null>(() => {
    const base = initialActiveKey(visible);
    if (variant === 'flat' && base) {
      const firstChild = visible.find(e => e.parentKey === base && !e.isDisabled);
      if (firstChild) return firstChild.key;
    }
    return base;
  });

  // IMPORTANT — all of the following feed INTO the `$(...)` handlers
  // below (and, for `onExpandedChange`/`dataByKey`, into the shared
  // context `CdkTreeNodeToggle` reads). Qwik's closure capture serializes
  // whatever IDENTIFIER a QRL references from its enclosing scope, so
  // these are deliberately trimmed to plain, JSON-serializable data
  // (`FlatTreeEntry.content` is live `JSXOutput`, which is NOT
  // serializable — reading `props.x` directly inside a handler captures
  // the WHOLE `props` object, `nodes`/`content` included). Confirmed
  // live: skipping this trimming crashes SSR with Qwik's "Code(3)"
  // (`QError_verifySerializable`). See `CdkTreeNodeToggle`'s matching
  // comment for the same finding.
  const onActivation = props.onActivation$;
  const onExpandedChange = props.onExpandedChange$;
  const navEntries = visible.map(e => ({
    key: e.key,
    parentKey: e.parentKey,
    isExpandable: e.isExpandable,
    isDisabled: e.isDisabled,
    nodeToggle: e.nodeToggle,
    data: e.data,
  }));
  const disabledByKey = new Map(all.map(e => [e.key, e.isDisabled] as const));
  const dataByKey = new Map(all.map(e => [e.key, e.data] as const));

  useContextProvider(CDK_TREE_TOGGLE_STATE, {
    expanded,
    activeKey,
    onExpandedChange,
    dataByKey,
  });
  // The order `treeRoot.querySelectorAll('[role="treeitem"]')` returns
  // rendered nodes in, for THIS variant — 'flat' only has visible nodes in
  // the DOM at all; 'nested' always renders every node (see
  // `focusTreeNodeAtIndex`'s doc comment). Plain strings — safe to close
  // over from a `$(...)` handler.
  const orderedKeys = (variant === 'nested' ? all : visible).map(e => e.key);

  const handleRowClick = $((event: Event, key: string) => {
    // Mirrors `MatTreeNode._focusItem()` (Material overrides the base
    // `CdkTreeNode._setActiveItem()`): disabled nodes no-op entirely;
    // otherwise `_shouldFocus` defaults true, so a click DOES force real
    // DOM focus (not just a tabindex flip).
    if (disabledByKey.get(key)) return;
    activeKey.value = key;
    (event.target as HTMLElement | null)?.focus();
  });

  const handleRowKeyDown = $(async (event: KeyboardEvent, key: string) => {
    const isExpandedNow = (k: string): boolean => !!expanded[k];
    const action = resolveTreeKeydown(key, event.key, navEntries, isExpandedNow);
    switch (action.type) {
      case 'focus': {
        event.preventDefault();
        activeKey.value = action.key;
        const treeRoot = (event.target as HTMLElement | null)?.closest('[role="tree"]');
        const index = orderedKeys.indexOf(action.key);
        if (treeRoot && index >= 0) {
          focusTreeNodeAtIndex(treeRoot, index);
        }
        break;
      }
      case 'expand': {
        event.preventDefault();
        expanded[action.key] = true;
        if (onExpandedChange) {
          await onExpandedChange(action.key, true, dataByKey.get(action.key));
        }
        break;
      }
      case 'collapse': {
        event.preventDefault();
        expanded[action.key] = false;
        if (onExpandedChange) {
          await onExpandedChange(action.key, false, dataByKey.get(action.key));
        }
        break;
      }
      case 'toggle': {
        event.preventDefault();
        const next = !expanded[action.key];
        expanded[action.key] = next;
        if (onExpandedChange) {
          await onExpandedChange(action.key, next, dataByKey.get(action.key));
        }
        break;
      }
      case 'activate': {
        event.preventDefault();
        if (onActivation) {
          await onActivation(action.data, action.key);
        }
        break;
      }
      case 'expand-many': {
        event.preventDefault();
        for (const k of action.keys) {
          expanded[k] = true;
        }
        break;
      }
      default:
        break;
    }
  });

  const treeClasses = [...TREE_BASE_CLASSES, ...toClassArray(props.class)];

  // Used only in the synchronous render body below (never captured inside
  // a `$(...)` handler) — safe to keep the full entry, `content` included.
  const metaByKey = new Map(all.map(e => [e.key, e] as const));

  function renderNestedNode(node: CdkTreeNodeInput<unknown>) {
    const key = node.key;
    const meta = metaByKey.get(key)!;
    const show = isExpanded(key);
    const ariaExpanded: 'true' | 'false' | undefined = meta.isExpandable
      ? show
        ? 'true'
        : 'false'
      : undefined;
    const rowAttrs = {
      role: 'treeitem' as const,
      class: NESTED_NODE_BASE_CLASSES,
      tabIndex: activeKey.value === key ? 0 : -1,
      'aria-level': meta.level + 1,
      'aria-posinset': meta.posinset,
      'aria-setsize': meta.setsize,
      'aria-expanded': ariaExpanded,
      onClick$: $((event: Event) => handleRowClick(event, key)),
      onKeyDown$: $((event: KeyboardEvent) => handleRowKeyDown(event, key)),
    };
    if (node.isExpandable) {
      const groupStyle: string | undefined = show
        ? everCollapsed[key]
          ? ''
          : undefined
        : 'display: none';
      return (
        <mat-nested-tree-node key={key} {...rowAttrs}>
          <div class="mat-tree-node">{node.content}</div>
          <div role="group" style={groupStyle}>
            {(node.children ?? []).map(child => renderNestedNode(child))}
          </div>
        </mat-nested-tree-node>
      );
    }
    return (
      <mat-nested-tree-node key={key} {...rowAttrs}>
        {node.content}
      </mat-nested-tree-node>
    );
  }

  if (variant === 'nested') {
    return (
      <mat-tree id={props.id} role="tree" class={treeClasses}>
        {props.nodes.map(node => renderNestedNode(node))}
      </mat-tree>
    );
  }

  return (
    <mat-tree id={props.id} role="tree" class={treeClasses}>
      {visible.map(entry => {
        const key = entry.key;
        return (
          <mat-tree-node
            key={key}
            role="treeitem"
            class={FLAT_NODE_BASE_CLASSES}
            style={padding ? {paddingLeft: `${entry.level * indent}px`} : undefined}
            tabIndex={activeKey.value === key ? 0 : -1}
            aria-level={entry.level + 1}
            aria-posinset={entry.posinset}
            aria-setsize={entry.setsize}
            aria-expanded={entry.isExpandable ? (isExpanded(key) ? 'true' : 'false') : undefined}
            onClick$={$((event: Event) => handleRowClick(event, key))}
            onKeyDown$={$((event: KeyboardEvent) => handleRowKeyDown(event, key))}
          >
            {entry.content}
          </mat-tree-node>
        );
      })}
    </mat-tree>
  );
});
