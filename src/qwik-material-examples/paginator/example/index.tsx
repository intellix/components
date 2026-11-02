import {component$} from '@qwik.dev/core';
import {MatPaginator} from '@angular-community/qwik-material/paginator';

// Qwik port of material.angular.dev's `paginator-overview` docs example — see
// src/components-examples/material/paginator/paginator-overview/paginator-overview-example.{ts,html}.
// Rendered unmodified by the Angular dev-app at /qwik-parity/mat-paginator/example
// (src/dev-app/qwik-parity/examples.ts). Host tag mirrors the example's own component selector
// (`paginator-overview-example`). No `(page)` binding upstream either — `MatPaginator` owns
// `pageIndex`/`pageSize` internally (see mat-paginator.tsx's module doc comment), so this is a
// pure static-props usage, identical to the real example.

export default component$(() => {
  return (
    <paginator-overview-example>
      <MatPaginator
        length={100}
        pageSize={10}
        pageSizeOptions={[5, 10, 25, 100]}
        aria-label="Select page"
      />
    </paginator-overview-example>
  );
});
