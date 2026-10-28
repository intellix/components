# qwik-material/tree sync log

Tracks the sync state between this port and `src/material/tree/`
upstream. Companion to `src/qwik-cdk/tree/SYNC.md` (the headless
algorithms/types/`CdkTreeNodeToggle` this port consumes — read it first,
it has the node-definition-shape rationale and the full list of
serialization pitfalls hit while porting), `src/qwik-cdk/a11y/key-manager/
tree-key-manager.ts`'s own header comment (the `TreeKeyManager` ->
`resolveTreeKeydown` port).

## 2026-10-28 initial port

New entry point, gated by `specs/material-tree/angular-parity.spec.ts`
(wave 5, `docs/superpowers/specs/2026-10-27-qwik-material-remaining-components-roadmap.md`).
All 7 Angular-mirrored scenarios (`flat-basic`, `flat-initially-expanded`,
`nested-basic`, `nested-initially-expanded`, `not-expandable`,
`keyboard-nav`, `disabled-skipped`) pass, run 3 times.

## Architecture: one real renderer, no separate `CdkTree` component

Unlike `qwik-cdk/table` (headless algorithms only, zero rendering) or
`qwik-cdk/accordion` (hooks consumed by `qwik-material/expansion`'s
components), `qwik-cdk/tree` holds the pure algorithms (`flatten-tree.ts`,
`resolveTreeKeydown`) PLUS one small, genuinely reusable BEHAVIOR
component (`CdkTreeNodeToggle`) — but there is no separate, independently
renderable `CdkTree`/`CdkTreeNode` component mirroring upstream's actual
class hierarchy (`MatTree extends CdkTree`, `MatTreeNode extends
CdkTreeNode`). `MatTree` here does ALL of the structural DOM rendering
(flat and nested) directly, combining upstream's CDK-level classes
(`cdk-tree`, `cdk-tree-node`, `cdk-nested-tree-node`) with Material's own
(`mat-tree`, `mat-tree-node`, `mat-nested-tree-node`) in one place — the
same approach `qwik-material/table`'s `MatTable` takes with
`TABLE_BASE_CLASSES` etc. This was a deliberate scope decision: a real,
independently-tagged `<cdk-tree>` renderer would need a dynamic/
polymorphic root+node TAG NAME (not just extra classes on the same tag,
since `<cdk-tree>` and `<mat-tree>` are upstream's own, genuinely
different, real element names) for zero current consumer need — nothing
in this port's scope renders a bare, unstyled `<cdk-tree>`. If a future
consumer needs one, the cleanest path is parameterizing `MatTree`'s own
root/node tag names (already computed in one place each) rather than
duplicating its ~250 lines of flat/nested rendering + keyboard logic into
a second component.

## Why expansion/focus state is owned internally — and what that means for `content`

