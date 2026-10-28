import {component$, Slot, useSignal, useVisibleTask$, type NoSerialize} from '@builder.io/qwik';
import {useFocusTrap} from '@angular-community/qwik-cdk/a11y';
import {Breakpoints, observeBreakpoints} from '@angular-community/qwik-cdk/layout';
import type {MatBottomSheetConfig} from './mat-bottom-sheet-config';
import {
  MARK_CLOSED,
  MARK_OPENED,
  REGISTER_ANIMATION_HANDLERS,
  type MatBottomSheetRef,
} from './mat-bottom-sheet-ref';
import {useAnimationsDisabled} from '../dialog/use-animations-disabled';
// @ts-expect-error - side-effect scss import; bundled by Vite
import './../scss/bottom-sheet/bottom-sheet-container.scss';

/** Keyframe names declared in bottom-sheet-container.scss — matched against real `animation*` events. */
const ENTER_ANIMATION = '_mat-bottom-sheet-enter';
const EXIT_ANIMATION = '_mat-bottom-sheet-exit';

export interface MatBottomSheetContainerProps {
  /** Auto-generated `cdk-dialog-N` id for this sheet (see mat-bottom-sheet.tsx — upstream `MatBottomSheetConfig` has no `id` field, so this is threaded separately rather than smuggled into `config`). */
  id: string;
  /** Merged MatBottomSheetConfig for this sheet. Passed as a plain object (spread — never a class instance) so Qwik can serialise props cleanly. */
  config: Partial<MatBottomSheetConfig>;
  /** The consumer-facing MatBottomSheetRef for this sheet. Wrapped in NoSerialize because it holds Promise resolvers. */
  matBottomSheetRef: NoSerialize<MatBottomSheetRef> | undefined;
}

/**
 * Internal component wrapping user-provided bottom sheet content. Mirrors
 * upstream `MatBottomSheetContainer extends CdkDialogContainer` via JSX
 * composition instead of inheritance (same pattern as
 * `qwik-material/dialog`'s `MatDialogContainer`): the host element below
 * carries BOTH this component's own class (`mat-bottom-sheet-container`) and
 * the base class `CdkDialogContainer` contributes (`cdk-dialog-container`),
 * since Angular merges both components' host class bindings onto the same
 * native element.
 *
 * Unlike `MatDialogContainer`, there is no inner `mat-mdc-dialog-*` wrapper
 * markup — upstream's own template (`bottom-sheet-container.html`) is just
 * `<ng-template cdkPortalOutlet></ng-template>`, so the content portal is
 * the container's only child.
 */
