import {Component, Type} from '@angular/core';
import {MatTreeModule} from '@angular/material/tree';

// Each scenario mirrors a route under src/qwik-cdk-dev-app/src/routes/mat-tree/. See
// button-toggle.ts for the general approach. Inputs use [prop] bindings: a static attribute
// input is also echoed onto the host element by Angular, which a Qwik component cannot
// distinguish from a prop.
//
// Every scenario uses the CURRENT, recommended `childrenAccessor` API on `<mat-tree>` (not the
// deprecated `treeControl`/`FlatTreeControl`/`NestedTreeControl`). Toggle controls are plain
// `<button type="button">` elements with TEXT content (`[+]`/`[-]`), not `matIconButton` +
// `mat-icon` — this keeps these scenarios decoupled from the button/icon components' own
// ripple-loader/font-icon DOM (a separate, already-ported concern); only `MatTreeModule` is
// imported here.
//
// Shared skeleton (see src/material/tree/{tree,node,padding,toggle,outlet}.ts and
// src/cdk/tree/{tree,node,nested-node,padding,toggle}.ts — `MatTree{,Node}` extend
// `CdkTree{,Node}` with no `host` overrides for the attributes below, so they apply equally):
//
//   <mat-tree role="tree" class="mat-tree cdk-tree">
//     <mat-tree-node role="treeitem" class="mat-tree-node cdk-tree-node"
//         [tabindex]="0 on exactly one node (roving tabindex), -1 on the rest"
//         [aria-level]="1-based depth" [aria-posinset]="1-based index among siblings"
//         [aria-setsize]="sibling count" [aria-expanded]="omitted UNLESS isExpandable">
//       <button mattreenodetoggle tabindex="-1">…</button>  (on expandable nodes only — the
//           toggle's host sets a STATIC `tabindex="-1"`, verified present on a plain `<button>`;
//           it never competes with a `matButton`-style dynamic tabindex binding here since these
//           scenarios use plain buttons)
//       …
//     </mat-tree-node>
//     <!--ng-container-->  (anchor for matTreeNodeOutlet; harness ignores comments)
//   </mat-tree>
//
// Key, non-obvious, LIVE-VERIFIED behaviors (http://localhost:4200/tree, the
// `TreeFlatChildAccessorOverviewExample`/`TreeNestedChildAccessorOverviewExample` demos — the
// upstream demos never bind `[isExpandable]`, so their nodes never get `aria-expanded` at all;
// these scenarios DO bind it explicitly, since the Qwik port must still support it correctly):
//
// - `isExpandable` is a plain `@Input()` with NO automatic inference from `childrenAccessor` or
//   from which `*matTreeNodeDef … when` matched — a consumer who forgets to bind
//   `[isExpandable]="true"` on their "has children" node template gets a tree that still expands
//   (the toggle button calls `tree.toggle()` directly, independent of `isExpandable`) but whose
//   nodes never carry `aria-expanded`. All scenarios below that render an expandable node bind
//   `[isExpandable]="true"` explicitly on it so `aria-expanded="false"`/`"true"` is present.
// - Roving tabindex (`TreeKeyManager`): exactly one rendered node has `tabindex="0"` at a time,
//   every other node has `tabindex="-1"`. The initial active node is the first non-disabled node
//   in document order, set via `makeFocusable()` at tree init — this flips its tabindex to `0`
//   WITHOUT moving real browser focus (no scrolling/focus ring on load). Arrow key navigation
//   (see 'keyboard-nav' below) moves this tabindex AND real focus together, via `.focus()`.
// - Clicking a `matTreeNodeToggle` element — on EITHER the inner `<button>` or the `<mat-tree-node
//   >`/`<mat-nested-tree-node>` host itself when the directive is applied there too (the upstream
//   demos put `matTreeNodeToggle` on BOTH; selector attribute `mattreenodetoggle` shows up on
//   both elements) — ALSO calls `tree._keyManager.focusItem(node)` as part of the same handler
//   (`CdkTreeNodeToggle._toggle`, src/cdk/tree/toggle.ts). So a toggle click moves the roving
//   `tabindex="0"` to the clicked node (in addition to expanding/collapsing it) UNLESS that node
//   was already the active one. This happens even when the node is `isDisabled` — `_toggle()`
//   never checks `isDisabled` — so a disabled node's own toggle button still expands it AND still
//   steals the roving tabindex. See 'not-expandable'.
// - `isDisabled` adds NO visible attribute or class anywhere (no `aria-disabled`, no
//   `-disabled` class) on `mat-tree-node`/`mat-nested-tree-node`. Its only two effects: (1) the
//   node's OWN `(click)` handler (`_focusItem`, inherited from `CdkTreeNode`) becomes a no-op —
//   clicking the node body (not a toggle button) neither focuses nor activates it; (2)
//   `TreeKeyManager`'s skip-predicate excludes it from Home/End/ArrowUp/ArrowDown navigation and
//   from the initial-focus search, so arrow-key traversal jumps straight over it. See
//   'disabled-skipped'.
// - Flat tree (`mat-tree-node`, `childrenAccessor`): a collapsed node's descendants are NOT in
//   the DOM at all — `CdkTree` only flattens/renders the expanded-visible subset
//   (`_flattenNestedNodesWithExpansion`). Expanding inserts new `<mat-tree-node>` siblings;
//   collapsing removes them. `matTreeNodePadding` sets an inline `style="padding-left: Npx"`
//   (`N = level * 40`, including an explicit `padding-left: 0px` at the root level — never
//   omitted) on every node, flat or newly-inserted.
// - Nested tree (`mat-nested-tree-node`, `childrenAccessor`, `matTreeNodeOutlet`): the OPPOSITE —
//   `CdkNestedTreeNode._getDirectChildren` (for a `childrenAccessor` tree) returns the node's
//   children UNCONDITIONALLY, never gated on expansion state. So a nested node's descendants are
//   ALWAYS present in the DOM, even while collapsed — visibility is entirely a consumer-authored
//   CSS concern. These scenarios make that explicit with an inline
//   `[style.display]="tree.isExpanded(node) ? null : 'none'"` on the `role="group"` wrapper
//   `<div>` that holds `matTreeNodeOutlet`, instead of a stylesheet class (so the harness's
//   inline-style comparison directly covers it). `role="group"` itself is NOT automatic — it is
//   written by the consumer's own `*matTreeNodeDef` template, same as the wrapper `<div>`.
// - Keyboard behavior (`TreeKeyManager`, src/cdk/a11y/key-manager/tree-key-manager.ts), scoped to
//   the CURRENTLY RENDERED/visible node list: `ArrowDown`/`ArrowUp` move the roving tabindex to
//   the next/previous visible node (skipping disabled ones). `ArrowRight` on a collapsed
//   expandable node expands it (focus stays put); on an already-expanded node it moves focus to
//   its first child; on a leaf it's a no-op. `ArrowLeft` on an expanded node collapses it (focus
//   stays put); on a collapsed/leaf node it moves focus to the parent (root nodes: no-op).
//   `Home`/`End` jump to the first/last visible node (no wrap). `*` expands every SIBLING of the
//   active node at its own level (not deeper) — for a root node with no parent, that means every
//   root node. `Tab` is intentionally NOT intercepted (`onKeydown`'s `case 'Tab': return;`), so it
//   tabs OUT of the tree entirely rather than moving between nodes.
// - `Enter`/`Space` normally call `TreeKeyManager`'s `activate()`, which only emits the
//   `(activation)` output — neither key expands/collapses a node by itself; a consumer decides
//   what activation does. BUT (LIVE-VERIFIED, easy to miss): `CdkTreeNodeToggle`'s host ALSO binds
//   `(keydown.Enter)`/`(keydown.Space)` to its OWN `_toggle()` (which calls
//   `event.stopPropagation()`) — so on a node where `matTreeNodeToggle` is applied directly to the
//   `<mat-tree-node>`/`<mat-nested-tree-node>` itself (every expandable node in these scenarios,
//   matching the upstream convention), pressing Enter/Space while THAT node is focused toggles it
//   and the keydown never bubbles up to `<mat-tree>`'s own `(keydown)` handler — `activate()` is
//   NEVER called, `(activation)` never fires. Only on a node WITHOUT `matTreeNodeToggle` on itself
//   (a leaf, in these scenarios) does Enter/Space bubble to the tree and genuinely call
//   `activate()`. See 'keyboard-nav', steps 6/8 (leaf activation) vs. step 10 (expandable-node
//   Enter toggles instead of activating).
//
// Scenarios (Type → TREE_SCENARIOS key):
//
// - **flat-basic**: flat tree (`childrenAccessor`), two root nodes — "Fruit" → ["Apple",
//   "Banana"] and "Vegetables" → ["Leafy greens" → ["Spinach", "Kale"], "Carrot"] (one
//   grandchild level, under Vegetables → Leafy greens). Every node has `matTreeNodePadding`.
//   Leaf nodes render a plain, empty, disabled `<button type="button" disabled></button>`
//   spacer (no text) before their name, for alignment with expandable rows — mirroring upstream's
//   `<button matIconButton disabled></button>` convention, just without the icon. Expandable
//   nodes (`Fruit`, `Vegetables`, `Leafy greens`) get `matTreeNodeToggle` on BOTH the
//   `<mat-tree-node>` and the inner `<button>`, `[isExpandable]="true"`, and the button's text
//   flips between `[+]` (collapsed) and `[-]` (expanded). All nodes start collapsed — only the
//   two roots are in the DOM initially. Steps: click Fruit's toggle → expands (Apple/Banana
//   inserted at `aria-level="2"`, `padding-left: 40px`; Fruit's button → `[-]`, `aria-expanded`
//   → `true`); click it again → collapses (children removed, button → `[+]`).
// - **flat-initially-expanded**: identical markup/data to 'flat-basic', plus
//   `[isExpanded]="!!node.expanded"` bound on the expandable node template; the data sets
//   `Fruit.expanded = true` (Vegetables/Leafy greens default to `undefined` → collapsed). Initial
//   render already has Apple/Banana in the DOM under Fruit; Vegetables stays collapsed.
//   LIVE-VERIFIED, non-obvious: the default roving-tabindex target is `tabindex="0"` on **Apple**
//   (Fruit's first child), NOT on Fruit — because pre-expanding via an `@Input` setter mid-render
//   causes the tree's node-registry/key-manager pipeline to settle on the fully-flattened list
//   slightly differently than a tree with nothing pre-expanded (contrast 'nested-initially-
//   expanded' below, where the default instead lands on Fruit itself). Fruit itself starts
//   `tabindex="-1"`. Steps: click Vegetables' toggle → expands it (Leafy greens + Carrot
//   inserted; Leafy greens itself stays collapsed — only its own `expanded` flag would control
//   that, and it's unset) — also steals the roving tabindex onto Vegetables (Apple → `-1`,
//   Vegetables → `0`); click Fruit's toggle → collapses it (children removed) and steals the
//   roving tabindex onto Fruit (proves a programmatically-pre-expanded node collapses, and
//   refocuses, the same way a click-expanded one does).
// - **nested-basic**: nested tree (`childrenAccessor`, `matTreeNodeOutlet`), SAME data/shape as
//   'flat-basic'. Leaf template: bare `<mat-nested-tree-node>{{node.name}}</mat-nested-tree-node>`
//   (no toggle, no padding directive — nested trees get their visual indent from the `role=group`
//   wrapper, not `matTreeNodePadding`). Expandable template: `matTreeNodeToggle` on the node,
//   `[isExpandable]="true"`, a `<div class="mat-tree-node">` row (toggle button + name) followed
//   by `<div role="group" [style.display]="…">` wrapping `<ng-container matTreeNodeOutlet>`. All
//   collapsed initially — but (per the behavior notes above) Apple/Banana/etc. ARE already in
//   the DOM, just under a `style="display: none"` group (the attribute is created with that exact
//   value on first render, since the binding evaluates to `'none'` immediately). Default roving
//   tabindex lands on Fruit itself (`tabindex="0"`), unlike 'flat-initially-expanded' above — no
//   pre-expansion going on here to perturb it. Steps: click Fruit's toggle → LIVE-VERIFIED: the
//   group's inline style becomes `style=""` (an EMPTY string, present but with no declarations —
//   NOT a removed attribute; Angular's style binding evaluating to `null` clears the `display`
//   property but leaves the already-created `style` attribute behind) and children become
//   visible, button → `[-]`; click again → `style="display: none"` returns.
// - **nested-initially-expanded**: identical to 'nested-basic' plus `[isExpanded]="!!node.
//   expanded"` and `Fruit.expanded = true`. Initial render: Fruit's group `<div>` has NO `style`
//   ATTRIBUTE AT ALL (not even an empty one) — contrast 'nested-basic' above, where toggling FROM
//   collapsed leaves an empty `style=""` behind: here the binding evaluates to `null` on the very
//   first render, before the attribute ever existed, so it's never created. Vegetables' group has
//   `style="display: none"`. The default roving tabindex is on Fruit itself (`tabindex="0"`).
//   Steps: click Vegetables' toggle → its group becomes `style=""` (visible) and it steals the
//   roving tabindex (Fruit → `-1`, Vegetables → `0`); click Fruit's toggle → its group goes back
//   to `style="display: none"` and it steals the roving tabindex back (Vegetables → `-1`, Fruit →
//   `0`).
// - **not-expandable**: flat tree, three root siblings, no grandchildren: "Leaf" (default node
//   def — no `isExpandable` binding at all, so no `aria-expanded`, no toggle, just text — this is
//   the literal "a node with isExpandable false" case, since the input's default is `false`),
//   "Branch" (expandable, `[isExpandable]="true"`, one child "Branch child"), "Disabled branch"
//   (expandable, `[isExpandable]="true"` AND `[isDisabled]="true"`, one child "Hidden child" —
//   note its toggle `<button>` deliberately has NO native `disabled` attribute, only the tree
//   node's `isDisabled` input is set, so the click still reaches `matTreeNodeToggle`). "Leaf" is
//   the default roving-focus target (`tabindex="0"`) on load, since "Disabled branch" is skipped.
//   Steps: click Branch's toggle → expands it (child inserted) AND steals the roving tabindex
//   from Leaf (Leaf → `-1`, Branch → `0`); click Disabled branch's toggle → ALSO expands (child
//   inserted) AND ALSO steals the roving tabindex (Branch → `-1`, Disabled branch → `0`) — this
//   is the documented quirk: `isDisabled` does not guard the toggle handler.
// - **keyboard-nav**: flat tree, same two-root/grandchild data as 'flat-basic', all collapsed
//   initially, plus `(activation)="lastActivated = $event.name"` bound on BOTH node templates and
//   a `<p>Last activated: …</p>` below the tree reflecting it. Every step below was run live and
//   the resulting tabindex/aria-expanded/activation state captured exactly as described — this is
//   the full, in-order step list the spec uses (each a single key on the currently-focused node,
//   after a sentinel-created Tab into the tree first):
//     1. Tab → focuses Fruit (the default root, already `tabindex="0"`; no DOM diff by itself).
//     2. ArrowDown → Vegetables (tabindex 0/-1 swap).
//     3. ArrowUp → back to Fruit.
//     4. ArrowRight → Fruit expands (Apple/Banana inserted, `aria-expanded` → `true`); focus
//        stays on Fruit.
//     5. ArrowRight again → Fruit already expanded, so focus moves to its first child, Apple
//        (tabindex swap; Fruit has no toggle-click involved here, so no refocus-on-toggle quirk).
//     6. Enter → Apple is a LEAF (no `matTreeNodeToggle` on it) → the keydown bubbles to
//        `<mat-tree>` and genuinely calls `activate()` → "Last activated: Apple".
//     7. ArrowDown → Banana.
//     8. Space → Banana is also a leaf → activates → "Last activated: Banana".
//     9. ArrowLeft → Banana is a leaf, not expanded → focus moves to its parent, Fruit.
//     10. Enter on Fruit → **LIVE-VERIFIED CRITICAL QUIRK**: Fruit IS expandable and has
//         `matTreeNodeToggle` on the node itself, so `CdkTreeNodeToggle`'s own
//         `(keydown.Enter)` fires first and `stopPropagation()`s — this COLLAPSES Fruit
//         (Apple/Banana removed, `aria-expanded` → `false`) INSTEAD of activating it; "Last
//         activated" stays "Banana", unchanged. This is the one step that proves `(activation)`
//         does NOT fire for a node that also carries a direct `matTreeNodeToggle`.
//     11. End → focus moves to the last visible node. Both roots are now collapsed, so that's
//         Vegetables.
//     12. Home → focus moves to the first visible node, Fruit.
//     13. `*` → expands every ROOT sibling (Fruit AND Vegetables, since Fruit's parent is null) —
//         Apple/Banana reappear under Fruit, Leafy greens + Carrot appear under Vegetables (Leafy
//         greens itself stays collapsed, it's a grandchild, not a root sibling); focus stays on
//         Fruit (`*` never moves focus, only expands).
// - **disabled-skipped**: flat tree, three root leaves, no children at all: "Alpha", "Beta"
//   (`[isDisabled]="true"`), "Gamma". No toggles, no padding directive (trivial at level 0).
//   "Alpha" is the default-focused node (`tabindex="0"`) since Beta is skipped. Steps: Tab (into
//   the tree; focus lands on Alpha, already `tabindex="0"`) · ArrowDown (skips Beta entirely →
//   focus moves straight to Gamma: Alpha → `-1`, Gamma → `0`, Beta's tabindex never changes) ·
//   ArrowUp (skips Beta backward → back to Alpha) · click Beta directly (force, since Playwright
//   treats it as a plain non-interactive element) → NO DOM change at all (its `(click)` handler
//   is the inherited `_focusItem()`, which no-ops when `isDisabled`).

