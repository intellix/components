import {
  $,
  component$,
  useContextProvider,
  useSignal,
  useStore,
  useVisibleTask$,
  type QRL,
} from '@qwik.dev/core';
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
  /** Nested variant only. Upstream's nested group-wrapper `<div role="group">` visibility is
   *  entirely CONSUMER-AUTHORED (part of the `*matTreeNodeDef` template a real consumer writes),
   *  and real examples use either of two equally valid patterns: an inline `[style.display]`
   *  binding, or a stylesheet class toggled via `[class.foo]`. Since `<MatTree>` synthesizes this
   *  wrapper itself (see `SYNC.md` deviation 1), it must pick ONE default — the inline-style
   *  form (matching every scenario in this port's own parity contract). Set `nestedHiddenClass`
   *  to switch to the class-toggle form instead (e.g. a real upstream doc example whose own CSS
   *  defines `.example-tree-invisible { display: none; }`): the wrapper then gets this class
   *  while collapsed and NO `style` attribute at all, matching that pattern exactly — you own
   *  defining the class's actual CSS. Omit for the default inline-style behavior. */
  nestedHiddenClass?: string;
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

  // Qwik v2 regression, flat variant only: expanding/collapsing a node
  // inserts/removes SIBLING `<mat-tree-node>` elements (the flat variant's
  // whole DOM shape — collapsed descendants aren't present at all, unlike
  // the nested variant's always-present, `display:none`-toggled wrapper,
  // which is why ONLY this variant needs this fix). Confirmed live:
  // inserting Apple/Banana when Fruit expands wiped the `tabindex`
  // attribute from BOTH Fruit (not newly inserted — it already existed,
  // roving tabindex didn't even move) AND Vegetables (also pre-existing,
  // never focused) — not just a stale value, the attribute vanished
  // outright. A declarative `tabIndex={activeKey.value === key ? 0 : -1}`
  // JSX prop on a row that is a SIBLING of newly inserted/removed nodes
  // gets corrupted by that insertion/removal, the same broad "attribute
  // diffing breaks around a sibling-count change" category as
  // `qwik-material/sidenav`'s backdrop-insertion-position bug (see that
  // SYNC.md). Fixed the same way the rest of this port handles a v2
  // attribute-diffing hazard: an imperative, decoupled fix-up — this task
  // re-walks every currently-rendered `[role="treeitem"]` under the
  // tree's own host (in DOM/render order, which matches `visible`'s order
  // positionally) and sets `.tabIndex` directly, whenever `activeKey` OR
  // the visible set's size changes (an insertion/removal, even one that
  // doesn't move the active key, is exactly when the corruption hits).
  const hostRef = useSignal<HTMLElement>();
  // A plain array (like `visible` itself) read inside `track()` establishes
  // no subscription at all — `track()` only subscribes to an actual
  // SIGNAL/store read. Mirrors `mat-tab-group.tsx`'s own established
  // `stateSignal.value = nextState` convention (a plain signal written
  // directly in the render body, every render) to turn "the visible set
  // changed" into something trackable.
  const visibleKeysSig = useSignal('');
  if (variant === 'flat') visibleKeysSig.value = visible.map(e => e.key).join('\u0000');
  // `useVisibleTask$`, NOT `useTask$`: the latter runs as part of
  // resolving a render, before the resulting DOM patch (the
  // insertion/removal this whole fix-up exists to react to) actually
  // lands — confirmed live, a `useTask$` version here still saw the
  // pre-insertion DOM via `querySelectorAll`. A `useVisibleTask$` runs
  // after the browser has actually painted the update.
  // eslint-disable-next-line qwik/no-use-visible-task
  useVisibleTask$(({track}) => {
    if (variant !== 'flat') return;
    const active = track(() => activeKey.value);
    const keys = track(() => visibleKeysSig.value).split('\u0000');
    const host = hostRef.value;
    if (!host) return;
    const rows = host.querySelectorAll<HTMLElement>('[role="treeitem"]');
    let activeRow: HTMLElement | null = null;
    rows.forEach((row, i) => {
      const isActive = keys[i] === active;
      row.tabIndex = isActive ? 0 : -1;
      if (isActive) activeRow = row;
    });
    // Same root cause as the `tabindex` corruption above: inserting the
    // new siblings doesn't just clobber attributes, it also DETACHES and
    // RE-ATTACHES already-existing rows (confirmed live: the SAME DOM
    // node reference, `===`-identical before and after), which — being a
    // genuine removal from the document, even if brief and even back to
    // the exact same parent — makes the browser drop focus to `<body>`
    // unconditionally; nothing restores it automatically, because nothing
    // actually asked for a focus change. Any keydown-driven expand/
    // collapse this component triggers always implies the keypress came
    // from a currently-focused row in THIS tree, so if focus is sitting
    // on `<body>` right after one of this task's own runs, it's this
    // task's own fix-up to make, not a deliberate focus-away the user did
    // — restore it to whichever row is the current roving-tabindex target.
    // `activeRow` is assigned inside the forEach callback, which TS's
    // narrowing can't see — re-widen before use.
    const target = activeRow as HTMLElement | null;
    if (target && document.activeElement === document.body) {
      target.focus();
    }
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
    // Whether to render the `<div class="mat-tree-node">` row-wrapper + `<div role="group">`
    // children outlet is driven by whether this node ACTUALLY HAS children — mirroring upstream's
    // real mechanism (a `*matTreeNodeDef; when: hasChild` template literally authoring that
    // wrapper markup, matched by testing `node.children.length > 0`, same as `hasChildren` below)
    // — NOT by the separate, purely-ARIA `node.isExpandable` flag (`meta.isExpandable`/
    // `ariaExpanded` above), which upstream's own `_isExpandable()` computes independently from
    // template matching (`this._inputIsExpandable`, the literal `[isExpandable]` binding value —
    // never inferred from children, confirmed in `src/cdk/tree/tree.ts`). Every existing nested
    // scenario happens to set `isExpandable: true` on exactly the same nodes that have children,
    // so this was previously indistinguishable from branching on `node.isExpandable` directly —
    // but a `childrenAccessor`-style tree (e.g. `tree-nested-child-accessor-overview`) that never
    // binds `[isExpandable]` at all still needs its children rendered. See `SYNC.md`.
    const hasChildren = !!node.children?.length;
    if (hasChildren) {
      // `nestedHiddenClass` set: a pure, stateless boolean class toggle (no `style` attribute at
      // all, no history quirk — unlike the style-binding variant below, removing a class leaves
      // no residual trace, so `everCollapsed` doesn't apply here). Not set: the default inline
      // `[style.display]` form, including its `style=""` "ever collapsed" quirk — see
      // `nestedHiddenClass`'s own doc comment and SYNC.md.
      const groupClass = props.nestedHiddenClass && !show ? props.nestedHiddenClass : undefined;
      const groupStyle: string | undefined = props.nestedHiddenClass
        ? undefined
        : show
          ? everCollapsed[key]
            ? ''
            : undefined
          : 'display: none';
      return (
        <mat-nested-tree-node key={key} {...rowAttrs}>
          <div class="mat-tree-node">{node.content}</div>
          <div role="group" class={groupClass} style={groupStyle}>
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
    <mat-tree ref={hostRef} id={props.id} role="tree" class={treeClasses}>
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
