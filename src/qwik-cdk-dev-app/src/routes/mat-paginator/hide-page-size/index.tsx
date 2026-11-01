import {component$, useSignal} from '@qwik.dev/core';
import {MatPaginator, type PageEvent} from '@angular-community/qwik-material/paginator';

// Mirrors src/dev-app/qwik-parity/paginator.ts's PaginatorHidePageSize — same inputs as `basic`
// plus `hidePageSize`. `pageSizeOptions` is still bound to prove it has no effect while hidden.
export default component$(() => {
  const pageIndex = useSignal(0);
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
          hidePageSize
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
