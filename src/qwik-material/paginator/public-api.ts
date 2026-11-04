// Public API for @angular-community/qwik-material/paginator.
// See docs/superpowers/specs/2026-10-27-qwik-material-dom-parity-remediation-design.md
// and paginator/SYNC.md.

export {
  MatPaginator,
  type MatPaginatorProps,
  type MatPaginatorSelectConfig,
  type MatPaginatorColor,
} from './mat-paginator';
export {PaginatorNavButton, type PaginatorNavButtonProps} from './paginator-nav-button';

export type {MatPaginatorConfig} from './paginator-config';
export {MAT_PAGINATOR_CONFIG} from './paginator-config';

export type {MatPaginatorIntl} from './paginator-intl';
export {MAT_PAGINATOR_INTL, DEFAULT_PAGINATOR_INTL} from './paginator-intl';

export {
  useMatPaginatorProvider,
  type MatPaginatorProviderConfig,
} from './use-mat-paginator-provider';

export {
  DEFAULT_PAGE_SIZE,
  computeChangedPageIndex,
  computeDisplayedPageSizeOptions,
  defaultRangeLabel,
  getNumberOfPages,
  hasNextPage,
  hasPreviousPage,
  nextButtonsDisabled,
  normalizeLength,
  normalizePageIndex,
  normalizePageSize,
  previousButtonsDisabled,
  resolveInitialPageSize,
  type PageEvent,
} from './paginator-math';