interface FoodNode {
  name: string;
  children?: FoodNode[];
  expanded?: boolean;
}

function foodData(): FoodNode[] {
  return [
    {name: 'Fruit', children: [{name: 'Apple'}, {name: 'Banana'}]},
    {
      name: 'Vegetables',
      children: [
        {name: 'Leafy greens', children: [{name: 'Spinach'}, {name: 'Kale'}]},
        {name: 'Carrot'},
      ],
    },
  ];
}

@Component({
  template: `
    <div data-parity-root>
      <mat-tree #tree [dataSource]="dataSource" [childrenAccessor]="childrenAccessor">
        <mat-tree-node *matTreeNodeDef="let node" matTreeNodePadding>
          <button type="button" disabled></button>
          {{ node.name }}
        </mat-tree-node>
        <mat-tree-node
          *matTreeNodeDef="let node; when: hasChild"
          matTreeNodePadding
          matTreeNodeToggle
          [isExpandable]="true">
          <button type="button" matTreeNodeToggle [attr.aria-label]="'Toggle ' + node.name">
            {{ tree.isExpanded(node) ? '[-]' : '[+]' }}
          </button>
          {{ node.name }}
        </mat-tree-node>
      </mat-tree>
    </div>
  `,
  imports: [MatTreeModule],
})
export class TreeFlatBasic {
  dataSource: FoodNode[] = foodData();
  childrenAccessor = (node: FoodNode) => node.children ?? [];
  hasChild = (_: number, node: FoodNode) => !!node.children?.length;
}

