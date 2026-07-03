import {
  $,
  component$,
  Slot,
  useContextProvider,
  useSignal,
  useStore,
  useTask$,
  useVisibleTask$,
  type NoSerialize,
} from '@builder.io/qwik';
import type {MatDialogConfig} from './mat-dialog-config';
import {
  MAT_DIALOG_CONTAINER,
  MAT_DIALOG_DATA,
  MAT_DIALOG_REF,
  type MatDialogContainerApi,
} from './mat-dialog-tokens';
import {MARK_CLOSED, MARK_OPENED, MatDialogState, type MatDialogRef} from './mat-dialog-ref';
import {parseCssTime} from './parse-css-time';
import {useAnimationsDisabled} from './use-animations-disabled';

/** MDC class prefixes. Toggled by the container's animation state machine. */
const OPENING_CLASS = 'mdc-dialog--opening';
const OPEN_CLASS = 'mdc-dialog--open';
const CLOSING_CLASS = 'mdc-dialog--closing';

/** Default durations matching Angular MatDialog exactly. */
const DEFAULT_ENTER_MS = 150;
const DEFAULT_EXIT_MS = 75;

export interface MatDialogContainerProps {
  /** Merged MatDialogConfig for this dialog. Passed as a plain object (spread — never a class instance) so Qwik can serialise props cleanly. */
  config: Partial<MatDialogConfig>;
  /** The consumer-facing MatDialogRef for this dialog. Wrapped in NoSerialize because it holds Promise resolvers. */
  matDialogRef: NoSerialize<MatDialogRef> | undefined;
}

export const MatDialogContainer = component$<MatDialogContainerProps>(({config, matDialogRef}) => {
  // Local state machine controls MDC class toggling.
  const phase = useSignal<'opening' | 'open' | 'closing' | 'closed'>('opening');
  const animationsDisabled = useAnimationsDisabled();

  const enterMs = parseCssTime(config.enterAnimationDuration) ?? DEFAULT_ENTER_MS;
  const exitMs = parseCssTime(config.exitAnimationDuration) ?? DEFAULT_EXIT_MS;

  // Titles register their auto-generated (or user-set) id here so the
  // container's host element can set aria-labelledby to the first entry.
  const titleIds = useStore<{list: readonly string[]}>({list: []});
  const actionSectionCount = useSignal(0);

  // Provide the internal container API for descendant content components.
  const containerApi: MatDialogContainerApi = {
    registerTitleId$: $((id: string) => {
      titleIds.list = [...titleIds.list, id];
    }),
    unregisterTitleId$: $((id: string) => {
      titleIds.list = titleIds.list.filter(x => x !== id);
    }),
    incrementActionSectionCount$: $(() => {
      actionSectionCount.value = actionSectionCount.value + 1;
    }),
    decrementActionSectionCount$: $(() => {
      actionSectionCount.value = Math.max(0, actionSectionCount.value - 1);
    }),
  };
  useContextProvider(MAT_DIALOG_CONTAINER, containerApi);

  // Provide the ref and data for descendants.
  if (matDialogRef) {
    useContextProvider(MAT_DIALOG_REF, matDialogRef);
  }
  useContextProvider(MAT_DIALOG_DATA, config.data);

  // Enter animation: opening → open after enterMs. Skip the timer if
  // animations are disabled.
  useVisibleTask$(({cleanup}) => {
    if (animationsDisabled.value) {
      phase.value = 'open';
      matDialogRef?.[MARK_OPENED]();
      return;
    }
    const t = setTimeout(() => {
      phase.value = 'open';
      matDialogRef?.[MARK_OPENED]();
    }, enterMs);
    cleanup(() => clearTimeout(t));
  });

  // Exit animation: track matDialogRef.state; when it transitions to CLOSING,
  // toggle the closing class, wait exitMs (or 0 if animations disabled), then
  // call [MARK_CLOSED] on the ref to resolve afterClosed and dispose the overlay.
  useTask$(({track, cleanup}) => {
    const s = track(() => matDialogRef?.state.value);
    if (s !== MatDialogState.CLOSING) return;
    phase.value = 'closing';
    const t = setTimeout(
      () => {
        phase.value = 'closed';
        matDialogRef?.[MARK_CLOSED]();
      },
      animationsDisabled.value ? 0 : exitMs,
    );
    cleanup(() => clearTimeout(t));
  });

  const ariaLabelledBy = config.ariaLabel ? null : (titleIds.list[0] ?? null);

  const cls = [
    'mat-mdc-dialog-container',
    'mdc-dialog',
    phase.value === 'opening' && OPENING_CLASS,
    phase.value === 'open' && OPEN_CLASS,
    phase.value === 'closing' && CLOSING_CLASS,
    animationsDisabled.value && '_mat-animation-noopable',
    actionSectionCount.value > 0 && 'mat-mdc-dialog-container-with-actions',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div
      class={cls}
      tabIndex={-1}
      role={config.role ?? 'dialog'}
      aria-modal={(config.ariaModal ?? true) ? 'true' : 'false'}
      aria-label={config.ariaLabel ?? undefined}
      aria-labelledby={ariaLabelledBy ?? undefined}
      aria-describedby={config.ariaDescribedBy ?? undefined}
      id={config.id ?? undefined}
    >
      <div class="mat-mdc-dialog-inner-container mdc-dialog__container">
        <div class="mat-mdc-dialog-surface mdc-dialog__surface">
          <Slot />
        </div>
      </div>
    </div>
  );
});
