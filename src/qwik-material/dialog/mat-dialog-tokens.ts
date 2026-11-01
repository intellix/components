import {createContextId, type NoSerialize, type Signal} from '@qwik.dev/core';
import type {ScrollStrategy} from '@angular-community/qwik-cdk/overlay';
import type {MatDialogConfig} from './mat-dialog-config';
import type {MatDialogRef} from './mat-dialog-ref';

/**
 * Data injected into the dialog body component. Set by config.data at open()
 * time; the container provides it. Consumers read via
 * `const data = useContext(MAT_DIALOG_DATA) as MyShape;`.
 */
export const MAT_DIALOG_DATA = createContextId<unknown>('qwik-material/dialog-data');

/**
 * Default options merged into every open() config. Provided by
 * <QwikMaterialProvider matDialogDefaults={…}>. Optional; defaults to {}.
 */
export const MAT_DIALOG_DEFAULT_OPTIONS = createContextId<Partial<MatDialogConfig>>(
  'qwik-material/dialog-default-options',
);

/**
 * Factory that returns the default ScrollStrategy for dialogs that don't
 * specify one. Provided by <QwikMaterialProvider matDialogScrollStrategyFactory={…}>.
 * Default: createBlockScrollStrategy() from qwik-cdk.
 */
export const MAT_DIALOG_SCROLL_STRATEGY = createContextId<NoSerialize<() => ScrollStrategy>>(
  'qwik-material/dialog-scroll-strategy',
);

/**
 * The MatDialogRef for the currently rendering dialog. Provided by
 * MatDialogContainer; consumed by MatDialogClose and by the consumer's dialog
 * body if it needs to call ref.close() imperatively.
 */
export const MAT_DIALOG_REF = createContextId<NoSerialize<MatDialogRef>>(
  'qwik-material/dialog-ref',
);

/**
 * Internal API surface the container provides so its own descendants
 * (MatDialogTitle, MatDialogActions) can register ids / action counts.
 */
export interface MatDialogContainerApi {
  registerTitleId$: import('@qwik.dev/core').QRL<(id: string) => void>;
  unregisterTitleId$: import('@qwik.dev/core').QRL<(id: string) => void>;
  incrementActionSectionCount$: import('@qwik.dev/core').QRL<() => void>;
  decrementActionSectionCount$: import('@qwik.dev/core').QRL<() => void>;
}
export const MAT_DIALOG_CONTAINER = createContextId<MatDialogContainerApi>(
  'qwik-material/dialog-container-api',
);

/**
 * Boolean Signal that disables all animations when true. Provided by
 * <QwikMaterialProvider animationsDisabled={…}>. Optional; the container
 * falls back to a frozen `{value: false}` shim when absent.
 */
export const MAT_ANIMATIONS_DISABLED = createContextId<Signal<boolean>>(
  'qwik-material/animations-disabled',
);