export const MatBottomSheetContainer = component$<MatBottomSheetContainerProps>(
  ({id, config, matBottomSheetRef}) => {
    const hostRef = useSignal<HTMLElement>();
    // Mirrors upstream's `_animationState: 'void' | 'visible' | 'hidden'` —
    // a 3-state enum, not independently-toggled transient classes like
    // MatDialogContainer's MDC opening/open/closing flags: once `enter()`
    // runs the `-enter` class stays applied for the sheet's entire open
    // lifetime (CSS `animation-fill-mode: forwards`), only flipping to
    // `-exit` on `exit()`.
    const animationState = useSignal<'void' | 'visible' | 'hidden'>('void');
    const animationsDisabled = useAnimationsDisabled();
    const breakpoints = useSignal<{medium: boolean; large: boolean; xlarge: boolean}>({
      medium: false,
      large: false,
      xlarge: false,
    });

    // Mirrors `CdkDialogContainer._initializeFocusTrap()`: unconditional,
    // eager anchor attachment — not specific to a non-default `autoFocus`.
    // `preventScroll` on the initial focus move (upstream's `_trapFocus()`
    // override) is not reproduced; it has no DOM-structure effect, only
    // page-scroll behavior.
    useFocusTrap(hostRef, {
      autoFocus: config.autoFocus ?? 'first-tabbable',
      restoreFocus: config.restoreFocus !== false,
    });

    useVisibleTask$(({cleanup}) => {
      const host = hostRef.value;
      if (!host) return;

      const unsubscribeBreakpoints = observeBreakpoints(
        [Breakpoints.Medium, Breakpoints.Large, Breakpoints.XLarge],
        state => {
          breakpoints.value = {
            medium: state.breakpoints[Breakpoints.Medium] ?? false,
            large: state.breakpoints[Breakpoints.Large] ?? false,
            xlarge: state.breakpoints[Breakpoints.XLarge] ?? false,
          };
        },
      );

      let destroyed = false;
      const timers: Array<ReturnType<typeof setTimeout>> = [];

      // Mirrors `_handleAnimationEvent()`: only react to the enter/exit
      // keyframes landing on THIS element (not a descendant's own animation).
      // Declared as a `const` arrow function (not a function declaration)
      // so TypeScript keeps `host`'s `if (!host) return;`-narrowed
      // `HTMLElement` type inside this closure.
      const handleAnimationEvent = (
        isStart: boolean,
        animationName: string,
        target: EventTarget | null,
      ) => {
        if (target !== host) return;
        const isEnter = animationName === ENTER_ANIMATION;
        const isExit = animationName === EXIT_ANIMATION;
        if (!isEnter && !isExit) return;
        if (!isStart) {
          if (isEnter) matBottomSheetRef?.[MARK_OPENED]();
          else matBottomSheetRef?.[MARK_CLOSED]();
        }
      };

      // Mirrors `_simulateAnimation()`: when animations are globally
      // disabled, there's no real CSS animation to wait on — fire the
      // start/done pair directly (done on a 0ms timer, matching upstream's
      // `_ngZone.run` + nested `setTimeout`).
      const simulateAnimation = (name: typeof ENTER_ANIMATION | typeof EXIT_ANIMATION) => {
        handleAnimationEvent(true, name, host);
        timers.push(setTimeout(() => handleAnimationEvent(false, name, host), 0));
      };

      const onAnimationStart = (e: AnimationEvent) =>
        handleAnimationEvent(true, e.animationName, e.target);
      const onAnimationEnd = (e: AnimationEvent) =>
        handleAnimationEvent(false, e.animationName, e.target);
      host.addEventListener('animationstart', onAnimationStart);
      host.addEventListener('animationend', onAnimationEnd);
      host.addEventListener('animationcancel', onAnimationEnd);

      // Registers the real enter()/exit() triggers — see
      // REGISTER_ANIMATION_HANDLERS's doc comment in mat-bottom-sheet-ref.ts.
      matBottomSheetRef?.[REGISTER_ANIMATION_HANDLERS]({
        enter() {
          if (destroyed) return;
          animationState.value = 'visible';
          if (animationsDisabled.value) simulateAnimation(ENTER_ANIMATION);
        },
        exit() {
          if (destroyed) return;
          // Mirrors upstream `exit()`: a bare `setAttribute()` call,
          // synchronously, before the `-exit` class even lands via Qwik's
          // own render flush.
          host.setAttribute('mat-exit', '');
          animationState.value = 'hidden';
          if (animationsDisabled.value) simulateAnimation(EXIT_ANIMATION);
        },
      });

      cleanup(() => {
        destroyed = true;
        unsubscribeBreakpoints();
        host.removeEventListener('animationstart', onAnimationStart);
        host.removeEventListener('animationend', onAnimationEnd);
        host.removeEventListener('animationcancel', onAnimationEnd);
        timers.forEach(clearTimeout);
      });
    });

    const cls = [
      'mat-bottom-sheet-container',
      // CdkDialogContainer's own host class — MatBottomSheetContainer
      // extends it upstream, so Angular merges both components' host
      // classes onto the same element.
      'cdk-dialog-container',
      !animationsDisabled.value && 'mat-bottom-sheet-container-animations-enabled',
      animationState.value === 'visible' && 'mat-bottom-sheet-container-enter',
      animationState.value === 'hidden' && 'mat-bottom-sheet-container-exit',
      breakpoints.value.medium && 'mat-bottom-sheet-container-medium',
      breakpoints.value.large && 'mat-bottom-sheet-container-large',
      breakpoints.value.xlarge && 'mat-bottom-sheet-container-xlarge',
    ]
      .filter(Boolean)
      .join(' ');

    return (
      <mat-bottom-sheet-container
        ref={hostRef}
        class={cls}
        tabIndex={-1}
        // Mirrors upstream `_config.role`: the base `DialogConfig`'s own
        // default ('dialog'), since `MatBottomSheetConfig` has no `role`
        // field of its own and no scenario (nor this port's public API) can
        // override it.
        role="dialog"
        aria-modal={(config.ariaModal ?? false) ? 'true' : 'false'}
        aria-label={config.ariaLabel ?? undefined}
        id={id}
      >
        <Slot />
      </mat-bottom-sheet-container>
    );
  },
);
