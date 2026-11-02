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
| `scss/tree/tree-prebuilt.scss` | (qwik-material-specific) | new | `@use` tree.scss only — no `:root` token defaults (removed 2026-10-30, see core/SYNC.md "Default theme"): all 6 `--mat-tree-*` tokens already resolve through a `token-utils.slot(..., var(--mat-sys-*))` fallback chain baked in at Sass-compile time. The one default theme now ships from `core/default-theme.scss` via `core-prebuilt.css`. |

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

## Qwik v2 regressions (2026-11-01)

Upgrading to `@qwik.dev/core@2.0.0-rc.4` broke 3/10 `material-tree` parity scenarios
(`flat-basic`, `flat-initially-expanded`, `keyboard-nav`), for two unrelated reasons, both local
to this port (no shared-`qwik-cdk`-only fix was needed):

1. **A leaf node's STATIC `disabled` attribute (`<button type="button" disabled>`, in the dev-app
   scenario fixtures) serialized as the literal string `disabled="true"` instead of the correct
   bare `disabled=""` form, whenever the element was created fresh on the CLIENT** (i.e. the first
   time its parent node expands — nothing under a collapsed flat-tree node exists in the SSR
   output at all; an element already present at SSR time, as in `flat-initially-expanded`'s
   initially-open case, is unaffected). Confirmed this is a Qwik core bug, not fixable in this
   port: a DYNAMIC (not constant-foldable) value for the same attribute does not hit it. Worked
   around in the affected dev-app scenario fixtures (`flat-basic`, `flat-initially-expanded`,
   `keyboard-nav`, `qwik-only`) by using `disabled={!node.children?.length}` instead of the bare
   literal — real consumers hitting the same bug need the identical kind of workaround (any
   runtime-computed, non-constant expression for a boolean attribute).
2. **Expanding/collapsing a FLAT-variant node (inserting/removing sibling `<mat-tree-node>`
   elements — only this variant's DOM shape does that; nested trees always keep every node
   present, toggling `display:none` instead) corrupted ALREADY-EXISTING sibling rows two ways**:
   their `tabindex` attribute went missing outright (same "attribute diffing breaks around a
   sibling-count change" category as `qwik-material/sidenav`'s backdrop-insertion-position bug —
   see that SYNC.md), AND — confirmed live, same DOM node reference (`===`) before and after —
   real DOM focus was unconditionally dropped to `<body>`, implying the existing row was actually
   detached and reattached during the insertion even though its JS identity didn't change (a
   browser ALWAYS clears focus when the focused element leaves the document, however briefly;
   nothing then asks to focus it again). Fixed with an imperative `useVisibleTask$` (NOT
   `useTask$` — that runs before the resulting DOM patch lands, confirmed live to still see the
   pre-insertion DOM) in `MatTree`, flat variant only: tracks `activeKey`/a plain-array-turned-
   signal standing in for "the visible set changed" (`track()` doesn't subscribe to a plain array
   read — mirrors `mat-tab-group.tsx`'s own `stateSignal.value = nextState` convention to make a
   per-render value trackable), re-walks every current `[role="treeitem"]` row to set `.tabIndex`
   directly, and restores focus to the active row whenever it finds focus sitting on `<body>`
   right after one of its own runs (safe to assume this component's own fault, not a deliberate
   focus-away, since this task only runs in reaction to the tree's own click/keydown handlers).

## Docs Phase 2 (2026-11-02): `tree-nested-child-accessor-overview` port + two `MatTree` fixes

Ported material.angular.dev's [nested-tree `childrenAccessor`
example](https://material.angular.dev/components/tree/overview#tree-nested-child-accessor-overview)
(`qwik-material-examples/tree/tree-nested-child-accessor-overview`) — the nested-variant sibling
of the already-ported `tree-flat-child-accessor-overview`, same `FOOD_DATA`/icon-toggle-button
composition. Getting this to exact DOM parity needed two small, additive `MatTree` changes, found
by comparing live against the real Angular dev-app (`specs/examples-data-nav`):

1. **The nested-variant group-wrapper/children structure now renders based on whether a node
   ACTUALLY HAS children, not on its separate `isExpandable` flag.** Previously `renderNestedNode`
   branched on `node.isExpandable` for BOTH the `aria-expanded` attribute AND whether to render the
   `<div class="mat-tree-node">`/`<div role="group">` wrapper at all — indistinguishable from
   branching on children-presence in every PRE-EXISTING nested scenario (`nested-basic`,
   `nested-initially-expanded`), which always set `isExpandable: true` on exactly the nodes that
   have children. But `tree-nested-child-accessor-overview-example.html` never binds
   `[isExpandable]` at all (confirmed live, same finding as the already-ported flat sibling
   example) while still needing its children to render — upstream's own `_isExpandable()`
   (`src/cdk/tree/tree.ts`) returns the literal, never-inferred `[isExpandable]` input value
   regardless of variant, while the group-wrapper DOM is purely a consequence of which
   `*matTreeNodeDef` TEMPLATE matched (`when: hasChild`, testing `children.length > 0`) —
   genuinely decoupled upstream. Fixed by branching the wrapper/children structure on
   `!!node.children?.length` directly (same value `flatten-tree.ts`'s `FlatTreeEntry.hasChildren`
   already computes), leaving the separate `aria-expanded` computation (still keyed off
   `node.isExpandable`) untouched. Zero behavior change for every existing covered scenario
   (`isExpandable` and "has children" coincided in all of them); regression-verified via
   `specs/material-tree` (30/30, run 3×).
2. **New `nestedHiddenClass` prop on `MatTreeProps` — an escape hatch for the nested group
   wrapper's hide mechanism.** Upstream's nested group-wrapper
   visibility is entirely consumer-authored (part of the per-node template), and real examples use
   either of two valid patterns: an inline `[style.display]` binding (what `src/dev-app/qwik-parity/
   tree.ts`'s OWN hand-authored mirror scenarios use, and what `MatTree` hardcoded as its one
   synthesized default — see the "Deviations" list above), or a stylesheet class toggle
   (`[class.example-tree-invisible]="!tree.isExpanded(node)"`, what the REAL
   `tree-nested-child-accessor-overview-example.html` uses, with `.example-tree-invisible {
   display: none; }` in its own `.css`). Since `MatTree` must pick one default and can't infer
   which a given consumer "would have" authored, `nestedHiddenClass?: string` opts a tree INTO the
   class-toggle form: the wrapper gets this class while collapsed and no `style` attribute at all
   (no `everCollapsed` quirk either — a class binding has no residual-trace history the way the
   style binding's `style=""` does). Omitting it keeps the existing default. Also needed: the
   example passes `class="example-tree"` on `<MatTree>` itself (the real `<mat-tree>` here carries
   a literal, unbound `class="example-tree"` from its own template — already supported by the
   existing `class` prop, no library change needed for that half).

Verification: `specs/examples-data-nav` (`tree-nested-child-accessor-overview`, 2/2, run 3×),
`specs/material-tree` (30/30, run 3× — regression for both `MatTree` changes), `specs/examples`
(`mat-tree/example`, `mat-paginator/example`, run 3× — unaffected).
