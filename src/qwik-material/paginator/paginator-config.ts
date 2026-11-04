import {createContextId} from '@qwik.dev/core';
import type {MatFormFieldAppearance} from '../form-field/form-field-config';

/**
 * Qwik-port equivalent of upstream `MatPaginatorDefaultOptions` +
 * `MAT_PAGINATOR_DEFAULT_OPTIONS` (`src/material/paginator/paginator.ts`). Consumers provide this
 * via `useMatPaginatorProvider({config: {...}})`. Unlike `MatPaginatorIntl` (see
 * `paginator-intl.ts`), this merges field-by-field with each `<MatPaginator>` instance's own props
 * (`props.x ?? config.x ?? <upstream's own hardcoded default>`), same convention as
 * `MatCheckboxConfig`/`MatFormFieldConfig`/etc.
 *
 * No scenario in the parity contract provides this token — every page-size `<mat-form-field>` is
 * therefore OUTLINE appearance (see `mat-paginator.tsx`'s own doc comment and
 * `src/dev-app/qwik-parity/paginator.ts`'s header), the same default `formFieldAppearance ||
 * 'outline'` upstream's constructor falls back to when no options are injected at all.
 */
export interface MatPaginatorConfig {
  /** Number of items to display on a page. Upstream default: 50 (`DEFAULT_PAGE_SIZE`). */
  pageSize?: number;
  /** The set of provided page size options to display to the user. Upstream default: `[]`. */
  pageSizeOptions?: number[];
  /** Whether to hide the page size selection UI from the user. Upstream default: `false`. */
  hidePageSize?: boolean;
  /** Whether to show the first/last buttons UI to the user. Upstream default: `false`. */
  showFirstLastButtons?: boolean;
  /** The default form-field appearance to apply to the page size options selector. Upstream
   *  default (when this whole token isn't provided): `'outline'`. */
  formFieldAppearance?: MatFormFieldAppearance;
}

/**
 * Context id used by `MatPaginator` to read config. The id string is exposed publicly and MUST
 * remain stable across releases.
 */
export const MAT_PAGINATOR_CONFIG = createContextId<MatPaginatorConfig>(
  'qwikMaterial/paginatorConfig',
);
