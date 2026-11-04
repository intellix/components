import {createContextId, type NoSerialize, type Signal} from '@qwik.dev/core';
import type {ScrollStrategyDescriptor} from '@angular-community/qwik-cdk/overlay';
import type {MatDialogConfig} from './mat-dialog-config';
import type {MatDialogRef} from './mat-dialog-ref';

/**
 * Data injected into the dialog body component. Set by config.data at open()
 * time; the container provides it. Consumers read via
 * `const data = useContext(MAT_DIALOG_DATA) as MyShape;`.
 */
export const MAT_DIALOG_DATA = createContextId<unknown>('qwikMaterial/dialogData');

/**
 * Default options merged into every open() config. Provided by
 * `useMatDialogProvider({defaults: …})`. Optional; defaults to {}.
 */
export const MAT_DIALOG_DEFAULT_OPTIONS = createContextId<Partial<MatDialogConfig>>(
  'qwikMaterial/dialogDefaultOptions',
);

/**
 * Default `ScrollStrategy` descriptor for dialogs that don't specify their
 * own. Provided by `useMatDialogProvider({scrollStrategy: …})`.
 * Default: `'block'` (upstream's own `MAT_DIALOG_SCROLL_STRATEGY` default).
 *
 * A plain, serializable `ScrollStrategyDescriptor` — NOT a function
 * factory. A factory function read via `useContext()` here and captured
 * into `useMatDialog().open$`'s QRL doesn't survive a real SSR→CSR resume
 * (confirmed live — see `qwik-material/dialog/SYNC.md`'s "scroll strategy
 * lost after resume" entry for the full incident writeup); a descriptor,
 * being plain data, survives the SAME capture-and-resume trip the same way
 * any other config value does.
 */
export const MAT_DIALOG_SCROLL_STRATEGY = createContextId<ScrollStrategyDescriptor>(
  'qwikMaterial/dialogScrollStrategy',
);

/**
 * The MatDialogRef for the currently rendering dialog. Provided by
 * MatDialogContainer; consumed by MatDialogClose and by the consumer's dialog
 * body if it needs to call ref.close() imperatively.
 */
export const MAT_DIALOG_REF = createContextId<NoSerialize<MatDialogRef>>('qwikMaterial/dialogRef');

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
  'qwikMaterial/dialogContainerApi',
);

/**
 * Boolean Signal that disables all animations when true. Provided by
 * `useMatAnimationsProvider(…)`. Optional; the container
 * falls back to a frozen `{value: false}` shim when absent.
 */
export const MAT_ANIMATIONS_DISABLED = createContextId<Signal<boolean>>(
  'qwikMaterial/animationsDisabled',
);
