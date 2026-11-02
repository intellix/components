import {component$, useSignal} from '@qwik.dev/core';
import {MatPaginator, type PageEvent} from '@angular-community/qwik-material/paginator';

// Mirrors src/dev-app/qwik-parity/paginator.ts's PaginatorDisabled — length 100, pageSize 10,
// pageSizeOptions [5, 10, 25], pageIndex 1 (deliberately NOT a boundary — proves the global
// `disabled` flag overrides the per-page hasNextPage()/hasPreviousPage() checks for both
// directions at once), disabled true.
export default component$(() => {
  const pageIndex = useSignal(1);
  const pageSize = useSignal(10);

  return (
    <>
      <div data-parity-root>
        <MatPaginator
          style="width: 600px"
          aria-label="Select page"
          length={100}
          pageSize={pageSize.value}
          pageSizeOptions={[5, 10, 25]}
          pageIndex={1}
          disabled
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
    </>
  );
});
