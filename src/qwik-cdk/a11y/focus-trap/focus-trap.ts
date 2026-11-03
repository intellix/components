import type {InteractivityChecker} from '../interactivity-checker/interactivity-checker';

/**
 * Allows for trapping focus within a DOM element via two sentinel anchor
 * elements (start + end) wired around the trap container. Tabbing into either
 * anchor wraps focus back to the opposite tabbable boundary of the region.
 *
 * Uses a relatively simple DOM-order walk. Edge cases like `tabIndex > 0`,
 * flex `order`, and shadow roots can desynchronize visual order from DOM
 * order; matches CDK's known limitations.
 */
export interface FocusTrap {
  readonly element: HTMLElement;
  /** Whether the focus trap is active. */
  enabled: boolean;
  /** Destroys the focus trap by cleaning up the anchors. */
  destroy(): void;
  /**
   * Inserts the anchors into the DOM. Normally called in `createFocusTrap`,
   * but can be deferred via `{ deferAnchors: true }`.
   */
  attachAnchors(): boolean;
  /** Whether the anchors have been inserted. */
  hasAttached(): boolean;
  /** Focus the element marked `cdkFocusInitial`, otherwise the first tabbable. */
  focusInitialElement(options?: FocusOptions): boolean;
  /** Focus the first tabbable element inside the trap. */
  focusFirstTabbableElement(options?: FocusOptions): boolean;
  /** Focus the last tabbable element inside the trap. */
  focusLastTabbableElement(options?: FocusOptions): boolean;
  /** Microtask-deferred variant of `focusInitialElement`. */
  focusInitialElementWhenReady(options?: FocusOptions): Promise<boolean>;
  /** Microtask-deferred variant of `focusFirstTabbableElement`. */
  focusFirstTabbableElementWhenReady(options?: FocusOptions): Promise<boolean>;
  /** Microtask-deferred variant of `focusLastTabbableElement`. */
  focusLastTabbableElementWhenReady(options?: FocusOptions): Promise<boolean>;
  /**
   * Anchor focus listeners exposed for tests that can't drive real focus events
   * (happy-dom doesn't reliably propagate them) and for the spec assertion that
   * the `destroy()` call removes them by reference.
   */
  readonly startAnchorListener: () => void;
  readonly endAnchorListener: () => void;
}