See `qwik-cdk/tree/SYNC.md`'s "Why expansion/focus state is owned
internally by the tree, not the consumer" for the full reasoning
(the nested group wrapper's `style`-attribute-history quirk forces this).
The practical consequence for anyone building a node's `content`: the
toggle button's `[-]`/`[+]` label is NOT something you compute once from
"is this node currently expanded" and bake into `content` — by the time
a toggle click happens, `content` (built once, by the consumer, before
ever calling `<MatTree>`) is frozen. Instead, place a `<CdkTreeNodeToggle
node={key} collapsedLabel="[+]" expandedLabel="[-]">` inside `content` —
it reads the LIVE expansion state itself via context and picks the right
label on every one of ITS OWN re-renders, independent of whether `MatTree`
(or its parent route component) re-renders at all. See every dev-app
scenario route (`src/qwik-cdk-dev-app/src/routes/mat-tree/*/index.tsx`)
for the pattern in practice.

## Upstream sync state

| File | Upstream path | Sync state | Notes |
| --- | --- | --- | --- |
| `tree/mat-tree.tsx` | `src/material/tree/tree.ts` (`MatTree extends CdkTree`) + `node.ts` (`MatTreeNode`/`MatNestedTreeNode`/`MatTreeNodeDef` host bindings) + the matching `src/cdk/tree/tree.ts`/`node.ts`/`nested-node.ts` base classes (CDK+Material host-class concatenation, including the easy-to-miss 3-class `cdk-tree-node cdk-nested-tree-node mat-nested-tree-node` on a nested node — `CdkNestedTreeNode extends CdkTreeNode`, confirmed live against the reference app) | ported | One component, both `variant`s. Flat: renders `visible` (ancestor-expansion-filtered) as sibling `<mat-tree-node>`s with `padding-left` computed inline. Nested: recursively renders EVERY node (`props.nodes` directly, not a flattened list) as `<mat-nested-tree-node>`, synthesizing the `<div class="mat-tree-node">`/`<div role="group">` wrapper structure an upstream consumer's OWN `*matTreeNodeDef` template would have authored (a deviation — see below) — including the `style` attribute's presence/history quirk (`everCollapsed` store). Roving tabindex (`activeKey` signal) + the `TreeKeyManager`-derived keyboard handler (`resolveTreeKeydown`, from `qwik-cdk/a11y`) are implemented directly on each rendered node's `onClick$`/`onKeyDown$`. |
| `tree/mat-tree-node-toggle.ts` | `src/material/tree/toggle.ts` (`MatTreeNodeToggle extends CdkTreeNodeToggle`, empty body) | ported (re-export) | Zero behavior/DOM difference upstream between the CDK and Material toggle — a direct re-export of `qwik-cdk/tree`'s `CdkTreeNodeToggle` is equally faithful. |
| `scss/tree/tree.scss` | `src/material/tree/tree.scss` (33 LOC) | synced | Byte-identical copy. No `@angular/cdk` import exists in this file, so no cdk-stub swap needed (same as `sort/sort-header.scss`, `table/table.scss`). |
| `scss/tree/_m3-tree.scss` | `src/material/tree/_m3-tree.scss` | synced | byte-identical copy; `tree.scss`'s `$fallbacks` resolves through this (`m3-tree.get-tokens()`, default args). |
| `scss/tree/tree-prebuilt.scss` | (qwik-material-specific) | new | `@use` tree.scss + `:root` defaults for all 6 `--mat-tree-*` tokens + the `--mat-sys-*` system tokens they fall back to (`surface`/`on-surface`/`body-large-*`) — values reused verbatim from other prebuilt files wherever the same variable name already exists elsewhere in this port; `body-large-*` is new to this port (no earlier component used it), values from `_m3-tree.scss`'s own upstream M3 type-scale defaults. |

## Removed upstream files

- `tree/tree-module.ts` — Qwik has no module concept.
- `tree/testing/*` (`MatTreeHarness`/`MatTreeNodeHarness`) — Angular CDK
  Component Harness framework, no Qwik equivalent in this port (no other
  ported component has a harness here either).
- `tree/tree.spec.ts` / `tree-using-tree-control.spec.ts` /
  `tree-using-legacy-key-manager.spec.ts` (Angular `TestBed`-based) — same
  finding as every other port's Material-level spec file: nothing is
  portable as-is. Covered by `angular-parity.spec.ts` (DOM parity) +
  `qwik-cdk/tree`'s `flatten-tree.spec.ts`/`tree-key-manager.spec.ts`
  (the extracted pure algorithms).
- `tree/data-source/{flat,nested}-data-source.ts` (`MatTreeFlatDataSource`/
  `MatTreeNestedDataSource`) — convenience `DataSource` wrappers around
  `FlatTreeControl`/`NestedTreeControl`, which this port doesn't support
  (see `qwik-cdk/tree/SYNC.md` deviation #3 — `childrenAccessor`/plain-array
  only, matching every scenario and the current recommended upstream API).

## Deviations from upstream

1. **The nested node's inner row `<div class="mat-tree-node">` + children
   `<div role="group">` wrapper are rendered by `MatTree` itself, not
   authored per-node by the consumer.** Upstream, these are literally
   written in the CONSUMER's own `*matTreeNodeDef` template (see the
   scenario file's `nested-basic` markup) — Qwik has no per-node template
   mechanism to attach them to, so `MatTree` synthesizes the exact same
   DOM structurally instead, keyed off `node.isExpandable`. The resulting
   DOM is IDENTICAL to upstream's (verified via `angular-parity.spec.ts`);
   only the AUTHORSHIP differs. See `qwik-cdk/tree/SYNC.md`'s "Why nodes
   are data, not slotted templates" for why this project-wide pattern
   (table's generated rows/cells, this port's generated node wrappers) is
   the established alternative to Angular's content-children model.
2. **No `<cdk-tree>`-equivalent independently-tagged renderer.** See
   "Architecture" above.
3. **`matTreeNodePadding`'s presence is a tree-level `padding` boolean**,
   not per-node — see `qwik-cdk/tree/SYNC.md` deviation #6.
4. **The `flat-initially-expanded` initial-roving-tabindex quirk is
   reproduced as an explicit, flat-only adjustment in `MatTree`, not
   folded into `qwik-cdk/tree`'s general-purpose `initialActiveKey()`.**
   See `MatTree`'s own comment at its `activeKey` signal initializer —
   `initialActiveKey()` stays a faithful, variant-agnostic port of
   `TreeKeyManager._initializeFocus()`'s "first non-skipped item" rule;
   the LIVE-VERIFIED Angular pipeline artifact that shifts a flat tree's
   initial focus onto a pre-expanded first node's first child (but NOT a
   nested tree's — confirmed by contrasting `nested-initially-expanded`,
   which does NOT shift) is layered on top, scoped to `variant ===
   'flat'` only, right where the quirk is documented.
5. **No `MatTreeFlatDataSource`/`MatTreeNestedDataSource` convenience
   wrappers.** See removed-files above.
