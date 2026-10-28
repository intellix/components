import {
  createInteractivityChecker,
  type InteractivityChecker,
} from '@angular-community/qwik-cdk/a11y';
import type {AutoFocusTarget} from '@angular-community/qwik-cdk/a11y';

/**
 * Local copies of `qwik-cdk/a11y/focus-trap/focus-trap.ts`'s internal
 * `getFirstTabbableElement`/`getLastTabbableElement` walks (there, private
 * closures over a `createFocusTrap()` call's own `element`/`checker`
 * parameters — not exported, and this port's anchors are rendered
 * declaratively in `MatDrawerContainer`'s own JSX rather than imperatively
 * inserted by `createFocusTrap()`/`useFocusTrap()`, so reusing that hook
 * wholesale isn't a fit here; see `mat-drawer-container.tsx`'s doc comment).
 * Kept here, not upstreamed, to keep this component's blast radius inside
 * `qwik-material/sidenav`. Doesn't replicate the `[cdk-focus-region-*]`
 * marker override `FocusTrap.focusFirstTabbableElement`/
 * `focusLastTabbableElement` support — no scenario's drawer content uses
 * those markers.
 */
export function getFirstTabbableElement(
  root: HTMLElement,
  checker: InteractivityChecker,
): HTMLElement | null {
  if (checker.isFocusable(root) && checker.isTabbable(root)) {
    return root;
  }
  const children = root.children;
  for (let i = 0; i < children.length; i++) {
    const child = children[i];
    if (child.nodeType === Node.ELEMENT_NODE) {
      const found = getFirstTabbableElement(child as HTMLElement, checker);
      if (found) return found;
    }
  }
  return null;
}

export function getLastTabbableElement(
  root: HTMLElement,
  checker: InteractivityChecker,
): HTMLElement | null {
  if (checker.isFocusable(root) && checker.isTabbable(root)) {
    return root;
  }
  const children = root.children;
  for (let i = children.length - 1; i >= 0; i--) {
    const child = children[i];
    if (child.nodeType === Node.ELEMENT_NODE) {
      const found = getLastTabbableElement(child as HTMLElement, checker);
      if (found) return found;
    }
  }
  return null;
}

/**
 * Moves focus into `host` per `autoFocus`. Mirrors upstream `MatDrawer._takeFocus()`'s switch
 * over `AutoFocusTarget | string | boolean`, minus the `afterNextRender` defer (this port calls
 * it from the transition-settled callback, which already runs after paint) and minus the
 * force-focusable-via-temporary-tabindex fallback for a non-focusable `[cdkFocusInitial]`
 * redirect target (no scenario uses that marker).
 */
export function applyDrawerAutoFocus(host: HTMLElement, autoFocus: AutoFocusTarget): void {
  switch (autoFocus) {
    case false:
    case 'dialog':
      return;
    case true:
    case 'first-tabbable': {
      const checker = createInteractivityChecker();
      const target = getFirstTabbableElement(host, checker);
      if (target) {
        target.focus();
      } else if (typeof host.focus === 'function') {
        host.focus();
      }
      return;
    }
    case 'first-heading': {
      const heading = host.querySelector<HTMLElement>('h1, h2, h3, h4, h5, h6, [role="heading"]');
      heading?.focus();
      return;
    }
    default: {
      const target = host.querySelector<HTMLElement>(autoFocus);
      target?.focus();
    }
  }
}
