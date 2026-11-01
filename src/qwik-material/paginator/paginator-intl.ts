import {createContextId} from '@qwik.dev/core';

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
 *
 * ## `getRangeLabel` is deliberately NOT part of this interface (read before adding it back)
 *
 * Upstream's `getRangeLabel` is a plain `(page, pageSize, length) => string` function FIELD on
 * the intl object. Confirmed live: putting a plain (non-`$()`) function anywhere Qwik's
 * resumability serializer can reach — which a `useContextProvider`-provided value, or this
 * context's own `useContext(..., DEFAULT)` FALLBACK default, both are — crashes the dev-app's SSR
 * pass with `QError_verifySerializable` ("Code(3)") the moment anything triggers a pause/snapshot,
 * for EVERY scenario (not just one providing a custom intl — the hardcoded default hit the exact
 * same crash). This is the same "plain function crossing a serialization boundary" hazard
 * `qwik-material/select/SYNC.md`'s `compareWith`/`sortComparator` deviation already documents (and
 * the reason neither is accepted as a plain function prop there) — this is simply the first place
 * in this project where the function in question MUST be customizable AND produce a plain string
 * synchronously during render (a `QRL`-ified version would make every call async, incompatible
 * with rendering its result directly into JSX text).
 *
 * The fix: `MatPaginator` accepts a separate, plain-STRING `rangeLabel` PROP (see
 * `mat-paginator.tsx`) instead of a pluggable function. Its own DEFAULT behavior (used by every
 * scenario except `custom-intl`) calls `defaultRangeLabel` (`paginator-math.ts`) directly, as a
 * plain top-level import — never stored in a prop/context/signal, so nothing about it is ever
 * reachable by Qwik's serializer; a consumer wanting upstream's fully-dynamic
 * `MatPaginatorIntl.getRangeLabel` behavior instead computes the string THEMSELVES (from the
 * SAME `pageIndex`/`pageSize`/`length` the `onPage$` event already reports) and passes it as
 * `rangeLabel` — see `custom-intl`'s dev-app route for exactly this.
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
}

/** Upstream's hardcoded English defaults. */
export const DEFAULT_PAGINATOR_INTL: MatPaginatorIntl = {
  itemsPerPageLabel: 'Items per page:',
  nextPageLabel: 'Next page',
  previousPageLabel: 'Previous page',
  firstPageLabel: 'First page',
  lastPageLabel: 'Last page',
};

/**
 * Context id a consumer provides via `<QwikMaterialProvider matPaginatorIntl={...}>` to override
 * every `MatPaginator` in that subtree's strings — see this file's module doc comment. Falls back
 * to {@link DEFAULT_PAGINATOR_INTL} when nothing provides it.
 */
export const MAT_PAGINATOR_INTL = createContextId<MatPaginatorIntl>('qwik-material/paginator-intl');
