`MatSort` and `MatSortHeader` are used, respectively, to add sorting state and display to
tabular data.

<!-- example(sort-overview) -->

### Adding sort to table headers

To add sorting behavior and styling to a set of table headers, use `<MatSortHeader id="...">`
for each header, nested inside a `<MatSort>` parent, which fires an `onSortChange$` callback when
the user triggers sorting on the header.

Users can trigger the sort header through a mouse click or keyboard action. When this happens,
`onSortChange$` fires with the id of the header triggered and the direction to sort (`asc` or
`desc`).

#### Changing the sort order

By default, a sort header starts its sorting at `asc` and then `desc`. Triggering the sort header
after `desc` will remove sorting.

To reverse the sort order for all headers, pass `start="desc"` on `<MatSort>`. To reverse the
order only for a specific header, set the `start` prop only on that `<MatSortHeader>` instead.

To prevent the user from clearing the sort state from an already sorted column, pass
`disableClear` on `<MatSort>` to affect all headers, or set `disableClear` on a specific
`<MatSortHeader>`.

#### Disabling sorting

If you want to prevent the user from changing the sorting order of any column, pass `disabled`
on `<MatSort>`, or `disabled` on a single `<MatSortHeader>`.

#### Using sort with MatTable

When used with `<MatTable>`, a column doesn't need its own `<MatSortHeader>` element — pass
`sortHeader: true` (or `sortHeader: {id}`) on the column's `MatColumnDef` instead, and `sort={...}`
on `<MatTable>` itself (see [Angular → Qwik notes](#angular-qwik-notes) below for why this is one
shared element rather than two separate directives).

<!-- example(table-sorting) -->

#### Customizing the icon

Upstream lets you set your own icon for a sort header by projecting in an element with the
`matSortHeaderIcon` attribute — not yet ported (see [Angular → Qwik notes](#angular-qwik-notes)).

<!-- example(sort-custom-icon) -->

### Accessibility

When you apply `MatSortHeader`, the component wraps the content of the header cell inside a
button-like container. The text content of the header cell then becomes the accessible label for
the sort control. However, the header cell text typically describes the column and does not
indicate that interacting with the control performs a sorting action. To clearly communicate
that the header performs sorting, always use the `sortActionDescription` prop to provide a
description, such as "Sort by last name".

`MatSortHeader` applies the `aria-sort` attribute to communicate the active sort state to
assistive technology.

## Angular → Qwik notes

- **`MatTable`'s `sort` integration hosts the shared sort state directly — there's no separate
  `<MatSort>` wrapper element.** Upstream's `mat-sort-header`/`mat-header-cell` are two SEPARATE
  directives Angular composes onto the SAME `<th>` element; Qwik has no equivalent, so
  `MatColumnDef.sortHeader` tells `<MatTable>` to render `<MatSortHeader>` directly AS the header
  cell. Outside a table, `<MatSort>`/`<MatSortHeader>` work exactly as described above.
- **Custom sort-arrow icon projection (`matSortHeaderIcon`) isn't ported.** A named `<Slot>` for
  this didn't render its fallback content reliably when this port was still on
  `@builder.io/qwik@1.20.0`; the default arrow SVG renders unconditionally instead, with no way
  for a consumer to override it yet. The ["Sort header with a custom
  icon"](https://material.angular.dev/components/sort/overview#sort-custom-icon) example above
  stays as a "not yet ported" placeholder until this is revisited (the project has since moved to
  `@qwik.dev/core` v2, where a plain `icon` prop — the same "content as a prop" pattern used
  elsewhere in this port — would likely be the fix, rather than a named Slot).
