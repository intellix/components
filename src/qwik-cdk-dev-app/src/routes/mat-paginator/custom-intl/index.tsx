import {component$, useSignal} from '@builder.io/qwik';
import {QwikMaterialProvider} from '@angular-community/qwik-material/dialog';
import {MatPaginator, type PageEvent} from '@angular-community/qwik-material/paginator';

// Mirrors src/dev-app/qwik-parity/paginator.ts's PaginatorCustomIntl — a custom MatPaginatorIntl
// (upstream: a plain class implementing the interface, provided via `providers:
// [{provide: MatPaginatorIntl, useClass: ...}]`; this port's equivalent is
// `<QwikMaterialProvider matPaginatorIntl={...}>`, which REPLACES the whole intl object, not a
// per-field merge — see qwik-material/paginator/paginator-intl.ts). Exact strings mirrored
// verbatim from the Angular scenario's header comment.
//
// `getRangeLabel` is NOT part of `MAT_PAGINATOR_INTL` in this port (see paginator-intl.ts's
// module doc comment — a plain function can't safely cross Qwik's SSR-resumability
// serialization boundary) — instead this route computes the custom "Page N of M" text itself,
// from the SAME `pageIndex`/`pageSize` its own `onPage$` handler already tracks, and passes the
// resulting STRING via `<MatPaginator rangeLabel={...}>`.
const customRangeLabel = (page: number, size: number, length: number): string => {
  if (length === 0 || size === 0) {
    return 'No items';
  }
  const amountPages = Math.ceil(length / size);
  return `Page ${page + 1} of ${amountPages}`;
};

export default component$(() => {
  const pageIndex = useSignal(0);
  const pageSize = useSignal(10);

  return (
    <QwikMaterialProvider
      matPaginatorIntl={{
        itemsPerPageLabel: 'Rows:',
        nextPageLabel: 'Go forward',
        previousPageLabel: 'Go backward',
        firstPageLabel: 'Jump to first',
        lastPageLabel: 'Jump to last',
      }}
    >
      <div data-parity-root>
        <MatPaginator
          style="width: 600px"
          aria-label="Select page"
          length={100}
          pageSize={pageSize.value}
          pageSizeOptions={[5, 10, 25]}
          showFirstLastButtons
          rangeLabel={customRangeLabel(pageIndex.value, pageSize.value, 100)}
          onPage$={(e: PageEvent) => {
            pageIndex.value = e.pageIndex;
            pageSize.value = e.pageSize;
          }}
        />
        <p>
          Page: {pageIndex.value} Size: {pageSize.value}
        </p>
      </div>
      <main data-scenario-ready>ready</main>
    </QwikMaterialProvider>
  );
});
