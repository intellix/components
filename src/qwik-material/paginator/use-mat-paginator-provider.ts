import {useContextProvider} from '@qwik.dev/core';
import {MAT_PAGINATOR_CONFIG, type MatPaginatorConfig} from './paginator-config';
import {MAT_PAGINATOR_INTL, DEFAULT_PAGINATOR_INTL, type MatPaginatorIntl} from './paginator-intl';

/** Options for {@link useMatPaginatorProvider}. */
export interface MatPaginatorProviderConfig {
  /** Field-by-field fallback defaults applied to every `MatPaginator` in this subtree. */
  config?: MatPaginatorConfig;
  /** REPLACES the whole `MatPaginatorIntl` string bag for every `MatPaginator` in this subtree
   *  — a consumer supplies every field, not a per-field fallback merge (see
   *  `paginator-intl.ts`'s module doc comment). */
  intl?: MatPaginatorIntl;
}

/**
 * Provides {@link MAT_PAGINATOR_CONFIG} and {@link MAT_PAGINATOR_INTL} for this subtree — call
 * once near the root (or anywhere deeper, to override just that part of the tree) so every
 * `MatPaginator` descendant resolves its config/strings from `providerConfig` instead of the
 * hardcoded fallbacks ({@link DEFAULT_PAGINATOR_INTL} for `intl`). Only these two contexts are
 * provided; every other qwik-material configuration context stays whatever an ancestor (or
 * nothing) already provided.
 */
export function useMatPaginatorProvider(providerConfig?: MatPaginatorProviderConfig): void {
  useContextProvider(MAT_PAGINATOR_CONFIG, providerConfig?.config ?? {});
  useContextProvider(MAT_PAGINATOR_INTL, providerConfig?.intl ?? DEFAULT_PAGINATOR_INTL);
}