@Component({
  template: `
    <div data-parity-root>
      <mat-tree #tree [dataSource]="dataSource" [childrenAccessor]="childrenAccessor">
        <mat-tree-node *matTreeNodeDef="let node" matTreeNodePadding>
          <button type="button" disabled></button>
          {{ node.name }}
        </mat-tree-node>
        <mat-tree-node
          *matTreeNodeDef="let node; when: hasChild"
          matTreeNodePadding
          matTreeNodeToggle
          [isExpandable]="true"
          [isExpanded]="!!node.expanded">
          <button type="button" matTreeNodeToggle [attr.aria-label]="'Toggle ' + node.name">
            {{ tree.isExpanded(node) ? '[-]' : '[+]' }}
          </button>
          {{ node.name }}
        </mat-tree-node>
      </mat-tree>
    </div>
  `,
  imports: [MatTreeModule],
})
export class TreeFlatInitiallyExpanded {
  dataSource: FoodNode[] = (() => {
    const data = foodData();
    data[0].expanded = true; // Fruit starts expanded.
    return data;
  })();
  childrenAccessor = (node: FoodNode) => node.children ?? [];
  hasChild = (_: number, node: FoodNode) => !!node.children?.length;
}

@Component({
  template: `
    <div data-parity-root>
      <mat-tree #tree [dataSource]="dataSource" [childrenAccessor]="childrenAccessor">
        <mat-nested-tree-node *matTreeNodeDef="let node">
          {{ node.name }}
        </mat-nested-tree-node>
        <mat-nested-tree-node
          *matTreeNodeDef="let node; when: hasChild"
          matTreeNodeToggle
          [isExpandable]="true">
          <div class="mat-tree-node">
            <button type="button" matTreeNodeToggle [attr.aria-label]="'Toggle ' + node.name">
              {{ tree.isExpanded(node) ? '[-]' : '[+]' }}
            </button>
            {{ node.name }}
          </div>
          <div role="group" [style.display]="tree.isExpanded(node) ? null : 'none'">
            <ng-container matTreeNodeOutlet></ng-container>
          </div>
        </mat-nested-tree-node>
      </mat-tree>
    </div>
  `,
  imports: [MatTreeModule],
})
export class TreeNestedBasic {
  dataSource: FoodNode[] = foodData();
  childrenAccessor = (node: FoodNode) => node.children ?? [];
  hasChild = (_: number, node: FoodNode) => !!node.children?.length;
}

