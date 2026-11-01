import {
  $,
  component$,
  useSignal,
  useTask$,
  type JSXOutput,
  type QRL,
  type Signal,
} from '@qwik.dev/core';
import {isBrowser} from '@qwik.dev/core/build';
import type {MenuPositionX, MenuPositionY} from './menu-positions';

/** Name of the enter animation `@keyframes` (mirrors upstream `menu.ts`). */
const ENTER_ANIMATION = '_mat-menu-enter';
/** Name of the exit animation `@keyframes` (mirrors upstream `menu.ts`). */
const EXIT_ANIMATION = '_mat-menu-exit';
/**
 * Safety-net delay (ms) mirroring upstream's own defensive
 * `setTimeout(() => this._onAnimationDone(EXIT_ANIMATION), 200)` in
 * `_setIsOpen` — in case no `animationend` ever arrives (e.g. a global
 * `* { animation: none !important }` override).
 */
const EXIT_FALLBACK_MS = 200;

export interface MenuPanelProps {
  panelId: string;
  /** Already-resolved items JSX — see `menu-runtime.ts`'s `openMenu` doc comment for why this is resolved before the panel ever mounts, not inside it. */
  content: JSXOutput;
  /** Custom classes from `createMatMenu({panelClass: …})`, already split into an array. */
  panelClassList: readonly string[];
  /**
   * Static position classes. Deliberately NOT corrected against the
   * position strategy's actual resolved connection pair (unlike
   * `qwik-material/tooltip`'s `syncPositionClass`) — see menu/SYNC.md: every
   * parity scenario's preferred position always fits the viewport, so the
   * configured value and the resolved one are always the same.
   */
  xPositionClass: MenuPositionX;
  yPositionClass: MenuPositionY;
  animationsDisabled: boolean;
  /** Toggled by the opener: `true` once attached (plays the enter animation), `false` to start the exit animation. */
  isOpen: Signal<boolean>;
  ariaLabel?: string;
  ariaLabelledby?: string;
  ariaDescribedby?: string;
  /** Mirrors `(click)="closed.emit('click')"` on the panel's own root div. */
  onPanelClick$: QRL<() => void>;
  /** Called once the exit animation (or its fallback timer) completes — the opener detaches the overlay then. */
  onExitDone$: QRL<() => void>;
}

/**
 * Qwik port of `src/material/menu/menu.html` (the `.mat-mdc-menu-panel` div
 * and its `.mat-mdc-menu-content` child) — rendered via
 * `overlay.create(MenuPanel, props)` from `menu-runtime.ts`'s `openMenu`.
 * Mirrors the subset of `MatMenu` responsible for the panel's own classes
 * and the open/close (enter/exit) animation state machine; everything else
 * (key manager, position strategy, backdrop/outside-click/keyboard
 * dispatcher wiring, focus restore) lives in `menu-runtime.ts` /
 * `mat-menu-trigger.tsx` / `mat-menu-item.tsx`.
 */
export const MenuPanel = component$<MenuPanelProps>(props => {
  const panelRef = useSignal<HTMLElement>();
  // True while either the enter OR exit animation is actually in flight.
  // Starts `true`: every parity scenario confirms `mat-menu-panel-animating`
  // is present on a newly-opened panel from the very first observable
  // frame, not waiting for a round-tripped `animationstart` event — same
  // reasoning as `isOpen` starting the enter transition immediately.
  const isAnimating = useSignal(true);
  const exitTimer = useSignal<ReturnType<typeof setTimeout>>();

  // Drives the exit transition: once `isOpen` flips to `false`, the panel
  // re-renders with `mat-menu-panel-exit-animation` (CSS plays the exit
  // keyframe) and `mat-menu-panel-animating` (re-armed for the exit leg).
  // Mirrors upstream `_setIsOpen(false)`'s fallback-timer arm; the
  // `animationsDisabled` branch mirrors its synthetic immediate
  // `_onAnimationDone` call (no real `animationend` ever fires).
  useTask$(({track, cleanup}) => {
    const open = track(() => props.isOpen.value);
    if (open) return;
    isAnimating.value = true;
    if (!isBrowser) return;
    if (props.animationsDisabled) {
      const id = setTimeout(() => finishExit());
      cleanup(() => clearTimeout(id));
      return;
    }
    const id = setTimeout(() => finishExit(), EXIT_FALLBACK_MS);
    exitTimer.value = id;
    cleanup(() => clearTimeout(id));
  });

  const finishExit = $(() => {
    if (exitTimer.value != null) {
      clearTimeout(exitTimer.value);
      exitTimer.value = undefined;
    }
    isAnimating.value = false;
    props.onExitDone$();
  });

  const handleAnimationStart$ = $((event: AnimationEvent) => {
    if (event.animationName === ENTER_ANIMATION || event.animationName === EXIT_ANIMATION) {
      isAnimating.value = true;
    }
  });

  const handleAnimationEnd$ = $((event: AnimationEvent) => {
    if (event.animationName === EXIT_ANIMATION && !props.isOpen.value) {
      finishExit();
    } else if (event.animationName === ENTER_ANIMATION) {
      isAnimating.value = false;
    }
  });

  const classes = [
    'mat-mdc-menu-panel',
    ...props.panelClassList,
    props.xPositionClass === 'before' ? 'mat-menu-before' : 'mat-menu-after',
    props.yPositionClass === 'above' ? 'mat-menu-above' : 'mat-menu-below',
    props.animationsDisabled && 'mat-menu-panel-animations-disabled',
    !props.isOpen.value && 'mat-menu-panel-exit-animation',
    isAnimating.value && 'mat-menu-panel-animating',
  ].filter(Boolean) as string[];

  return (
    <div
      ref={panelRef}
      id={props.panelId}
      class={classes}
      tabIndex={-1}
      role="menu"
      aria-label={props.ariaLabel}
      aria-labelledby={props.ariaLabelledby}
      aria-describedby={props.ariaDescribedby}
      onClick$={props.onPanelClick$}
      onAnimationStart$={handleAnimationStart$}
      onAnimationEnd$={handleAnimationEnd$}
      onAnimationCancel$={handleAnimationEnd$}
    >
      <div class="mat-mdc-menu-content">{props.content}</div>
    </div>
  );
});
