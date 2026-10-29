import {component$, useSignal} from '@builder.io/qwik';
import {MatPaginator, type PageEvent} from '@angular-community/qwik-material/paginator';

// Mirrors src/dev-app/qwik-parity/paginator.ts's PaginatorShowFirstLast — same inputs as `basic`
// plus `showFirstLastButtons`.
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
          showFirstLastButtons
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