@Component({
  template: `
    <div data-parity-root>
      <mat-tree #tree [dataSource]="dataSource" [childrenAccessor]="childrenAccessor">
        <mat-nested-tree-node *matTreeNodeDef="let node">
          {{ node.name }}
        </mat-nested-tree-node>
        <mat-nested-tree-node
          *matTreeNodeDef="let node; when: hasChild"
          matTreeNodeToggle
          [isExpandable]="true"
          [isExpanded]="!!node.expanded">
          <div class="mat-tree-node">
            <button type="button" matTreeNodeToggle [attr.aria-label]="'Toggle ' + node.name">
              {{ tree.isExpanded(node) ? '[-]' : '[+]' }}
            </button>
            {{ node.name }}
          </div>
          <div role="group" [style.display]="tree.isExpanded(node) ? null : 'none'">
            <ng-container matTreeNodeOutlet></ng-container>
          </div>
        </mat-nested-tree-node>
      </mat-tree>
    </div>
  `,
  imports: [MatTreeModule],
})
export class TreeNestedInitiallyExpanded {
  dataSource: FoodNode[] = (() => {
    const data = foodData();
    data[0].expanded = true; // Fruit starts expanded.
    return data;
  })();
  childrenAccessor = (node: FoodNode) => node.children ?? [];
  hasChild = (_: number, node: FoodNode) => !!node.children?.length;
}

