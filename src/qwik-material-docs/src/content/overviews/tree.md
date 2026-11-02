`MatTree` provides a Material Design styled tree that can be used to display hierarchical data.

This tree builds on the foundation of the CDK tree algorithms (`@angular-community/qwik-cdk/tree`)
— see [Angular → Qwik notes](#angular-qwik-notes) below for how this port's single `<MatTree>`
component covers what upstream splits across `cdk-tree`/`mat-tree` base classes.

There are two types of trees: flat and nested, selected via `<MatTree variant="...">`. The DOM
structures are different for these two types of trees.

#### Flat tree

In a flat tree, the hierarchy is flattened; nodes are not rendered inside of each other, but
instead are rendered as siblings in sequence.

```tsx
<MatTree
  variant="flat"
  nodes={[
    {
      key: 'parent',
      data: parentNode,
      content: 'parent node',
      children: [
        {key: 'child-1', data: child1Node, content: '-- child node1'},
        {key: 'child-2', data: child2Node, content: '-- child node2'},
      ],
    },
  ]}
/>
```

<!-- example(tree-flat-child-accessor-overview) -->

Flat trees are generally easier to style and inspect. They are also more friendly to scrolling
variations, such as infinite or virtual scrolling (not yet available on `MatTree` — see
[Angular → Qwik notes](#angular-qwik-notes)).

#### Nested tree

In a nested tree, children nodes are placed inside their parent node in the DOM. Switching to
`variant="nested"` renders the exact same `nodes` array recursively instead of flattening it.

```tsx
<MatTree
  variant="nested"
  nodes={[
    {
      key: 'parent',
      data: parentNode,
      isExpandable: true,
      content: 'parent node',
      children: [
        {key: 'child-1', data: child1Node, content: '-- child node1'},
        {key: 'child-2', data: child2Node, content: '-- child node2'},
      ],
    },
  ]}
/>
```

<!-- example(tree-nested-child-accessor-overview) -->

Nested trees are easier to work with when hierarchical relationships are visually represented in
ways that would be difficult to accomplish with flat nodes.

### Usage

#### Writing your tree template

In order to use the tree, you build a `nodes: CdkTreeNodeInput[]` array yourself, instead of
declaring a node-definition template — see [Angular → Qwik notes](#angular-qwik-notes) below for
why. Each entry's `content` is that node's already-built inner JSX — the Qwik equivalent of what
upstream's `*matTreeNodeDef` template would have rendered for it.

```tsx
const nodes: CdkTreeNodeInput[] = [{key: 'node-1', data: node, content: `${node.key}: ${node.value}`}];
```

##### Flat tree node template

Flat trees use each node's computed depth to both render and determine hierarchy for screen
readers. Depth is always computed for you from the `children` array you provide — there's no
separate `levelAccessor` to supply (see [Angular → Qwik notes](#angular-qwik-notes)).

Indentation is added automatically, based on `<MatTree>`'s own `indent`/`padding` props — see
[Padding](#padding-flat-tree-only) below — or you can apply custom styles based on the rendered
`aria-level` attribute instead.

##### Nested tree node template

When using the nested variant, a node's `children` array is all that's needed — `<MatTree>`
renders them directly inside their parent, with no separate outlet marker to place (upstream's
`matTreeNodeOutlet` has no equivalent to author, since there's no per-node template for it to
anchor into).

#### Adding expand/collapse

`<MatTreeNodeToggle>` (`@angular-community/qwik-material/tree`) can be used inside a node's
`content` to add expand/collapse functionality. It calls the tree's own expand/collapse state
directly and is able to expand/collapse a tree node recursively by setting `recursive` — **not yet
implemented** (accepted for API shape parity only — see [Angular → Qwik
notes](#angular-qwik-notes)).

`<MatTreeNodeToggle>` triggers upon click or keyboard activation (Enter/Space). For icon-only
usage, ensure that `aria-label` is provided.

```tsx
{
  key,
  data: node,
  isExpandable: true,
  content: (
    <>
      <MatTreeNodeToggle node={key} aria-label={`Toggle ${node.value}`} collapsedLabel="[+]" expandedLabel="[-]" />
      {node.value}
    </>
  ),
  children: buildNodes(node.children),
}
```

### Toggle

A `<MatTreeNodeToggle>` can be placed anywhere inside a node's `content` to expand/collapse that
node. It reads the tree's shared expansion state via context, so it always reflects the node's
current expanded/collapsed state even though `content` itself is only built once — see [Angular →
Qwik notes](#angular-qwik-notes) for why this matters.

### Padding (Flat tree only)

`<MatTree variant="flat">`'s `padding` prop (default `true`) adds `padding-left` to every flat
node, scaled by its computed depth and the `indent` prop (pixels per level, default `40`).

This is unnecessary for a nested tree, since the hierarchical structure of the DOM allows for
padding to be added via CSS instead.

#### Conditional template

Because nodes are plain data you build yourself — not templates matched against a `when`
predicate — picking a different `content`/shape for a particular node is just an ordinary
conditional in your own node-building code, with no separate API to learn:

```tsx
function buildNode(node: Node): CdkTreeNodeInput {
  return {
    key: node.id,
    data: node,
    content: isSpecial(node) ? `[ A special node ${node.value} ]` : node.value,
  };
}
```

### Data Source

#### Connecting the tree to a data source

`<MatTree>` takes its `nodes: CdkTreeNodeInput[]` array directly as a prop — there's no
`DataSource` abstraction to connect (see [Angular → Qwik notes](#angular-qwik-notes)). To react to
changing data, rebuild the array from your own state (e.g. a signal) and pass the new array back
in; `<MatTree>` re-renders from whatever it's currently given, the same as any other Qwik
component.

#### `levelAccessor`

Not supported — see [Angular → Qwik notes](#angular-qwik-notes). Every node's depth is always
computed from the recursive `children` array you provide, equivalent to always using the
`childrenAccessor` strategy below.

#### `childrenAccessor`

`CdkTreeNodeInput.children` is the migrated form of a `childrenAccessor` function — call your own
`childrenAccessor(node)` once, up front, recursively, to build the full `nodes` array before
passing it to `<MatTree>`, rather than handing the tree a callback.

#### `trackBy`

Not supported as a separate prop — see [Angular → Qwik notes](#angular-qwik-notes). Every node
already requires its own stable, unique `key`, which `<MatTree>` uses for tracking, expansion
state, and keyboard navigation regardless.

### Accessibility

`<MatTree>` implements the [`tree` widget](https://www.w3.org/WAI/ARIA/apg/patterns/treeview/),
including keyboard navigation and appropriate roles and ARIA attributes, for every tree built with
this port's `children`-array API (the only API this port has — see [Angular → Qwik
notes](#angular-qwik-notes) for why there's no legacy mode to contrast against).

#### isExpandable

In order for the tree to correctly determine whether or not a node is expandable, `isExpandable`
must be set on every node that is expandable — it is never inferred from `children`'s presence.

#### Activation actions

For trees with nodes that have actions upon activation, pass `onActivation$` on `<MatTree>` — it
fires when a node without its own toggle (a leaf, typically) is activated via Enter/Space,
receiving that node's `data` and `key`.

```tsx
<MatTree
  nodes={nodes}
  onActivation$={$((data, key) => {
    performAction(data);
  })}
/>
```

## Angular → Qwik notes

- **`MatTree` renders both variants directly — there's no separate, independently-tagged
  `CdkTree`/`CdkTreeNode` renderer.** Upstream has `MatTree extends CdkTree`/`MatTreeNode extends
  CdkTreeNode` as genuinely separate classes with their own element selectors (`<cdk-tree>` could
  exist unstyled on its own). This port combines the CDK-level (`cdk-tree`, `cdk-tree-node`,
  `cdk-nested-tree-node`) and Material-level (`mat-tree`, `mat-tree-node`, `mat-nested-tree-node`)
  classes directly in one component — the same approach `MatTable` takes. The resulting DOM is
  identical; only the authorship/class hierarchy differs.
- **Nodes are a plain recursive data array (`CdkTreeNodeInput[]`), not content-projected
  `*matTreeNodeDef` templates.** Qwik cannot read a `<Slot>`'s projected children's shape during
  SSR, and a per-node template matched via a `when` predicate has no equivalent — you decide a
  node's shape once, synchronously, while building the array. `isExpandable`/`isDisabled`/
  `isExpanded` are explicit per-node flags for the same reason upstream's own `isExpandable` input
  is never auto-inferred either.
- **Expansion/focus state is owned internally by `<MatTree>`, not the consumer.** A toggle
  button's label/expanded-ness can't be baked into a node's `content` as a static value (`content`
  is built once); place a `<MatTreeNodeToggle node={key}>` inside `content` instead — it reads the
  tree's live expansion state via context and re-renders itself independently, the same way
  `MatSortHeader` reads shared sort state from inside a `MatColumnDef.header` value.
- **`matTreeNodePadding` is a tree-level `padding` boolean (flat variant only), not a per-node
  directive.** Every node in a given flat tree gets the same padding behavior; there's no
  per-node override.
- **No `levelAccessor`/`treeControl`, no `DataSource`/`Observable` data source.** Only the
  `childrenAccessor`-equivalent recursive-array API (the currently recommended upstream approach)
  is supported. `MatTreeFlatDataSource`/`MatTreeNestedDataSource` have no equivalent either —
  rebuild the array yourself from your own data and pass it back in.
- **No separate `trackBy` input.** Every node's `key` already serves this purpose, unconditionally.
- **`matTreeNodeToggleRecursive` (`<MatTreeNodeToggle recursive>`) is accepted for API parity but
  not implemented.** Toggling a node only ever toggles that one node, never its descendants too.
- **No `TreeKeyManager` typeahead (type-to-search by node label).**
- **`<MatTreeNodeToggle>` always renders a bare, unstyled toggle element (default a plain
  `<button>`) — it never wraps an existing component.** The overview examples above show an icon
  toggle button (`<MatIconButton>` + `<MatIcon>`) instead; since neither component can be nested
  inside the other without adding an extra DOM element, that combination is assembled directly
  against the tree's own shared toggle context rather than through `<MatTreeNodeToggle>` — see
  that example's own source comments for the full pattern if you need the same composition.
