import {
  $,
  component$,
  Slot,
  useContextProvider,
  useSignal,
  useStore,
  useVisibleTask$,
  type NoSerialize,
} from '@qwik.dev/core';
import {useFocusTrap} from '@angular-community/qwik-cdk/a11y';
import type {MatDialogConfig} from './mat-dialog-config';
import {
  MAT_DIALOG_CONTAINER,
  MAT_DIALOG_DATA,
  MAT_DIALOG_REF,
  type MatDialogContainerApi,
} from './mat-dialog-tokens';
import {
  MARK_CLOSED,
  MARK_OPENED,
  REGISTER_CLOSE_HANDLER,
  type MatDialogRef,
} from './mat-dialog-ref';
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
  const hostRef = useSignal<HTMLElement>();
  // Mirrors upstream's independent class toggles exactly (NOT a single
  // mutually-exclusive phase): `_startOpenAnimation()` adds `--opening` and
  // `--open` TOGETHER in the same rAF, then only removes `--opening` once
  // `enterMs` elapses — `--open` stays until `_startExitAnimation()` removes
  // it synchronously (before the exit rAF even runs). Getting the overlap
  // right matters: a parity snapshot taken immediately after a trigger click
  // (before the "settled" step) lands inside that overlap window on the
  // Angular side.
  const openingClass = useSignal(false);
  const openClass = useSignal(false);
  const closingClass = useSignal(false);
  // Only used for the `--mat-dialog-transition-duration` custom property.
  const transitionPhase = useSignal<'enter' | 'exit'>('enter');
  const animationsDisabled = useAnimationsDisabled();

  const enterMs = parseCssTime(config.enterAnimationDuration) ?? DEFAULT_ENTER_MS;
  const exitMs = parseCssTime(config.exitAnimationDuration) ?? DEFAULT_EXIT_MS;

  // Mirrors CdkDialogContainer's focus trap + autoFocus/restoreFocus handling
  // (MatDialogContainer extends CdkDialogContainer upstream).
  useFocusTrap(hostRef, {
    autoFocus: config.autoFocus ?? 'first-tabbable',
    restoreFocus: config.restoreFocus !== false,
  });

  // Titles register their auto-generated (or user-set) id here so the
  // container's host element can set aria-labelledby to the first entry.
  // Seeded from config.ariaLabelledBy, mirroring CdkDialogContainer's
  // constructor (`if (this._config.ariaLabelledBy) { this._ariaLabelledByQueue.push(...) }`).
  const titleIds = useStore<{list: readonly string[]}>({
    list: config.ariaLabelledBy ? [config.ariaLabelledBy] : [],
  });
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
  useContextProvider(MAT_DIALOG_REF, matDialogRef);
  useContextProvider(MAT_DIALOG_DATA, config.data);

  // Enter/exit animation state machine, matching `_startOpenAnimation()` /
  // `_startExitAnimation()` / `_clearAnimationClasses()` exactly. Also
  // installs the real exit-animation handler the ref's close() delegates to
  // — `matDialogRef.state` is a plain object, not a reactive Qwik signal
  // (it's constructed inside a QRL, where Qwik hooks can't run), so nothing
  // would ever observe a `state.value` write; close() must call into this
  // container directly instead. See REGISTER_CLOSE_HANDLER's doc comment in
  // mat-dialog-ref.ts.
  useVisibleTask$(({cleanup}) => {
    const timers: Array<ReturnType<typeof setTimeout>> = [];
    const frames: number[] = [];

    matDialogRef?.[REGISTER_CLOSE_HANDLER](() => {
      // _startExitAnimation(): removes --open synchronously, before the
      // exit rAF even runs.
      openClass.value = false;
      if (animationsDisabled.value) {
        // Promise.resolve().then(() => this._finishDialogClose())
        timers.push(
          setTimeout(() => {
            matDialogRef[MARK_CLOSED]();
          }, 0),
        );
        return;
      }
      transitionPhase.value = 'exit';
      frames.push(
        requestAnimationFrame(() => {
          closingClass.value = true;
          // Scheduled from INSIDE the rAF callback, not in parallel with it (see the matching
          // comment on the open side below) — with `exitMs === 0`, a `setTimeout` queued
          // alongside `requestAnimationFrame` can fire before the rAF callback runs at all
          // (macrotask vs. next-frame ordering is not guaranteed either way), clearing
          // `closingClass` before it was ever set and leaving nothing to clear the LATER write.
          // Nesting guarantees `closingClass.value = false` always runs after `= true`.
          timers.push(
            setTimeout(() => {
              closingClass.value = false; // _clearAnimationClasses()
              matDialogRef[MARK_CLOSED]();
            }, exitMs),
          );
        }),
      );
    });

    // _startOpenAnimation()
    if (animationsDisabled.value) {
      openClass.value = true;
      matDialogRef?.[MARK_OPENED]();
      return;
    }
    frames.push(
      requestAnimationFrame(() => {
        openingClass.value = true;
        openClass.value = true;
        // Scheduled from INSIDE the rAF callback (found live, 2026-11-02, porting the
        // `dialog-animations` docs example's `enterAnimationDuration: '0ms'` variant): a
        // `setTimeout(fn, 0)` queued in parallel with this `requestAnimationFrame` is a
        // macrotask that can run BEFORE the rAF callback fires (rAF runs at the next repaint,
        // which is not guaranteed to be ordered before a 0ms timeout) — when it does,
        // `openingClass.value = false` clears a class that `= true` hasn't been written yet,
        // and the rAF's LATER `= true` write then has nothing left to ever clear it, leaving
        // `mdc-dialog--opening` stuck forever. Nesting the timer inside the rAF callback
        // guarantees the open write always happens first, for any `enterMs` including 0.
        timers.push(
          setTimeout(() => {
            openingClass.value = false; // _clearAnimationClasses()
            matDialogRef?.[MARK_OPENED]();
          }, enterMs),
        );
      }),
    );

    cleanup(() => {
      timers.forEach(clearTimeout);
      frames.forEach(cancelAnimationFrame);
    });
  });

  const ariaLabelledBy = config.ariaLabel ? null : (titleIds.list[0] ?? null);

  // Matches the opening/closing transition-duration custom property Angular
  // sets via `this._hostElement.style.setProperty(...)` in
  // `_startOpenAnimation()` / `_startExitAnimation()` — only while animations
  // are enabled.
  const transitionDuration = animationsDisabled.value
    ? undefined
    : `${transitionPhase.value === 'exit' ? exitMs : enterMs}ms`;

  const cls = [
    'mat-mdc-dialog-container',
    'mdc-dialog',
    // CdkDialogContainer's own host class — MatDialogContainer extends it
    // upstream, so Angular merges both components' host classes onto the
    // same element.
    'cdk-dialog-container',
    openingClass.value && OPENING_CLASS,
    openClass.value && OPEN_CLASS,
    closingClass.value && CLOSING_CLASS,
    animationsDisabled.value && '_mat-animation-noopable',
    actionSectionCount.value > 0 && 'mat-mdc-dialog-container-with-actions',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <mat-dialog-container
      ref={hostRef}
      class={cls}
      tabIndex={-1}
      role={config.role ?? 'dialog'}
      aria-modal={(config.ariaModal ?? false) ? 'true' : 'false'}
      aria-label={config.ariaLabel ?? undefined}
      aria-labelledby={ariaLabelledBy ?? undefined}
      aria-describedby={config.ariaDescribedBy ?? undefined}
      id={config.id ?? undefined}
      style={transitionDuration ? {'--mat-dialog-transition-duration': transitionDuration} : {}}
    >
      <div class="mat-mdc-dialog-inner-container mdc-dialog__container">
        <div class="mat-mdc-dialog-surface mdc-dialog__surface">
          <Slot />
        </div>
      </div>
    </mat-dialog-container>
  );
});
