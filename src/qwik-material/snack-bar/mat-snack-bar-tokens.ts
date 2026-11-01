import {createContextId, type NoSerialize} from '@qwik.dev/core';
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
 * `openFromTemplate()` config. Provided by
 * `<QwikMaterialProvider matSnackBarDefaults={…}>`. Optional; defaults to {}.
 */
export const MAT_SNACK_BAR_DEFAULT_OPTIONS = createContextId<Partial<MatSnackBarConfig>>(
  'qwikMaterial/snackBarDefaultOptions',
);

/**
 * The MatSnackBarRef for the currently rendering snack bar. Provided by the
 * internal wrapper component; consumed by content components (e.g.
 * `SimpleSnackBar`, or any custom content passed to `openFromComponent$`)
 * that need to call `ref.dismissWithAction()` imperatively.
 */
export const MAT_SNACK_BAR_REF = createContextId<NoSerialize<MatSnackBarRef> | undefined>(
  'qwikMaterial/snackBarRef',
);
