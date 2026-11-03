import {component$, Slot, useSignal, useVisibleTask$, type Signal} from '@qwik.dev/core';
import {isBrowser} from '@qwik.dev/core/build';

export interface CdkDomPortalOutletProps {
  /**
   * The DOM element to project this component's content into, once mounted. `undefined`
   * (not yet resolved) leaves the content wherever it naturally rendered — no-op, not an
   * error, so a target that only becomes available after an async fetch works fine.
   */
  target: Signal<Element | undefined> | Element | undefined;
}

/**
 * Qwik re-evaluation of upstream's `DomPortalOutlet.attachComponentPortal()`/
 * `attachTemplatePortal()` (`src/cdk/portal/dom-portal-outlet.ts`) — "attach a
 * component/template portal into an arbitrary DOM element outside the app tree." See
 * `dom-portal-outlet.removed.md` for why a straight port was rejected originally (no Qwik
 * analogue for `ComponentRef`/`EmbeddedViewRef`/`ApplicationRef.attachView` — those are
 * Angular-DI/change-detection-tree concepts). This re-evaluation instead copies upstream's
 * OWN underlying trick for its `attachComponentPortal` case: **the component is instantiated
 * NORMALLY, inside the normal application/injector tree (so context resolves exactly as it
 * would anywhere else), and only the resulting DOM node is physically relocated** ("At this
 * point the component has been instantiated, so we move it to the location in the DOM where
 * we want it to be rendered" — upstream's own comment). In Qwik terms: `<CdkDomPortalOutlet>`
 * is placed as an ordinary descendant wherever the app wants it (so `<Slot/>`'s content sees
 * every ancestor context normally, via `useContext()`), and a `useVisibleTask$` physically
 * moves its own wrapper element into `target` once both are mounted — never a separate
 * `render()` call into `target` directly, which WOULD lose context (a second `render()` root
 * has no vnode-ancestor link back to this one, so nothing provided above `<CdkDomPortalOutlet>`
 * would be visible to `useContext()` inside it).
 *
 * This DOES mean the content keeps its original tree position as far as Qwik's own
 * bookkeeping is concerned — only the real DOM node moves. Confirmed safe (same reason
 * `qwik-cdk/a11y`'s `createFocusTrap` safely inserts/removes sibling anchor elements) because
 * Qwik's vnode diffing holds direct element references, not DOM-position queries, so
 * relocating (not destroying) a node a `ref` already points to doesn't disturb it.
 *
 * **Why `useVisibleTask$`, not a plain `useTask$` tracking the ref (`useFocusTrap`'s own
 * pattern):** this component renders as part of the page's initial content, with no later
 * user interaction to trigger anything — confirmed live that a plain `useTask$` here never
 * reruns client-side at all in that situation (unlike `useFocusTrap`, whose consumers are
 * always mounted FRESH, client-side, in response to an actual interaction — e.g. opening a
 * dialog — which is what actually runs its tasks there, not "a tracked ref changing" by
 * itself). `useVisibleTask$`'s explicit `on:qvisible` registration is what gets Qwik to wake
 * this up with no interaction needed.
 *
 * **Confirmed live, and a genuine Qwik v2 gotcha worth flagging:** the wrapper below must
 * NOT be `display: contents` — an element with no layout box of its own never fires its
 * `useVisibleTask$`'s IntersectionObserver at all (there's nothing to intersect), so the
 * relocation silently never happens. Tried first (to avoid any visible footprint of the
 * wrapper, matching upstream's `outletElement` having none), reverted once this was caught
 * by the `cdk-portal/dom-outlet` dev-app scenario's Playwright spec — see `SYNC.md`.
 *
 * ```tsx
 * const targetRef = useSignal<Element>(); // some element elsewhere in the real document
 * return (
 *   <>
 *     <div ref={targetRef} class="totally-unrelated-part-of-the-page" />
 *     <CdkDomPortalOutlet target={targetRef}>
 *       <MyWidget /> {/* still sees every context provided above this point *\/}
 *     </CdkDomPortalOutlet>
 *   </>
 * );
 * ```
 */
export const CdkDomPortalOutlet = component$<CdkDomPortalOutletProps>(props => {
  const wrapperRef = useSignal<Element>();

  useVisibleTask$(({track, cleanup}) => {
    const wrapper = track(() => wrapperRef.value);
    const target = track(() =>
      props.target && typeof props.target === 'object' && 'value' in props.target
        ? (props.target as Signal<Element | undefined>).value
        : (props.target as Element | undefined),
    );
    if (!isBrowser || !wrapper || !target) return;

    const originalParent = wrapper.parentNode;
    const originalNextSibling = wrapper.nextSibling;

    target.appendChild(wrapper);

    cleanup(() => {
      // Restore to the outlet's own natural tree position — mirrors `useCdkDomPortal()`'s
      // anchor-based restore, just via a direct next-sibling reference instead of a comment
      // node (this wrapper's natural parent never has its OTHER children reordered the way
      // upstream's "siblings might shift while attached" concern applies to; its only job
      // is holding this one outlet's content).
      if (originalParent) {
        if (originalNextSibling && originalNextSibling.parentNode === originalParent) {
          originalParent.insertBefore(wrapper, originalNextSibling);
        } else {
          originalParent.appendChild(wrapper);
        }
      }
    });
  });

  // A plain `<div>` — NOT `display: contents` (see this component's doc comment for why
  // that breaks `useVisibleTask$` entirely). This wrapper exists purely so there's a single
  // element to relocate as a unit; its own (minimal, block-level) box is the one upstream-
  // fidelity trade-off this needs that upstream's own `outletElement` (the caller's own
  // element, never synthesized) doesn't have to make.
  return (
    <div ref={wrapperRef}>
      <Slot />
    </div>
  );
});
