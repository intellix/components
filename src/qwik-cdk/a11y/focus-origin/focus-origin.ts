import {$, useOn, useSignal, type Signal} from '@builder.io/qwik';
import {isBrowser} from '@builder.io/qwik/build';
import type {FocusOptions, FocusOrigin} from '../focus-monitor/focus-monitor';
import {consumeRecentKeydown, wasRecentKeydown} from './recent-keydown';

export type {FocusOrigin};

/**
 * DOM attribute `focusVia()` writes just before calling `element.focus()`
 * and `useFocusOrigin()`'s own `focusin` handler reads (and clears) on the
 * very next focus event. A transient, one-shot override — the same role
 * upstream's real `FocusMonitor.focusVia()` plays with its private pending
 * `origin` variable (see `../focus-monitor/focus-monitor.ts`), reframed as a
 * plain element attribute so it needs no shared engine/listener registry:
 * each `useFocusOrigin()` instance already owns a `focusin` listener on its
 * own host element (attached lazily via `useOn()`), so it can just check
 * its own element for this attribute first.
 */
const PENDING_ORIGIN_ATTR = 'data-cdk-pending-focus-origin';

/**
 * Qwik-native replacement for upstream `FocusMonitor.focusVia(element,
 * origin, options)`: forces the ORIGIN of the very next focus event on
 * `element` to `origin`, bypassing `useFocusOrigin()`'s normal
 * pointerdown/`:focus-visible` heuristic entirely, then focuses it. Needed
 * wherever upstream calls the real `focusVia()` with an origin the
 * heuristic would get wrong — e.g. `MatAccordion`'s `FocusKeyManager`-driven
 * arrow-key navigation, whose origin is always `'program'` even though a
 * real keydown triggered it (CDK's `FocusKeyManager` never calls
 * `setFocusOrigin('keyboard')`), and `MatExpansionPanelHeader` regaining
 * focus as `'program'` when its panel closes while focus was inside it.
 *
 * Only meaningful for elements that ALSO call `useFocusOrigin()` on
 * themselves — plain `element.focus()` on an unrelated element is a no-op
 * attribute write.
 *
 * Mirrors one more subtlety of the real `FocusMonitor.focusVia()`: if
 * `element` is ALREADY the focused element (e.g. pressing `End` while
 * already on the last header — `FocusKeyManager.setActiveItem` always
 * calls `.focus(origin)` on the resulting active item, even when it's
 * unchanged), calling `.focus()` again fires no new `focus`/`focusin`
 * event in any browser, so the pending-origin attribute would never be
 * read back off — it would just sit there, stuck, forever. Upstream's real
 * engine special-cases this by updating the focus classes directly instead
 * of relying on a focus event; this port dispatches a synthetic `focusin`
 * instead, so the SAME `useFocusOrigin()` listener (and its
 * pending-origin-attribute check) handles both paths uniformly.
 */
export function focusVia(element: HTMLElement, origin: FocusOrigin, options?: FocusOptions): void {
  if (origin) {
    element.setAttribute(PENDING_ORIGIN_ATTR, origin);
  } else {
    element.removeAttribute(PENDING_ORIGIN_ATTR);
  }
  if (isBrowser && document.activeElement === element) {
    element.dispatchEvent(new FocusEvent('focusin', {bubbles: true}));
  } else {
    element.focus(options);
  }
}

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
 * `FocusMonitor`'s joint algorithm down to two signals:
 *  - `pointerdown` (component-scoped, lazy `useOn()` — fine here, since the
 *    element being clicked IS this component's own host, so the listener is
 *    always already attached where the event lands) records whether the
 *    most recent pointer interaction was touch or mouse.
 *  - `focusin` (bubbles, unlike `focus` — covers descendant focus for free,
 *    i.e. upstream's `checkChildren: true`) then resolves the origin:
 *    `wasRecentKeydown()` (./recent-keydown.ts) true means `'keyboard'`;
 *    otherwise the just-recorded pointer modality; otherwise `'program'`.
 *  - `focusout` (bubbles version of `blur`) clears the origin. No
 *    `checkChildren`-style "don't clear if focus moved to a descendant"
 *    guard — callers with more than one focusable descendant under the
 *    host should reconsider; today's only caller (MatButtonToggle) has
 *    exactly one.
 *  - A pending origin written by `focusVia()` (see above) on the target
 *    element takes priority over both, exactly once, then is cleared —
 *    needed by callers (`MatAccordion`, `MatExpansionPanelHeader`) that
 *    must force `'program'` even though a real keydown/click triggered the
 *    resulting focus.
 *
 * An earlier version of this hook used the browser's own `:focus-visible`
 * pseudo-class instead of tracking real keydowns at all. That's simpler and
 * race-free, but confirmed live to disagree with upstream's own algorithm
 * for a bare SCRIPTED `element.focus()` call with no real keydown/mousedown
 * behind it (e.g. Playwright's `locator.focus()`): Chromium's native
 * heuristic matches `:focus-visible` there too, conflating "scripted, no
 * recent interaction" with "real keyboard navigation", where upstream's
 * `FocusMonitor.getFocusOrigin()` correctly falls through to `'program'`
 * (see `qwik-material/tooltip`'s `message-change` scenario). Tracking real
 * `keydown`s fixes that — but ONLY with a truly eager, always-installed
 * listener; see recent-keydown.ts's doc comment for the two lazy attempts
 * (`useOn`, then `useOnDocument`) that each lost the race against a REAL
 * Tab press's own synchronous default action for a plain reason: neither
 * one is guaranteed to be loaded+running before the very first keydown on
 * the page, which `<QwikCdkRoot>`-level eager installation is.
 */
export function useFocusOrigin(): Signal<FocusOrigin> {
  const origin = useSignal<FocusOrigin>(null);
  const lastPointerModality = useSignal<'mouse' | 'touch' | null>(null);

  useOn(
    'pointerdown',
    $((event: PointerEvent) => {
      lastPointerModality.value = event.pointerType === 'touch' ? 'touch' : 'mouse';
      // A pointer press is a newer, more specific signal than whatever
      // stale keydown might still be flagged (e.g. the user finished
      // typing in a different, previously-focused field) — invalidate it
      // so the upcoming focus change (if any) isn't misattributed.
      consumeRecentKeydown();
    }),
  );

  useOn(
    'focusin',
    $((event: FocusEvent) => {
      const target = event.target as Element | null;
      const pending = target?.getAttribute?.(PENDING_ORIGIN_ATTR);
      if (pending) {
        target?.removeAttribute(PENDING_ORIGIN_ATTR);
        origin.value = pending as FocusOrigin;
      } else if (wasRecentKeydown()) {
        origin.value = 'keyboard';
      } else if (lastPointerModality.value) {
        origin.value = lastPointerModality.value;
      } else {
        origin.value = 'program';
      }
      lastPointerModality.value = null;
      consumeRecentKeydown();
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
