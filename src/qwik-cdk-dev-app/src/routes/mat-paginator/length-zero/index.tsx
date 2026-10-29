import {component$, useSignal} from '@builder.io/qwik';
import {MatPaginator, type PageEvent} from '@angular-community/qwik-material/paginator';

// Mirrors src/dev-app/qwik-parity/paginator.ts's PaginatorLengthZero — length 0, pageSize 5,
// pageSizeOptions [5, 10, 25], default intl, no showFirstLastButtons. Both nav buttons are
// disabled from the very first render with NO `disabled` input involved at all (hasNextPage()'s
// maxPageIndex is -1 when length/pageSize give 0 pages; hasPreviousPage() needs pageIndex >= 1).
export default component$(() => {
  const pageIndex = useSignal(0);
  const pageSize = useSignal(5);

  return (
    <>
      <div data-parity-root>
        <MatPaginator
          style="width: 600px"
          aria-label="Select page"
          length={0}
          pageSize={pageSize.value}
          pageSizeOptions={[5, 10, 25]}
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
