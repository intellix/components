import {
  $,
  component$,
  Slot,
  useContextProvider,
  useSignal,
  useVisibleTask$,
  type NoSerialize,
} from '@qwik.dev/core';
import {createPlatform, useIdGenerator} from '@angular-community/qwik-cdk/a11y';
import type {MatSnackBarConfig} from './snack-bar-config';
import {MAT_SNACK_BAR_DATA, MAT_SNACK_BAR_REF} from './mat-snack-bar-tokens';
import {
  MARK_DISMISSED,
  MARK_OPENED,
  REGISTER_EXIT_HANDLER,
  type MatSnackBarRef,
} from './mat-snack-bar-ref';
import {useAnimationsDisabled} from '../dialog/use-animations-disabled';

const ENTER_ANIMATION = '_mat-snack-bar-enter';
const EXIT_ANIMATION = '_mat-snack-bar-exit';

/** The number of milliseconds to wait before announcing the snack bar's content. */
const ANNOUNCE_DELAY = 150;

export interface MatSnackBarContainerProps {
  /** Merged config for this snack bar. Plain object (spread — never a class instance) so Qwik can serialise props cleanly. */
  config: Partial<MatSnackBarConfig>;
  /** The consumer-facing ref for this snack bar. NoSerialize because it holds Promise resolvers. */
  snackBarRef: NoSerialize<MatSnackBarRef> | undefined;
}

/**
 * Qwik port of `src/material/snack-bar/snack-bar-container.ts` +
 * `snack-bar-container.html`.
 *
 * Simplification vs. upstream (see SYNC.md): upstream's `_animationState`
 * has three values (`'void'` → `'visible'` → `'hidden'`), with `'void'`
 * painted only for the brief window before `MatSnackBar._attach()`
 * synchronously calls `containerInstance.enter()`. This port's service
 * (`mat-snack-bar.tsx`) only ever mounts this container at the moment it's
 * actually ready to enter (deferring the WHOLE mount, not just `enter()`,
 * while a previous snack bar's exit is still pending — see its "replace"
 * path) — so `'void'` is never an observable state here and isn't modeled;
 * the container always mounts already-entering (`exiting` signal below is
 * `false` → `-enter` class; `true` → `-exit` class).
 *
 * The 200ms JS fallback timer upstream uses in case the real CSS animation
 * fails to fire (`* { animation: none !important }` apps) is not ported —
 * out of scope; `[MARK_OPENED]`/`[MARK_DISMISSED]` are driven purely by the
 * real `animationend`/`animationcancel` events (or, when animations are
 * disabled via `<QwikMaterialProvider animationsDisabled>`, by an immediate
 * microtask) — see SYNC.md.
 */
