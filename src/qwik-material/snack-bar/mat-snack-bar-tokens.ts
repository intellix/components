import {createContextId, useContextProvider, type NoSerialize} from '@qwik.dev/core';
import type {MatSnackBarConfig} from './snack-bar-config';
import type {MatSnackBarRef} from './mat-snack-bar-ref';

/**
 * Data injected into the snack bar's content component/body. Set by
 * `config.data` at open time; the wrapper provides it. Consumers read via
 * `const data = useContext(MAT_SNACK_BAR_DATA) as MyShape;` — mirrors
 * `qwik-material/dialog`'s `MAT_DIALOG_DATA`.
 */
export const MAT_SNACK_BAR_DATA = createContextId<unknown>('qwikMaterial/snackBarData');

/**
 * Default options merged into every `open()`/`openFromComponent()`/
 * `openFromTemplate()` config. Provided by `useMatSnackBarProvider({…})`.
 * Optional; defaults to {}.
 */
export const MAT_SNACK_BAR_DEFAULT_OPTIONS = createContextId<Partial<MatSnackBarConfig>>(
  'qwikMaterial/snackBarDefaultOptions',
);

/**
 * Provides {@link MAT_SNACK_BAR_DEFAULT_OPTIONS} for this subtree — call once near the root
 * (or anywhere deeper, to override just that part of the tree) so every
 * `useMatSnackBar().open()`/`openFromComponent()`/`openFromTemplate()` call in this subtree
 * merges `defaults` in. Only this one context is provided; every other qwik-material
 * configuration context stays whatever an ancestor (or nothing) already provided.
 */
export function useMatSnackBarProvider(defaults?: Partial<MatSnackBarConfig>): void {
  useContextProvider(MAT_SNACK_BAR_DEFAULT_OPTIONS, defaults ?? {});
}

/**
 * The MatSnackBarRef for the currently rendering snack bar. Provided by the
 * internal wrapper component; consumed by content components (e.g.
 * `SimpleSnackBar`, or any custom content passed to `openFromComponent$`)
 * that need to call `ref.dismissWithAction()` imperatively.
 */
export const MAT_SNACK_BAR_REF = createContextId<NoSerialize<MatSnackBarRef> | undefined>(
  'qwikMaterial/snackBarRef',
);
