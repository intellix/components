# @angular-community/qwik-cdk/collections

Qwik port of [@angular/cdk/collections](https://github.com/angular/components/tree/main/src/cdk/collections).

Exports:

- `createSelectionModel()` — full-fidelity port of `SelectionModel<T>` (single/multiple
  selection, `compareWith`, `isEmpty`/`hasValue`/`sort`, `onChange()` in place of upstream's
  RxJS `changed` subject). A plain factory, not a `class` — see `SYNC.md`.
- `useSelectionModel()` + `selectValue`/`deselectValue`/`toggleSelectionValue`/
  `setSelectionValues`/`clearSelection` — a Qwik-component-safe binding: the selected values
  live in a `Signal`, mutated via plain module functions called from your own `$()` handlers.
- `DataSource` (abstract class), `isDataSource()`, `ArrayDataSource` — ported with this
  package's RxJS-free `Subscribable<T>` in place of `Observable<T>`.
- `useDataSourceConnection()` — bridges a `DataSource` (or a plain array) into a reactive
  `Signal<readonly T[]>` you can feed into `qwik-material/table`'s `MatTable` `rows` prop, or
  any other array-rendering component.
- `createUniqueSelectionDispatcher()` — ported for API completeness; no consumer in this
  port needs it today (see `SYNC.md`).

Pure, framework-light logic — no RxJS dependency. See `SYNC.md` for every deviation from
upstream and why.
