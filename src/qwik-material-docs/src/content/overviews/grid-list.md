`<MatGridList>` is a two-dimensional list view that arranges cells into grid-based layout. See
Material Design spec [here](https://material.io/design/components/image-lists.html).

<!-- example(grid-list-overview) -->

### Setting the number of columns

A `<MatGridList>` must specify a `cols` prop which sets the number of columns in the grid. The
number of rows will be automatically determined based on the number of columns and the number of
items.

### Setting the row height

The height of the rows in a grid list can be set via the `rowHeight` prop. Row height for the
list can be calculated in three ways:

1. **Fixed height**: The height can be in `px`, `em`, or `rem`. If no units are specified, `px`
units are assumed (e.g. `100px`, `5em`, `250`).

2. **Ratio**: This ratio is column-width:row-height, and must be passed in with a colon, not a
decimal (e.g. `4:3`).

3. **Fit**: Setting `rowHeight` to `fit`. This mode automatically divides the available height by
the number of rows. Please note the height of the grid-list or its container must be set.

If `rowHeight` is not specified, it defaults to a `1:1` ratio of width:height.

### Setting the gutter size

The gutter size can be set to any `px`, `em`, or `rem` value with the `gutterSize` prop. If no
units are specified, `px` units are assumed. By default the gutter size is `1px`.

### Adding tiles that span multiple rows or columns

It is possible to set the rowspan and colspan of each `<MatGridTile>` individually, using the
`rowspan` and `colspan` props. If not set, they both default to `1`. The `colspan` must not
exceed the number of `cols` in the `<MatGridList>`. There is no such restriction on the `rowspan`
however, more rows will simply be added for the tile to fill.

### Tile headers and footers

A header and footer can be added to a `<MatGridTile>` using the `<MatGridTileHeader>` and
`<MatGridTileFooter>` components respectively:

```tsx
<MatGridTile>
  <MatGridTileHeader>
    <MatGridAvatar q:slot="avatar" src="..." alt="..." />
    <MatLine>Title</MatLine>
    <MatLine>Secondary text</MatLine>
  </MatGridTileHeader>
</MatGridTile>
```

### Accessibility
By default, the grid-list assumes that it will be used in a purely decorative fashion and thus
sets no roles, ARIA attributes, or keyboard shortcuts. This is equivalent to having a sequence of
`<div>` elements on the page. Any interactive content within the grid-list should be given an
appropriate accessibility treatment based on the specific workflow of your application.

If the grid-list is used to present a list of _non-interactive_ content items, then the
`<MatGridList>` should be given `role="list"` and each `<MatGridTile>` should be given
`role="listitem"`.

## Angular → Qwik notes

- **`<MatGridList>` is a plain function component, not a `component$` with content-child
  re-layout.** It reads tile spans directly off its JSX children once, synchronously, at render
  time, instead of `@ContentChildren` + `ngAfterContentChecked`. This is **shallow-only**: tiles
  must be direct JSX children of `<MatGridList>`, or nested only inside other components/plain
  elements the walker can introspect — it doesn't search inside a matched tile's own content.
- **A `<MatGridTile>` nested inside `<MatGridList>` is never actually mounted as its own
  component.** `<MatGridList>` reads its children as configuration and renders each tile's final
  markup itself — invisible to consumers (same JSX authoring, same DOM output), but a tile used
  this way can't have independent client-side behavior.
- **Direction hardcoded to `'ltr'`.** No RTL support yet (matches upstream's own fallback when no
  `Directionality` is injected).
- **Header/footer/avatar/line content projection is by component type, not Angular's
  `ng-content select`.** `<MatGridTileHeader>`/`<MatGridTileFooter>` partition their *direct*
  children by component type (`MatGridAvatar`, `MatLine`) instead of a directive-selector match.
- **Global defaults via a hook (`useMatGridListProvider()`)**, not an `MAT_GRID_LIST_CONFIG` injection token.
- **Dev-mode `throw Error()` guards removed** (missing `cols`, invalid ratio, oversized colspan,
  invalid fixed-height CSS) — TypeScript or the browser's own silent-ignore-invalid-CSS behavior
  cover the same ground, except the oversized-colspan throw, which is kept (not dev-mode-gated
  upstream either).
- **Harness not ported.**
