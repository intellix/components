import {createContextId} from '@builder.io/qwik';
import {defaultRangeLabel} from './paginator-math';

/**
 * Qwik-port equivalent of upstream `MatPaginatorIntl` (`src/material/paginator/paginator-intl.ts`).
 * Upstream is an injectable `@Service()` class a consumer overrides via
 * `providers: [{provide: MatPaginatorIntl, useClass: MyIntl}]`; this port uses a context instead
 * (`MAT_PAGINATOR_INTL`, provided via `<QwikMaterialProvider matPaginatorIntl={...}>`) — same
 * pattern as every other per-component config in this project. Unlike most of those configs, this
 * one is NOT merged field-by-field with a fallback default (upstream's `providers` entry replaces
 * the WHOLE service instance, not individual fields) — a consumer supplying `matPaginatorIntl`
 * supplies every field, same as `src/components-examples/material/paginator/paginator-intl`'s own
 * example and this port's `custom-intl` dev-app route.
 *
 * Upstream's `changes: Subject<void>` (for notifying `MatPaginator` when labels change AFTER
 * initialization) isn't ported — no scenario mutates an already-provided `MatPaginatorIntl`
 * instance's fields after mount; a consumer who needs that can simply re-provide a new object
 * (Qwik's context already re-renders every subscriber on a provider value change).
 */
export interface MatPaginatorIntl {
  /** A label for the page size selector. */
  itemsPerPageLabel: string;
  /** A label for the button that increments the current page. */
  nextPageLabel: string;
  /** A label for the button that decrements the current page. */
  previousPageLabel: string;
  /** A label for the button that moves to the first page. */
  firstPageLabel: string;
  /** A label for the button that moves to the last page. */
  lastPageLabel: string;
  /** A label for the range of items within the current page and the length of the whole list. */
  getRangeLabel: (page: number, pageSize: number, length: number) => string;
}

/** Upstream's hardcoded English defaults. */
export const DEFAULT_PAGINATOR_INTL: MatPaginatorIntl = {
  itemsPerPageLabel: 'Items per page:',
  nextPageLabel: 'Next page',
  previousPageLabel: 'Previous page',
  firstPageLabel: 'First page',
  lastPageLabel: 'Last page',
  getRangeLabel: defaultRangeLabel,
};

/**
 * Context id a consumer provides via `<QwikMaterialProvider matPaginatorIntl={...}>` to override
 * every `MatPaginator` in that subtree's strings — see this file's module doc comment. Falls back
 * to {@link DEFAULT_PAGINATOR_INTL} when nothing provides it.
 */
export const MAT_PAGINATOR_INTL = createContextId<MatPaginatorIntl>('qwik-material/paginator-intl');
