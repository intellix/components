`MatTable` provides a Material Design styled data-table that can be used to display rows of data.

This table builds on the foundation of the CDK data-table and uses a similar interface for its
data input, except that columns/rows are passed as plain data instead of projected templates (see
[Angular → Qwik notes](#angular-qwik-notes) below).

### Getting Started

<!-- example(table-basic) -->

#### 1. Write your columns and rows

Provide a `columns: MatColumnDef[]` array (one entry per column, each with a `name` and optional
`header`/`footer` content) and a `rows: MatTableRow[]` array (one entry per data row, with
`cells` already evaluated per row by your own `.map()` over your data array).

```tsx
const columns: MatColumnDef[] = [{name: 'score', header: 'Score'}];
const rows: MatTableRow[] = users.map(user => ({key: user.id, cells: {score: user.score}}));
```

#### 2. Define the row templates

Tell `<MatTable>` which columns to render via `displayedColumns` — a plain array of column names,
in the order you want them rendered. The same list of columns can be reordered or filtered simply
by changing this array.

```tsx
<MatTable columns={columns} rows={rows} displayedColumns={['userName', 'age']} />
```

### Advanced data sources

qwik-material has no `MatTableDataSource`/`DataSource` abstraction — see [Angular → Qwik
notes](#angular-qwik-notes). Sorting, filtering, and pagination logic is implemented directly by
the consumer, operating on a plain array before it's passed to `rows`.

### Styling Columns

Each table cell has an automatically generated class based on which column it appears in. The
format for this generated class is `mat-column-NAME`. For example, cells in a column named
"symbol" can be targeted with the selector `.mat-column-symbol`.

<!-- example(table-column-styling) -->

### Row Templates

Upstream lets you bind event handlers/properties directly on the row template, applied to every
rendered row — not yet ported (see [Angular → Qwik notes](#angular-qwik-notes)).

<!-- example(table-row-binding) -->

### Features

`MatTable` is focused on a single responsibility: efficiently render rows of data in a performant
and accessible way.

You'll notice that the table itself doesn't come out of the box with a lot of features, but
expects that the table will be included in a composition of components that fills out its
features.

For example, you can add sorting and pagination to the table by using `MatSort` (via the column's
`sortHeader` field) and `MatPaginator`, mutating the data provided to the table according to their
callbacks.

#### Pagination

To paginate the table's data, add a `<MatPaginator>` after the table and slice your data array by
its `onPage$` callback's `pageIndex`/`pageSize`.

<!-- example(table-pagination) -->

#### Virtual scrolling

Upstream offers an alternative, virtual-scrolling-based rendering strategy for large tables (via
`@angular/cdk/scrolling`) — not yet ported (see [Angular → Qwik notes](#angular-qwik-notes)).

<!-- example(table-virtual-scroll) -->

#### Sorting

To add sorting behavior to the table, pass `sortHeader: true` (or `{id}`) on a column's
`MatColumnDef`, and pass `sort={{...}}` on `<MatTable>` itself (see the [Sort
overview](/components/sort/overview/)'s Angular → Qwik notes for why this is one shared element
instead of two directives).

<!-- example(table-sorting) -->

For more information on using and configuring the sorting behavior, check out the [MatSort
overview](/components/sort/overview/).

#### Filtering

qwik-material does not provide a specific component to be used for filtering `MatTable` since
there is no single common approach to adding a filter UI to table data.

A general strategy is to add an input where users can type in a filter string and filter your own
data array before it's passed to `rows`. If you want to show a message when no data matches the
filter, pass `noData` on `<MatTable>`.

<!-- example(table-filtering) -->

#### Drag and drop

Upstream integrates `mat-table` with `@angular/cdk/drag-drop` to support drag & drop of either
columns or rows — not yet ported (qwik-cdk has no drag-drop entry point yet).

<!-- example(table-reorderable) -->

<!-- example(table-drag-drop) -->

#### Selection

There is no formal support for adding a selection UI to the table, but qwik-material does offer
the right components and pieces to set this up — pass a `<MatCheckbox>` as a column's cell
content and maintain your own selection state (e.g. a `Set`).

<!-- example(table-selection) -->

#### Footer row

A footer row can be added to the table by giving a column a `footer` value and passing
`footerRows` on `<MatTable>`.

<!-- example(table-footer-row) -->

#### Sticky Rows and Columns

By using `position: sticky` styling, the table's rows and columns can be fixed so that they do
not leave the viewport even when scrolled. Pass `sticky: true` on a `headerRows`/`footerRows`
entry, or `sticky`/`stickyEnd` on a column's `MatColumnDef`.

In order to fix the header row to the top of the scrolling viewport containing the table, pass
`headerRows={[{columns: displayedColumns, sticky: true}]}`.

<!-- example(table-sticky-header) -->

Similarly, this can also be applied to the table's footer row.

<!-- example(table-sticky-footer) -->

It is also possible to fix cell columns to the start or end of the horizontally scrolling
viewport, via a column's `sticky`/`stickyEnd` fields.

<!-- example(table-sticky-columns) -->

#### Multiple row templates

Upstream's `multiTemplateDataRows` lets a single data object render as multiple `<tr>`s — not yet
ported (see [Angular → Qwik notes](#angular-qwik-notes)).

<!-- example(table-multiple-row-template) -->

### Accessibility

By default, `MatTable` applies `role="table"`. Always provide an accessible label for your tables
via `aria-label` or `aria-labelledby` on the table element.

### Tables with `display: flex`

`MatTable` does not require that you use a native HTML table. Instead, pass `as="mat-table"` for
an alternative approach that uses `display: flex` for the table's styles.

```tsx
<MatTable as="mat-table" columns={columns} rows={rows} displayedColumns={displayedColumns} />
```

### Tables with `MatRipple`

Upstream lets you add a ripple effect to table rows via the `MatRipple` directive — not yet
ported for rows specifically (see [Angular → Qwik notes](#angular-qwik-notes)).

<!-- example(table-with-ripples) -->

## Angular → Qwik notes

- **Columns and rows are plain data (`columns`/`rows` arrays), not content-projected
  `<ng-container matColumnDef>`/`*matCellDef` templates.** Upstream's `mat-table` takes CONTENT
  CHILDREN, queried via `@ContentChildren` and manufactured into rows via
  `ViewContainerRef.createEmbeddedView`. Qwik has no equivalent, and a column's cell template is
  applied once per data row AND independently as a header/footer, so this port generalizes the
  "data array carrying already-realized `JSXOutput`" pattern (already used by `MatTabGroup`/
  `MatStepper`) to two dimensions: `columns: MatColumnDef[]` (one entry per `matColumnDef`,
  `header`/`footer` already-built content, same for every row) and `rows: MatTableRow[]` (one
  entry per data row, with `cells` already evaluated per row by your own `.map()`).
- **No `MatTableDataSource`.** Confirmed genuinely unused by every scenario in this port's
  contract — every one uses a plain array, re-sorted/mutated by the consumer's own code. A
  future consumer wanting the built-in filter/sort/paginate pipeline would need this ported
  separately.
- **`matSort`/`mat-header-cell` combine into one `sortHeader` field on `MatColumnDef`.** Upstream
  attaches TWO directives to the SAME `<th>`; Qwik renders exactly one element per cell, so
  `MatColumnDef.sortHeader` tells `<MatTable>` to render a `<MatSortHeader>` directly as the
  header cell instead.
- **No per-row class/click handler (`MatTableRow` is plain data).** Binding event handlers or
  properties directly on the row template (Row Templates, `table-row-binding`) isn't
  reproducible — there's no row-level component to attach a handler to.
- **No virtual scrolling.** `@angular/cdk/scrolling` has no qwik-cdk entry point yet.
- **No drag-and-drop column/row reordering.** `@angular/cdk/drag-drop` has no qwik-cdk entry
  point yet.
- **No `multiTemplateDataRows` (multiple rows per data object).** `MatTableRow` is a single
  flat row; there's no mechanism for one data object to expand into several `<tr>`s yet.
- **No `MatRipple` on table rows.** Not yet wired up for the row-data shape this port uses.