export function createFocusTrap(
  element: HTMLElement,
  checker: InteractivityChecker,
  options?: {defer?: boolean; deferAnchors?: boolean},
): FocusTrap {
  let startAnchor: HTMLElement | null = null;
  let endAnchor: HTMLElement | null = null;
  let hasAttachedAnchors = false;
  let enabled = true;
  let destroyed = false;

  /** Toggle tabindex (presence, not just value) so arrow-key nav doesn't hit the anchor. */
  function toggleAnchorTabIndex(isEnabled: boolean, anchor: HTMLElement) {
    if (isEnabled) {
      anchor.setAttribute('tabindex', '0');
    } else {
      anchor.removeAttribute('tabindex');
    }
  }

  function createAnchor(): HTMLElement {
    // ssr-leak-ok: FocusTrap constructed inside useFocusTrap's isBrowser-gated useTask$.
    const anchor = document.createElement('div');
    toggleAnchorTabIndex(enabled, anchor);
    anchor.classList.add('cdk-visually-hidden');
    anchor.classList.add('cdk-focus-trap-anchor');
    anchor.setAttribute('aria-hidden', 'true');
    return anchor;
  }

  const startAnchorListener = () => trap.focusLastTabbableElement();
  const endAnchorListener = () => trap.focusFirstTabbableElement();

  function executeOnStable(fn: () => any): void {
    Promise.resolve().then(fn);
  }

  function getFirstTabbableElement(root: HTMLElement): HTMLElement | null {
    if (checker.isFocusable(root) && checker.isTabbable(root)) {
      return root;
    }
    const children = root.children;
    for (let i = 0; i < children.length; i++) {
      const tabbableChild =
        children[i].nodeType === Node.ELEMENT_NODE
          ? getFirstTabbableElement(children[i] as HTMLElement)
          : null;
      if (tabbableChild) return tabbableChild;
    }
    return null;
  }

  function getLastTabbableElement(root: HTMLElement): HTMLElement | null {
    if (checker.isFocusable(root) && checker.isTabbable(root)) {
      return root;
    }
    const children = root.children;
    for (let i = children.length - 1; i >= 0; i--) {
      const tabbableChild =
        children[i].nodeType === Node.ELEMENT_NODE
          ? getLastTabbableElement(children[i] as HTMLElement)
          : null;
      if (tabbableChild) return tabbableChild;
    }
    return null;
  }

  function getRegionBoundary(bound: 'start' | 'end'): HTMLElement | null {
    // Contains the deprecated version of selector, for temporary backwards comparability.
    const markers = element.querySelectorAll(
      `[cdk-focus-region-${bound}], [cdkFocusRegion${bound}], [cdk-focus-${bound}]`,
    ) as NodeListOf<HTMLElement>;

    if (bound === 'start') {
      return markers.length ? markers[0] : getFirstTabbableElement(element);
    }
    return markers.length ? markers[markers.length - 1] : getLastTabbableElement(element);
  }

  const trap: FocusTrap = {
    element,

    get enabled() {
      return enabled;
    },
    set enabled(value: boolean) {
      enabled = value;
      if (startAnchor && endAnchor) {
        toggleAnchorTabIndex(value, startAnchor);
        toggleAnchorTabIndex(value, endAnchor);
      }
    },

    destroy() {
      destroyed = true;
      if (startAnchor) {
        startAnchor.removeEventListener('focus', startAnchorListener);
        startAnchor.remove();
      }
      if (endAnchor) {
        endAnchor.removeEventListener('focus', endAnchorListener);
        endAnchor.remove();
      }
      startAnchor = endAnchor = null;
      hasAttachedAnchors = false;
    },

    attachAnchors() {
      if (hasAttachedAnchors) return true;

      if (!startAnchor) {
        startAnchor = createAnchor();
        startAnchor.addEventListener('focus', startAnchorListener);
      }
      if (!endAnchor) {
        endAnchor = createAnchor();
        endAnchor.addEventListener('focus', endAnchorListener);
      }

      if (element.parentNode) {
        element.parentNode.insertBefore(startAnchor, element);
        element.parentNode.insertBefore(endAnchor, element.nextSibling);
        hasAttachedAnchors = true;
      }

      return hasAttachedAnchors;
    },

    hasAttached() {
      return hasAttachedAnchors;
    },

    focusInitialElement(options) {
      // Contains the deprecated version of selector, for temporary backwards comparability.
      const redirectToElement = element.querySelector(
        `[cdk-focus-initial], [cdkFocusInitial]`,
      ) as HTMLElement;

      if (redirectToElement) {
        if (!checker.isFocusable(redirectToElement)) {
          const focusableChild = getFirstTabbableElement(redirectToElement);
          focusableChild?.focus(options);
          return !!focusableChild;
        }
        redirectToElement.focus(options);
        return true;
      }

      return trap.focusFirstTabbableElement(options);
    },

    focusFirstTabbableElement(options) {
      const target = getRegionBoundary('start');
      if (target) target.focus(options);
      return !!target;
    },

    focusLastTabbableElement(options) {
      const target = getRegionBoundary('end');
      if (target) target.focus(options);
      return !!target;
    },

    focusInitialElementWhenReady(options) {
      return new Promise<boolean>(resolve => {
        executeOnStable(() => resolve(trap.focusInitialElement(options)));
      });
    },

    focusFirstTabbableElementWhenReady(options) {
      return new Promise<boolean>(resolve => {
        executeOnStable(() => resolve(trap.focusFirstTabbableElement(options)));
      });
    },

    focusLastTabbableElementWhenReady(options) {
      return new Promise<boolean>(resolve => {
        executeOnStable(() => resolve(trap.focusLastTabbableElement(options)));
      });
    },

    startAnchorListener,
    endAnchorListener,
  };

  if (!(options?.deferAnchors ?? false)) {
    // `element.parentNode` can still be `null` here: under Qwik v2's vnode
    // renderer, a `ref` callback/signal can populate before the node is
    // actually committed into the live DOM (the commit lands a frame later),
    // unlike v1 where the DOM insertion and the ref were effectively
    // simultaneous. `attachAnchors()` is a no-op when there's no parent to
    // insert into, so retry across animation frames (same pattern as
    // `overlay-host.tsx`'s `popover` bootstrap fix) until it either succeeds
    // or the trap is destroyed first (e.g. the dialog closes before its
    // first paint - rare, but possible under a fast scripted close).
    const tryAttach = () => {
      if (destroyed || trap.attachAnchors()) return;
      // ssr-leak-ok: anchors attach only in the browser (the trap is built in an isBrowser-gated task).
      requestAnimationFrame(tryAttach);
    };
    tryAttach();
  }

  return trap;
}
