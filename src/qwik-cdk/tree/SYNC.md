# qwik-cdk/tree sync log

Tracks the sync state between this port and `src/cdk/tree/` (+ the
`TreeKeyManager` half of `src/cdk/a11y/key-manager/`) upstream. Companion
to `src/qwik-material/tree/SYNC.md` (all the actual rendering),
`src/qwik-cdk/table/SYNC.md` (the "headless algorithms here, rendering in
material" split this package follows), `src/qwik-cdk/accordion/SYNC.md`
(the "cdk owns reactive wiring, material owns rendering" split this
package also partly follows, for `CdkTreeNodeToggle`).

## 2026-10-28 initial port

New entry point, gated by `specs/material-tree/angular-parity.spec.ts`
(wave 5, `docs/superpowers/specs/2026-10-27-qwik-material-remaining-components-roadmap.md`).
All 7 scenarios (`flat-basic`, `flat-initially-expanded`, `nested-basic`,
`nested-initially-expanded`, `not-expandable`, `keyboard-nav`,
`disabled-skipped`) pass, run 3 times.

## Why nodes are data, not slotted templates

Upstream's `<mat-tree>` takes CONTENT CHILDREN: `*matTreeNodeDef`/
`*matTreeNodeDef; when: ...` templates, matched per node via `@ContentChildren`
+ a `when` predicate, instantiated via `ViewContainerRef.createEmbeddedView`
once per visible node (flat) or once per node ever (nested, visibility
toggled by a consumer-authored style binding). Same documented limitation
as `qwik-material/table`/`tabs`/`stepper`/`list`: Qwik cannot read a
`<Slot>`'s projected children's shape during SSR, and a `component$`'s
render function cannot be async (so a per-node `QRL<(node) => JSXOutput>`
template, which would need to be awaited, isn't viable inside `MatTree`'s
own synchronous render either).

This port's node shape (`CdkTreeNodeInput<T>`, `flatten-tree.ts`) is a
**recursive data array**, not a function-based `childrenAccessor` — see
that file's own doc comment for the full rationale (serializability,
mirrors the "pre-realized `JSXOutput`" precedent from `MatColumnDef`).
`isExpandable`/`isDisabled`/`isExpanded` are explicit per-node flags
(never inferred), matching upstream's own `isExpandable` input being
likewise never auto-inferred from `childrenAccessor`/`when` (see the
scenario file's header comment) — carrying that explicitness straight
into the port's API keeps a migration mechanical: `*matTreeNodeDef="let
node; when: hasChild" matTreeNodePadding matTreeNodeToggle
[isExpandable]="true"` becomes one node-building call setting
`isExpandable: true, nodeToggle: true, content: <...>`.

**The one piece of content that genuinely needs to react to the tree's
own internal state** — a toggle button's `[-]`/`[+]` label, which upstream
binds directly to `tree.isExpanded(node)` — is NOT something the consumer
bakes into `content` as a static value (it can't: `content` is built once,
and the tree's internal expansion state is opaque to the consumer by
design — see below). Instead the consumer places a `<CdkTreeNodeToggle
node={key}>` (`cdk-tree-node-toggle.tsx`) inside `content`; that component
is its own `component$`, independently re-rendering when the shared
`CDK_TREE_TOGGLE_STATE` context it reads changes — exactly how
`qwik-material/table`'s `MatSortHeader` reads `MAT_SORT_STATE` from
inside a `MatColumnDef.header` value, generalized to tree nodes.

## Why expansion/focus state is owned internally by the tree, not the consumer

An earlier design considered under this port had the CONSUMER own
expansion state (mirroring `MatTableSortConfig`'s consumer-owned
sort state) and rebuild `content` fresh on every toggle. Rejected: it
would require the consumer to also replicate a genuinely upstream-internal
DOM quirk — `role="group"`'s inline `style` attribute EXISTS (as `style=""`)
once a nested node has ever been collapsed, but is ABSENT entirely if it
started expanded and has never been collapsed since (see
`angular-parity.spec.ts`'s `nested-basic` vs `nested-initially-expanded`
notes) — a piece of render HISTORY, not a pure function of current props.
Since `MatTree` already has to own this history internally regardless
(nobody else is in a position to track it), it was simpler and more
faithful to upstream's ACTUAL architecture (`CdkTree._expansionModel` is
genuinely internal; a consumer only ever seeds it via `isExpanded` and
observes it via `(expandedChange)`) to let `MatTree` own ALL of expansion
+ roving-focus state via plain `useStore`/`useSignal`, shared downward
through `CDK_TREE_TOGGLE_STATE` context — a `Signal`/store reference is a
first-class serializable Qwik value (unlike a plain callback closure),
so this requires no `noSerialize()` workaround.

## Upstream sync state

| File | Upstream path | Sync state | Notes |
| --- | --- | --- | --- |
| `tree/flatten-tree.ts` | `src/cdk/tree/tree.ts` (`CdkTree._flattenNestedNodesWithExpansion`, `_levels`/`_parents`/`_ariaSets` bookkeeping) | ported (restructured) | `flattenTree()` returns BOTH `all` (every node, used for nested rendering + aria bookkeeping — matches upstream recursing into every node's children regardless of the node's own expansion) and `visible` (ancestor-chain-expansion-filtered — matches the array upstream's `_flattenNestedNodesWithExpansion` actually RETURNS, used for flat rendering AND as the `TreeKeyManagerItem` list for keyboard nav in EITHER mode). `posinset`/`setsize` are computed from ALL siblings regardless of expansion, matching `_ariaSets` being populated unconditionally. `collectInitialExpanded`/`initialActiveKey` are new (SSR-only concerns with no 1:1 upstream method — see their own doc comments). |
| `a11y/key-manager/tree-key-manager.ts` | `src/cdk/a11y/key-manager/tree-key-manager.ts` (`TreeKeyManager.onKeydown` + `_focusNextItem`/`_focusPreviousItem`/`_focusFirstItem`/`_focusLastItem`/`_expandCurrentItem`/`_collapseCurrentItem`/`_expandAllItemsAtCurrentItemLevel`) | ported (as a pure function) | `resolveTreeKeydown()` — see that file's own header comment for the full "class -> pure function" rationale. Typeahead NOT ported (no scenario exercises it). |
| `tree/cdk-tree-node-toggle.tsx` | `src/cdk/tree/toggle.ts` (`CdkTreeNodeToggle`) | ported | Renders the toggle element itself (polymorphic `as`, default `'button'`) — see its own doc comment. `matTreeNodeToggleRecursive` accepted but NOT implemented (documented no-op — see the prop's own doc comment). |
| `tree/tree-context.ts` | (new) | new | `CDK_TREE_TOGGLE_STATE` — the context contract between `MatTree` (provider) and `CdkTreeNodeToggle` (consumer). See "Why expansion/focus state is owned internally" above. |
| `tree/dom-utils.ts` | (new) | new | `focusTreeNodeAtIndex(treeRoot, index)` — moves real DOM focus to the `index`-th rendered `role="treeitem"`, used by `MatTree`'s keyboard handler (ArrowUp/Down/Left/Right/Home/End need to move REAL focus, not just a `tabindex` attribute, since a scenario's later steps dispatch key presses wherever the browser currently considers focused). Deliberately index-based, not an attribute-value lookup — see "Pitfalls" below for why a `[data-*]` identifying attribute was rejected. |

## Removed upstream files

- `tree/node.ts` (`CdkTreeNodeDef`/`CdkTreeNodeOutletContext`) — Angular's
  `@ContentChildren`-based template-matching machinery; superseded entirely
  by `CdkTreeNodeInput`'s plain recursive data shape (no `when` predicate
  matching needed — the consumer decides a node's shape once, synchronously,
  when building the array).
- `tree/nested-node.ts` (`CdkNestedTreeNode`) — its `ViewContainerRef`-based
  "insert children into whatever `[cdkTreeNodeOutlet]` descendant exists"
  machinery has no Qwik equivalent and isn't needed: `qwik-material/tree`'s
  `MatTree` renders nested children directly via ordinary recursive JSX
  (see its SYNC.md).
- `tree/outlet.ts` (`CdkTreeNodeOutlet`) — the `<ng-container
  cdkTreeNodeOutlet>` anchor has no DOM presence upstream either (the
  scenario file's own shared-skeleton comment: "harness ignores comments")
  and Qwik's plain-children rendering needs no anchor at all.
- `tree/padding.ts` (`CdkTreeNodePadding`) — not a separate component;
  `MatTree` computes `padding-left: ${level * indent}px` directly as part
  of its own flat-node rendering (same information, no separate directive
  needed since there's no consumer template to attach a directive to).
- `tree/control/*` (`FlatTreeControl`/`NestedTreeControl`/`TreeControl`
  base) — the deprecated `treeControl` API `@breaking-change 21.0.0`s
  away upstream. Every `angular-parity.spec.ts` scenario uses the current,
  recommended `childrenAccessor` API exclusively (per the scenario file's
  own header comment) — this port follows suit and has no `treeControl`
  equivalent at all.
- `tree/tree-errors.ts` — dev-mode `Error()` factories for invalid
  `treeControl`/`levelAccessor`/`childrenAccessor` combinations and
  missing node defs. Not applicable: this port has exactly one node shape
  (no `when`-predicate matching that could fail to find a match) and no
  `treeControl`/`levelAccessor` alternative to misconfigure.
- `tree/tree-module.ts` — Qwik has no module concept.
- `tree/tree.spec.ts` / `tree-with-tree-control.spec.ts` /
  `tree-using-legacy-key-manager.spec.ts` (Angular `TestBed`-based) — same
  finding as `qwik-cdk/table/SYNC.md` reports: every test instantiates a
  real Angular fixture; nothing is portable as-is. Covered instead by
  `angular-parity.spec.ts` (DOM parity) + fresh, from-scratch
  `flatten-tree.spec.ts`/`tree-key-manager.spec.ts` (the genuinely pure,
  portable algorithms extracted while porting) + the same behavioral
  assertions upstream's `tree-key-manager.spec.ts` makes about navigation
  order/skip-disabled/expand-collapse.
- `a11y/key-manager/noop-tree-key-manager.ts` (`NoopTreeKeyManager`) — an
  opt-out token for consumers who want to manage focus/tabindex entirely
  themselves (checked via `isNoopTreeKeyManager()` in `MatTreeNode`'s
  `_getTabindexAttribute()`, upstream's `MatTreeNode.tabIndexInputBinding`
  deprecated escape hatch). No scenario or consumer needs this; `MatTree`
  always manages its own roving tabindex.

## Pitfalls hit while porting (read before touching event handlers here)

1. **A `$(...)` handler that reads a field off `props` captures the WHOLE
   `props` object — not just that field.** `MatTree`/`CdkTreeNodeToggle`
   both take props containing live `JSXOutput` (`content`/
   `collapsedLabel`/`expandedLabel`/`children`) alongside plain QRLs/
   strings. Writing `props.onToggle$(...)` directly inside a `$(...)`
   handler crashes SSR with Qwik's "Code(3)"
   (`QError_verifySerializable`) the moment that component is used on a
   real page — NOT caught by `tsc`, NOT caught by `vitest` (happy-dom
   doesn't exercise Qwik's actual serialization pipeline), only by
   actually rendering the page (confirmed live, repeatedly, while porting
   this component — see `cdk-tree-node-toggle.tsx`'s and `MatTree`'s own
   comments at the top of their handlers). The fix: pull every value a
   handler needs into a local `const` BEFORE defining the handler
   (`const onToggle = props.onToggle$;`, `const nodeKey = props.node;`),
   and reference the locals, never `props.x`, inside the `$(...)` body.
   Same hazard for a handler that closes over an outer array/Map built
   from `FlatTreeEntry[]` (which also carries `content`) — trim it to
   plain fields first (see `MatTree`'s `navEntries`/`disabledByKey`/
   `dataByKey`, all built from `all`/`visible` but stripped of `content`).
2. **A `$(...)` handler cannot close over a plain function reference
   either** (only over primitives, QRLs, and Qwik's own Signal/Store
   proxies) — passing `isExpanded` (a plain arrow closing over the
   `expanded` store) as an ARGUMENT from inside a handler to
   `resolveTreeKeydown` would itself need to serialize that function. Fix:
   define the equivalent arrow FRESH, INSIDE the handler body, so it's
   compiled into the handler's own extracted chunk rather than captured
   from the enclosing scope (see `MatTree.handleRowKeyDown`'s
   `isExpandedNow`).
3. **No identifying attribute beyond upstream's own real contract.** An
   earlier version of this port added `data-cdk-tree-node-key` on every
   rendered node, read back via `event.target.dataset` inside the shared
   click/keydown handlers, to know WHICH node fired the event. This is
   itself a DOM-parity violation (Angular's reference DOM has no such
   attribute) and was caught immediately by `angular-parity.spec.ts`. The
   fix: give each node's OWN small `onClick$`/`onKeyDown$` wrapper (built
   per node, inside the `.map()`/recursive-render loop) the node's `key`
   directly as a captured STRING — e.g. `onClick$={$((event) =>
   handleRowClick(event, key))}`, where `key` is a local `const` (never
   `entry.key` referenced directly, to avoid capturing `entry` itself —
   see pitfall 1). Capturing a plain string this way is fine (unlike
   capturing an object with JSX fields); only the SHARED handler body
   (`handleRowClick`) needs trimmed data, not the per-node identity.
4. **The JSX `key` prop must be a literal attribute on the element, never
   spread via an object.** An earlier version built a shared `rowAttrs`
   object (`{key: node.key, role: ..., ...}`) and spread it onto the
   element (`<mat-nested-tree-node {...rowAttrs}>`). This renders `key`
   as a LITERAL `key="..."` HTML attribute (Qwik's JSX factory only
   recognizes `key` specially when it's a direct JSX attribute, not when
   it arrives via a spread) — another DOM-parity violation, caught the
   same way. Fix: pass `key={...}` directly on the JSX element, with the
   REST of a shared attributes object spread separately (see `MatTree`'s
   `renderNestedNode`).

## Deviations from upstream

1. **No `TreeKeyManager` typeahead.** See `tree-key-manager.ts`'s own
   header comment — zero scenario coverage, and adding it would require
   `resolveTreeKeydown` to become a stateful object again (a debounce
   buffer), undoing the main simplification this port makes.
2. **`matTreeNodeToggleRecursive` is accepted but not implemented.** See
   `CdkTreeNodeToggleProps.recursive`'s own doc comment — implementing it
   correctly needs a descendant-key lookup passed from the tree to
   `CdkTreeNodeToggle`, which (being a plain function) can't safely cross
   the context boundary the way `expanded`/`activeKey` (reactive
   primitives) do. No scenario exercises it.
3. **No `levelAccessor`/`treeControl` support, no `DataSource`/
   `Observable` data source.** Every scenario (and the recommended
   upstream API as of this checkout) uses `childrenAccessor` with a plain
   array; this port's `CdkTreeNodeInput` recursive-array shape IS the
   migrated form of that, nothing else was in scope.
4. **No real DOM focus-stealing guarantee from keyboard-driven
   expand/collapse (ArrowRight/ArrowLeft).** Matches upstream exactly —
   `CdkTreeNode.expand()`/`collapse()` never call `focusItem()` — only
   genuinely-moving actions (focus/toggle) call `.focus()`. Not a
   deviation, called out because it's easy to assume otherwise.
5. **`CdkTreeNodeToggle` does not move real DOM focus**, only the roving-
   tabindex SIGNAL (`activeKey.value`) — see its own doc comment for why
   (no scenario's steps need it, and doing it right needs the tree's
   current node ordering, which `MatTree`'s own keyboard handler has
   directly in scope but this standalone component does not without
   widening the context contract for zero tested benefit).
6. **`matTreeNodePadding` is a tree-level `padding` boolean, not a
   per-node directive presence.** Upstream's `matTreeNodePadding` is
   applied (or not) per `*matTreeNodeDef` template; every reference
   scenario is consistent across ALL its own node defs (either every flat
   node carries it, as in `flat-basic`, or none do, as in
   `disabled-skipped`), so `MatTree`'s single `padding` prop (default
   `true`, flat variant only) covers every scenario without needing
   per-node granularity. A future consumer needing MIXED padding within
   one tree would need this extended to a per-node flag.
