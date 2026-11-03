import {useSignal, useVisibleTask$, type Signal} from '@qwik.dev/core';

export interface UseCdkDomPortalReturn {
  /** Whether the element is currently moved into the target (vs. restored to its original spot). */
  attached: Signal<boolean>;
  /** Set to `false` to detach (restore the element to its original position); `true` to
   *  (re-)attach. Defaults to `true`. */
  enabled: Signal<boolean>;
}

/**
 * Qwik re-evaluation of upstream's `DomPortal`/`DomPortalOutlet.attachDomPortal()`
 * (`src/cdk/portal/portal.ts`'s `DomPortal`, `src/cdk/portal/dom-portal-outlet.ts`'s
 * `attachDomPortal`) — moves an EXISTING DOM node (one Qwik isn't itself reactively
 * rendering — e.g. a ref to a third-party widget's root, or any plain DOM subtree) into
 * `targetRef`'s element, and restores it to its exact original position when `enabled`
 * becomes `false` or the calling component unmounts. See `dom-portal-outlet.removed.md` for
 * why the OTHER half of upstream's `DomPortalOutlet` (attaching freshly-instantiated
 * Qwik-rendered content, not pre-existing DOM) is a separate primitive
 * (`<CdkDomPortalOutlet>`, `dom-portal-outlet.tsx`) instead of being unified here: this hook
 * does pure DOM-node relocation with no Qwik rendering of its own, which is what makes it
 * safe to drive from `useVisibleTask$` with no special care — unlike content Qwik is
 * actively (re)rendering, a plain pre-existing subtree has no vnode bookkeeping of its own
 * for a physical DOM move to ever disturb.
 *
 * ```tsx
 * const widgetRef = useSignal<Element>();
 * const targetRef = useSignal<Element>(); // e.g. a slot elsewhere in the page
 * const portal = useCdkDomPortal(widgetRef, targetRef);
 * return (
 *   <>
 *     <div ref={widgetRef}>{'<third-party-widget> lives here until attached'}</div>
 *     <div ref={targetRef} />
 *   </>
 * );
 * ```
 */
export function useCdkDomPortal(
  elementRef: Signal<Element | undefined>,
  targetRef: Signal<Element | undefined>,
  options: {enabled?: boolean} = {},
): UseCdkDomPortalReturn {
  const attached = useSignal(false);
  const enabledSignal = useSignal(options.enabled ?? true);

  useVisibleTask$(({track, cleanup}) => {
    const enabled = track(() => enabledSignal.value);
    const element = track(() => elementRef.value);
    const target = track(() => targetRef.value);

    if (!enabled || !element || !target) {
      attached.value = false;
      return;
    }

    // Mirrors upstream's `anchorNode` — a comment marking exactly where `element` came
    // from, so it can be restored to the same spot (not just "some child of the same
    // parent") even if siblings were added/removed/reordered while attached.
    const originalParent = element.parentNode;
    if (!originalParent) return;
    const anchor = (target.ownerDocument ?? document).createComment('cdk-dom-portal');
    originalParent.insertBefore(anchor, element);

    target.appendChild(element);
    attached.value = true;

    cleanup(() => {
      if (anchor.parentNode) {
        anchor.parentNode.replaceChild(element, anchor);
      }
      attached.value = false;
    });
  });

  return {attached, enabled: enabledSignal};
}
