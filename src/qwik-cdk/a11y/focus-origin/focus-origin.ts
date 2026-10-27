import {$, useOn, useSignal, type Signal} from '@builder.io/qwik';
import type {FocusOrigin} from '../focus-monitor/focus-monitor';

export type {FocusOrigin};

/**
 * Lazy, per-component replacement for `useFocusMonitor()` (which — as of
 * this writing — wires up via `useVisibleTask$`, forcing its JS to load and
 * run eagerly on every resumed instance regardless of whether the user ever
 * interacts with it). `useFocusOrigin()` instead calls `useOn()`, which only
 * attaches a serialized `on:<event>` reference to the current component's
 * host element at SSR/render time; the handler's chunk is downloaded and
 * run by qwikloader the FIRST time the event actually fires — never before.
 *
 * Call from inside a `component$` body (before the `return`), same as any
 * other `use*` hook; it attaches to whichever element that component
 * renders as its root. Returns a `Signal<FocusOrigin>` the caller can read
 * declaratively (e.g. to compute `cdk-focused` / `cdk-keyboard-focused` /
 * `cdk-mouse-focused` / `cdk-touch-focused` / `cdk-program-focused` classes)
 * — deliberately NOT a plain `{value}` shim like `createFocusMonitor()`'s
 * return, because a plain mutation wouldn't trigger a re-render, and a real
 * Qwik signal is also what survives Qwik's `class` prop replacing
 * `className` wholesale on every unrelated re-render (see
 * qwik-material/button-toggle/mat-button-toggle.tsx for why that matters).
 *
 * Origin resolution, simplified from `InputModalityDetector` +
 * `FocusMonitor`'s joint algorithm down to two DOM-native signals:
 *  - `pointerdown` records whether the most recent pointer interaction was
 *    touch or mouse.
 *  - `focusin` (bubbles, unlike `focus` — covers descendant focus for free,
 *    i.e. upstream's `checkChildren: true`) then resolves the origin:
 *    the browser's own `:focus-visible` heuristic means keyboard (or any
 *    other focus-ring-worthy origin the browser recognizes that isn't a
 *    plain pointer click); otherwise falls back to the just-recorded
 *    pointer modality, or 'program' if neither applies.
 *  - `focusout` (bubbles version of `blur`) clears the origin. No
 *    `checkChildren`-style "don't clear if focus moved to a descendant"
 *    guard — callers with more than one focusable descendant under the
 *    host should reconsider; today's only caller (MatButtonToggle) has
 *    exactly one.
 */
export function useFocusOrigin(): Signal<FocusOrigin> {
  const origin = useSignal<FocusOrigin>(null);
  const lastPointerModality = useSignal<'mouse' | 'touch' | null>(null);

  useOn(
    'pointerdown',
    $((event: PointerEvent) => {
      lastPointerModality.value = event.pointerType === 'touch' ? 'touch' : 'mouse';
    }),
  );

  useOn(
    'focusin',
    $((event: FocusEvent) => {
      const target = event.target as Element | null;
      if (target?.matches?.(':focus-visible')) {
        origin.value = 'keyboard';
      } else if (lastPointerModality.value) {
        origin.value = lastPointerModality.value;
      } else {
        origin.value = 'program';
      }
      lastPointerModality.value = null;
    }),
  );

  useOn(
    'focusout',
    $(() => {
      origin.value = null;
    }),
  );

  return origin;
}