interface NotExpandableNode {
  name: string;
  children?: NotExpandableNode[];
  disabled?: boolean;
}

@Component({
  template: `
    <div data-parity-root>
      <mat-tree #tree [dataSource]="dataSource" [childrenAccessor]="childrenAccessor">
        <mat-tree-node *matTreeNodeDef="let node" matTreeNodePadding>
          {{ node.name }}
        </mat-tree-node>
        <mat-tree-node
          *matTreeNodeDef="let node; when: hasChild"
          matTreeNodePadding
          matTreeNodeToggle
          [isExpandable]="true"
          [isDisabled]="!!node.disabled">
          <button type="button" matTreeNodeToggle [attr.aria-label]="'Toggle ' + node.name">
            {{ tree.isExpanded(node) ? '[-]' : '[+]' }}
          </button>
          {{ node.name }}
        </mat-tree-node>
      </mat-tree>
    </div>
  `,
  imports: [MatTreeModule],
})
export class TreeNotExpandable {
  dataSource: NotExpandableNode[] = [
    {name: 'Leaf'},
    {name: 'Branch', children: [{name: 'Branch child'}]},
    {name: 'Disabled branch', disabled: true, children: [{name: 'Hidden child'}]},
  ];
  childrenAccessor = (node: NotExpandableNode) => node.children ?? [];
  hasChild = (_: number, node: NotExpandableNode) => !!node.children?.length;
}

