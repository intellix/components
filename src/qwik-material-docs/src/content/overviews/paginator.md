`<MatPaginator>` provides navigation for paged information, typically used with a table.

<!-- example(paginator-overview) -->

### Basic use
Each paginator instance requires:
* The number of items per page (default set to 50)
* The total number of items being paged (`length`, default `0`)

The current page index defaults to 0, but can be explicitly set via `pageIndex` — read once, to
seed the paginator's own internal page state (see [Angular → Qwik
notes](#angular-qwik-notes) below).

When the user interacts with the paginator, an `onPage$` callback fires with a `PageEvent` that
can be used to update any associated data view.

### Page size options
The paginator displays a dropdown of page sizes for the user to choose from. The options for this
dropdown can be set via `pageSizeOptions`.

The current `pageSize` will always appear in the dropdown, even if it is not included in
`pageSizeOptions`.

If you want to customize some of the options of the `<MatSelect>` inside the `<MatPaginator>`, you
can use the `selectConfig` prop.

### Internationalization
The labels for the paginator can be customized by providing your own `MatPaginatorIntl` via
`<QwikMaterialProvider matPaginatorIntl={{...}}>`. This will allow you to change the following:
 1. The label for the length of each page (`itemsPerPageLabel`).
 2. The labels/tooltip messages on the navigation buttons (`nextPageLabel`, `previousPageLabel`,
    `firstPageLabel`, `lastPageLabel`).

The range text displayed to the user is not customizable through `MatPaginatorIntl` in this port
— see [Angular → Qwik notes](#angular-qwik-notes) for the real, string-prop-based alternative.

### Accessibility
The paginator uses `role="group"` to semantically group its child controls. You must add an
`aria-label` attribute to `<MatPaginator>` with a label that describes the content controlled by
the pagination control.

You can set the labels for the button and select controls within the paginator via
`MatPaginatorIntl`, same as above.

## Angular → Qwik notes

- **`pageIndex`/`pageSize` are read ONCE, then owned internally by `<MatPaginator>` — not live,
  reassignable props.** Upstream's versions are plain `@Input`s a consumer can keep rebinding
  after the paginator mounts (e.g. to jump to a page from outside); this port instead seeds its
  own internal state from whatever `pageIndex`/`pageSize` were on first render, and from then on
  only its own navigation (next/previous/first/last, changing the page size) ever changes them,
  reporting every change via `onPage$` — the same data flow every real paginator UI already uses,
  just not externally settable afterward. A consumer that needs to force the paginator onto a
  specific page from outside after mount isn't supported yet.
- **No pluggable `MatPaginatorIntl.getRangeLabel` — use the `rangeLabel` string prop on
  `<MatPaginator>` instead.** A plain (non-`$()`) function stored on a context value or its
  fallback default crashes this project's SSR pass the instant anything triggers a
  pause/snapshot, so `MatPaginatorIntl` only carries plain label strings. `<MatPaginator>` accepts
  a plain-string `rangeLabel` prop instead, which overrides the computed default entirely —
  compute it yourself from the same `pageIndex`/`pageSize`/`length` your own `onPage$` handler
  already receives if you need upstream's fully dynamic behavior.
- **`MatPaginatorSelectConfig.disableOptionCentering` is accepted for API parity but has no
  effect** — same reason `MatSelect`'s own `disableOptionCentering` doesn't (it only ever
  affected a non-flexible positioning variant this port doesn't use).
