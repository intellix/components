import {$, component$, useTask$, type NoSerialize, type Signal} from '@qwik.dev/core';
import {isBrowser} from '@qwik.dev/core/build';
import type {OverlayRef} from '@angular-community/qwik-cdk/overlay';
import {finalizeHidden} from './tooltip-runtime';

/** Name of the show animation and the class that toggles it (upstream `_showAnimation`). */
const SHOW_ANIMATION = 'mat-mdc-tooltip-show';
/** Name of the hide animation and the class that toggles it (upstream `_hideAnimation`). */
const HIDE_ANIMATION = 'mat-mdc-tooltip-hide';

/**
 * Safety-net delay (ms) for removing the overlay if, for whatever reason, no
 * `animationend` ever arrives for the hide animation (e.g. a global
 * `* { animation: none !important }` override this port doesn't otherwise
 * detect — upstream has an equivalent defensive check in
 * `_toggleVisibility`, see mat-tooltip.tsx). Comfortably longer than the
 * 75ms `mat-mdc-tooltip-hide` keyframe duration in tooltip.scss.
 */
const HIDE_FALLBACK_MS = 400;

export interface TooltipPanelProps {
  /** Mirrors `TooltipComponent.message`. Reactive so a message change while
   *  the SAME panel stays open (see mat-tooltip.tsx's `message-change`
   *  handling) updates the rendered text without recreating the overlay. */
  message: Signal<string>;
  /** Already-resolved class list for the `tooltipClass` input (see
   *  `resolveTooltipClass` in mat-tooltip.tsx) — snapshot at show() time,
   *  not reactive (no scenario mutates `tooltipClass` on an open tooltip;
   *  see SYNC.md). */
  tooltipClassList: readonly string[];
  /** Drives the `mat-mdc-tooltip-show` / `mat-mdc-tooltip-hide` classes. */
  isVisible: Signal<boolean>;
  /** Becomes `true` the first time `isVisible` turns `true`; before that,
   *  neither show nor hide class is rendered — matches upstream's own
   *  pre-first-show window. */
  everShown: Signal<boolean>;
  /** The tooltip's trigger element — used by `_handleMouseLeave` to decide
   *  whether the pointer left towards the trigger (no-op) or elsewhere. */
  triggerElement: HTMLElement;
  /** Delay (ms) used when the mouse leaves the PANEL itself (mirrors
   *  `TooltipComponent._mouseLeaveHideDelay`). */
  mouseLeaveHideDelay: number;
  /** Whether animations are disabled — when true, hiding finalizes
   *  synchronously instead of waiting for `animationend`. */
  animationsDisabled: boolean;
  /**
   * The owning `OverlayRef`, as the SAME signal `mat-tooltip.tsx` holds —
   * detached (and reset to `undefined`) once the hide animation completes.
   * That reset is load-bearing: `showTooltip` (tooltip-runtime.ts) checks
   * this signal to decide whether something is already open/opening.
   */
  overlayRef: Signal<NoSerialize<OverlayRef> | undefined>;
}

/**
 * Qwik port of `src/material/tooltip/tooltip.html` + the relevant parts of
 * `TooltipComponent` (`src/material/tooltip/tooltip.ts`). Rendered as the
 * content of a `FlexibleConnectedPositionStrategy`-positioned overlay via
 * `overlay.create(TooltipPanel, props)` (see `mat-tooltip.tsx`).
 *
 * Deliberately presentational — all show/hide *scheduling* (showDelay /
 * hideDelay timers, the "already visible → cancel pending hide" guard,
 * `_closeOnInteraction`) lives in `mat-tooltip.tsx`, which owns the
 * `isVisible` signal this component only reads. The one thing this
 * component (not `mat-tooltip.tsx`) decides is when to actually call
 * `overlayRef.detach()` — exactly once the real CSS hide animation
 * finishes, since the pane must stay in the DOM for that animation to be
 * visible. Mirrors upstream's split between `MatTooltip` (orchestration)
 * and `TooltipComponent` (`_handleAnimationEnd` → `_finalizeAnimation` →
 * `afterHidden()` → `MatTooltip._detach()`).
 *
 * `_isMultiline` detection (upstream: a `getBoundingClientRect()` check once
 * shown) is NOT ported — every parity scenario confirms (live, against the
 * Angular reference) that it never produces the `mdc-tooltip--multiline`
 * class, including the scenario with the longest message, so `_isMultiline`
 * is hardcoded `false`. See SYNC.md.
 */
export const TooltipPanel = component$<TooltipPanelProps>(props => {
  const showing = props.isVisible.value;
  const stateClass = showing ? SHOW_ANIMATION : props.everShown.value ? HIDE_ANIMATION : undefined;

  const classes = ['mdc-tooltip', 'mat-mdc-tooltip', ...props.tooltipClassList, stateClass].filter(
    Boolean,
  ) as string[];

  // Universal "finish hiding" path: fires whenever `isVisible` turns false,
  // regardless of which handler set it (mat-tooltip.tsx's own hide(), or
  // this component's `handleMouseLeave$` below). Mirrors upstream's real
  // `animationend`-driven finalize, with a defensive fallback timer for the
  // case no animation ever runs (`animationsDisabled`, or no `animationend`
  // arriving for any other reason) — see upstream's own defensive
  // `getComputedStyle` check in `_toggleVisibility` for the equivalent idea.
  useTask$(({track, cleanup}) => {
    const visible = track(() => props.isVisible.value);
    if (visible || !props.everShown.value) return;
    if (props.animationsDisabled) {
      finalizeHidden(props.overlayRef);
      return;
    }
    const id = setTimeout(() => finalizeHidden(props.overlayRef), HIDE_FALLBACK_MS);
    cleanup(() => clearTimeout(id));
  });

  const handleAnimationEnd$ = $((event: AnimationEvent) => {
    if (!isBrowser) return;
    const name = event.animationName;
    if (name === HIDE_ANIMATION && !props.isVisible.value) {
      finalizeHidden(props.overlayRef);
    }
  });

  const handleMouseLeave$ = $((event: MouseEvent) => {
    if (!isBrowser) return;
    const relatedTarget = event.relatedTarget as Node | null;
    if (relatedTarget && props.triggerElement.contains(relatedTarget)) {
      return;
    }
    if (props.isVisible.value) {
      props.isVisible.value = false;
    }
  });

  return (
    <mat-tooltip-component aria-hidden="true" onMouseLeave$={handleMouseLeave$}>
      <div class={classes} onAnimationEnd$={handleAnimationEnd$}>
        <div class="mat-mdc-tooltip-surface mdc-tooltip__surface">{props.message.value}</div>
      </div>
    </mat-tooltip-component>
  );
});