@Component({
  template: `
    <div data-parity-root>
      <mat-tree #tree [dataSource]="dataSource" [childrenAccessor]="childrenAccessor">
        <mat-tree-node
          *matTreeNodeDef="let node"
          matTreeNodePadding
          (activation)="lastActivated = $event.name">
          <button type="button" disabled></button>
          {{ node.name }}
        </mat-tree-node>
        <mat-tree-node
          *matTreeNodeDef="let node; when: hasChild"
          matTreeNodePadding
          matTreeNodeToggle
          [isExpandable]="true"
          (activation)="lastActivated = $event.name">
          <button type="button" matTreeNodeToggle [attr.aria-label]="'Toggle ' + node.name">
            {{ tree.isExpanded(node) ? '[-]' : '[+]' }}
          </button>
          {{ node.name }}
        </mat-tree-node>
      </mat-tree>
      <p>Last activated: {{ lastActivated ?? '(none)' }}</p>
    </div>
  `,
  imports: [MatTreeModule],
})
export class TreeKeyboardNav {
  dataSource: FoodNode[] = foodData();
  childrenAccessor = (node: FoodNode) => node.children ?? [];
  hasChild = (_: number, node: FoodNode) => !!node.children?.length;
  lastActivated: string | undefined;
}

interface DisabledSkippedNode {
  name: string;
  disabled?: boolean;
}

@Component({
  template: `
    <div data-parity-root>
      <mat-tree #tree [dataSource]="dataSource" [childrenAccessor]="childrenAccessor">
        <mat-tree-node *matTreeNodeDef="let node" [isDisabled]="!!node.disabled">
          {{ node.name }}
        </mat-tree-node>
      </mat-tree>
    </div>
  `,
  imports: [MatTreeModule],
})
export class TreeDisabledSkipped {
  dataSource: DisabledSkippedNode[] = [
    {name: 'Alpha'},
    {name: 'Beta', disabled: true},
    {name: 'Gamma'},
  ];
  childrenAccessor = (_node: DisabledSkippedNode) => [];
}

export const TREE_SCENARIOS: Record<string, Type<unknown>> = {
  'flat-basic': TreeFlatBasic,
  'flat-initially-expanded': TreeFlatInitiallyExpanded,
  'nested-basic': TreeNestedBasic,
  'nested-initially-expanded': TreeNestedInitiallyExpanded,
  'not-expandable': TreeNotExpandable,
  'keyboard-nav': TreeKeyboardNav,
  'disabled-skipped': TreeDisabledSkipped,
};