export const MatSnackBarContainer = component$<MatSnackBarContainerProps>(
  ({config, snackBarRef}) => {
    const hostRef = useSignal<HTMLElement>();
    const labelRef = useSignal<HTMLElement>();
    const animationsDisabled = useAnimationsDisabled();
    const idGen = useIdGenerator();
    // Matches upstream's `readonly _liveElementId = inject(_IdGenerator).getId(...)`
    // field initializer, which runs once at construction.
    const liveElementId = useSignal(() => idGen.getId('mat-snack-bar-container-live-'));

    /** `true` once the exit animation has been requested (upstream's `_animationState === 'hidden'`). */
    const exiting = useSignal(false);
    /** `true` once the ~150ms screen-reader-announce move has happened. */
    const announced = useSignal(false);
    /** Computed once on mount: does the attached content already carry its own `.mdc-snackbar__label`? */
    const hasOwnLabelClass = useSignal(false);

    // Timer ids shared between the mount-time task, the exit handler
    // (registered synchronously below), and the animationend/cancel QRL —
    // plain closures and signals, not cross-$()-boundary locals.
    const announceTimeoutId = useSignal<number>();
    // Upstream's 200ms enter/exit fallbacks (`_enterFallback`/`_exitFallback`):
    // if the CSS animation doesn't finish in time the container is marked
    // opened/dismissed anyway, and on enter gains `mat-snack-bar-fallback-visible`.
    const enterFallbackId = useSignal<number>();
    const exitFallbackId = useSignal<number>();
    const fallbackVisible = useSignal(false);
    const opened = useSignal(false);
    const dismissed = useSignal(false);

    // Matches upstream's constructor: `_live`/`_role` computed once from the
    // (immutable, already-merged) config — pure, no need to recompute per
    // render beyond what re-running the component body already does for free.
    let live: 'polite' | 'assertive' | 'off';
    if (config.politeness === 'assertive' && !config.announcementMessage) {
      live = 'assertive';
    } else if (config.politeness === 'off') {
      live = 'off';
    } else {
      live = 'polite';
    }
    // Only set role for Firefox — see upstream's own comment: setting role
    // based on aria-live (rather than unconditionally) avoids
    // role="alert" implying aria-live="assertive" when aria-live is "polite".
    const platform = createPlatform();
    let role: 'status' | 'alert' | undefined;
    if (platform.FIREFOX) {
      if (live === 'polite') role = 'status';
      if (live === 'assertive') role = 'alert';
    }

    useContextProvider(MAT_SNACK_BAR_REF, snackBarRef);
    useContextProvider(MAT_SNACK_BAR_DATA, config.data);

    // Registered synchronously (not inside useVisibleTask$): `dismiss()` can
    // only ever be called from a descendant's click handler, and descendants
    // always render after this component's own body has already run — see
    // qwik-material/dialog's `REGISTER_CLOSE_HANDLER` for the identical
    // pattern and its doc comment for why useVisibleTask$ ordering can't be
    // relied on for this instead.
    snackBarRef?.[REGISTER_EXIT_HANDLER](() => {
      // The ref re-invokes this on every re-registration (i.e. every render)
      // once exit was requested; run it once, or the timer-id write below
      // re-renders and loops forever.
      if (exiting.value) return;
      exiting.value = true;
      clearTimeout(announceTimeoutId.value);
      const markDismissed = () => {
        if (dismissed.value) return;
        dismissed.value = true;
        snackBarRef[MARK_DISMISSED]();
      };
      if (animationsDisabled.value) {
        queueMicrotask(markDismissed);
      } else {
        clearTimeout(exitFallbackId.value);
        exitFallbackId.value = setTimeout(markDismissed, 200) as unknown as number;
      }
      // Otherwise a real `animationend`/`animationcancel` (onAnimationDone$) may complete it first.
    });

    useVisibleTask$(({cleanup}) => {
      // _afterPortalAttached(): does the attached content already contain an
      // element with class `mdc-snackbar__label`? If so, this component's own
      // label wrapper must NOT also carry that class.
      if (labelRef.value) {
        hasOwnLabelClass.value = !!labelRef.value.querySelector('.mdc-snackbar__label');
      }

      if (animationsDisabled.value) {
        queueMicrotask(() => {
          opened.value = true;
          snackBarRef?.[MARK_OPENED]();
        });
      } else {
        clearTimeout(enterFallbackId.value);
        enterFallbackId.value = setTimeout(() => {
          // The snack bar stays invisible if it fails to animate (e.g. an app
          // with `* {animation: none !important}`); upstream adds this class.
          fallbackVisible.value = true;
          if (!opened.value) {
            opened.value = true;
            snackBarRef?.[MARK_OPENED]();
          }
        }, 200) as unknown as number;
      }

      // _screenReaderAnnounce(): independent of animation state/duration —
      // always starts this plain timer once.
      announceTimeoutId.value = setTimeout(() => {
        announced.value = true;
      }, ANNOUNCE_DELAY) as unknown as number;

      cleanup(() => {
        clearTimeout(announceTimeoutId.value);
        clearTimeout(enterFallbackId.value);
        clearTimeout(exitFallbackId.value);
      });
    });

    const onAnimationDone$ = $((event: AnimationEvent) => {
      if (event.animationName === EXIT_ANIMATION) {
        clearTimeout(exitFallbackId.value);
        if (!dismissed.value) {
          dismissed.value = true;
          snackBarRef?.[MARK_DISMISSED]();
        }
      } else if (event.animationName === ENTER_ANIMATION) {
        clearTimeout(enterFallbackId.value);
        if (!opened.value) {
          opened.value = true;
          snackBarRef?.[MARK_OPENED]();
        }
      }
    });

    const panelClasses = config.panelClass
      ? Array.isArray(config.panelClass)
        ? config.panelClass
        : [config.panelClass]
      : [];

    const cls = [
      'mdc-snackbar',
      'mat-mdc-snack-bar-container',
      !exiting.value && 'mat-snack-bar-container-enter',
      exiting.value && 'mat-snack-bar-container-exit',
      !animationsDisabled.value && 'mat-snack-bar-container-animations-enabled',
      fallbackVisible.value && 'mat-snack-bar-fallback-visible',
      ...panelClasses,
    ]
      .filter(Boolean)
      .join(' ');

    const labelClasses = [
      'mat-mdc-snack-bar-label',
      !hasOwnLabelClass.value && 'mdc-snackbar__label',
    ]
      .filter(Boolean)
      .join(' ');

    return (
      <mat-snack-bar-container
        ref={hostRef}
        class={cls}
        mat-exit={exiting.value ? '' : undefined}
        onAnimationEnd$={onAnimationDone$}
        onAnimationcancel$={onAnimationDone$}
      >
        <div class="mdc-snackbar__surface mat-mdc-snackbar-surface">
          <div ref={labelRef} class={labelClasses}>
            {announced.value ? (
              <div aria-live={live} role={role} id={liveElementId.value}>
                <div>
                  <Slot />
                </div>
              </div>
            ) : (
              <>
                <div aria-hidden="true">
                  <Slot />
                </div>
                <div aria-live={live} role={role} id={liveElementId.value}></div>
              </>
            )}
          </div>
        </div>
      </mat-snack-bar-container>
    );
  },
);
