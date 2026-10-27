import {type Signal, useSignal, useTask$} from '@builder.io/qwik';
import {isBrowser} from '@builder.io/qwik/build';
import {createFocusTrap, type FocusTrap} from './focus-trap';
import {
  createInteractivityChecker,
  type InteractivityChecker,
} from '../interactivity-checker/interactivity-checker';

/**
 * Where to move focus automatically once the trap mounts. Mirrors CDK's
 * `AutoFocusTarget | string | boolean` (`DialogConfig.autoFocus` /
 * `CdkDialogContainer._trapFocus()`):
 * - `false` / `'dialog'` — focus the trap element itself (if focus isn't
 *   already inside it).
 * - `true` / `'first-tabbable'` — focus the first tabbable element, falling
 *   back to the trap element.
 * - `'first-heading'` — focus the first `h1`-`h6` or `[role="heading"]`.
 * - any other string — treated as a CSS selector for the element to focus.
 */
export type AutoFocusTarget = 'dialog' | 'first-tabbable' | 'first-heading' | string | boolean;

export interface UseFocusTrapOptions {
  /**
   * Whether to defer attaching the anchors until later.
   */
  deferAnchors?: boolean;

  /**
   * Whether the focus trap is enabled.
   */
  enabled?: boolean;

  /**
   * Moves focus into the trap once it mounts, per `AutoFocusTarget`. Omit to
   * get a bare tab-wrapping trap with no auto-focus-on-mount behavior.
   */
  autoFocus?: AutoFocusTarget;

  /**
   * Whether to restore focus to the element that was focused before the trap
   * captured it, once the owning component unmounts. Only applies when
   * `autoFocus` is set. Defaults to `true`, matching CDK's
   * `DialogConfig.restoreFocus` default.
   */
  restoreFocus?: boolean;
}

export interface UseFocusTrapReturn {
  /**
   * The FocusTrap instance.
   */
  trapInstance: Signal<FocusTrap | null>;

  /**
   * Whether the focus trap is enabled.
   */
  enabled: Signal<boolean>;
}

/**
 * Hook that creates and manages a FocusTrap instance.
 *
 * @param elementRef Signal containing the element to trap focus within
 * @param options Configuration options
 * @returns Object containing the trap instance and enabled signal
 *
 * @example
 * ```tsx
 * export default component$(() => {
 *   const dialogRef = useSignal<HTMLElement>();
 *   const { enabled } = useFocusTrap(dialogRef, { autoFocus: 'first-tabbable' });
 *
 *   return (
 *     <div ref={dialogRef} role="dialog">
 *       <button>First</button>
 *       <button>Last</button>
 *     </div>
 *   );
 * });
 * ```
 */
export function useFocusTrap(
  elementRef: Signal<HTMLElement | undefined>,
  options: UseFocusTrapOptions = {},
): UseFocusTrapReturn {
  const trapInstance = useSignal<FocusTrap | null>(null);
  const enabled = useSignal(options.enabled ?? true);
  const previouslyFocusedElement = useSignal<HTMLElement | null>(null);

  // Initialize and cleanup focus trap
  useTask$(({track, cleanup}) => {
    track(() => elementRef.value);

    if (!isBrowser) {
      return;
    }

    const element = elementRef.value;
    if (!element) {
      return;
    }

    // Create the focus trap
    const checker = createInteractivityChecker();
    const trap = createFocusTrap(element, checker, {
      deferAnchors: options.deferAnchors,
    });

    trap.enabled = enabled.value;
    trapInstance.value = trap;

    // Auto-focus if requested. Mirrors CdkDialogContainer._trapFocus(), which
    // defers one render past attach (afterNextRender) so the trap's content
    // has settled before moving focus.
    if (options.autoFocus !== undefined) {
      previouslyFocusedElement.value = document.activeElement as HTMLElement;
      const autoFocus = options.autoFocus;
      Promise.resolve().then(() => applyAutoFocus(element, trap, checker, autoFocus));
    }

    cleanup(() => {
      trap.destroy();
      trapInstance.value = null;

      // Restore focus if we captured it.
      const shouldRestore = options.autoFocus !== undefined && (options.restoreFocus ?? true);
      if (shouldRestore && previouslyFocusedElement.value) {
        previouslyFocusedElement.value.focus();
        previouslyFocusedElement.value = null;
      }
    });
  });

  // Sync enabled state
  useTask$(({track}) => {
    const isEnabled = track(() => enabled.value);
    const trap = trapInstance.value;

    if (trap) {
      trap.enabled = isEnabled;
    }
  });

  return {
    trapInstance,
    enabled,
  };
}

/** Mirrors `CdkDialogContainer._trapFocus()`'s switch over `DialogConfig.autoFocus`. */
function applyAutoFocus(
  element: HTMLElement,
  trap: FocusTrap,
  checker: InteractivityChecker,
  autoFocus: AutoFocusTarget,
): void {
  switch (autoFocus) {
    case false:
    case 'dialog': {
      // Ensure that focus is on the trap element. It's possible a different
      // component already moved focus while this ran, so only act if focus
      // isn't already inside the trap.
      const active = document.activeElement;
      if (active !== element && !element.contains(active)) {
        element.focus();
      }
      break;
    }
    case true:
    case 'first-tabbable': {
      const focusedSuccessfully = trap.focusInitialElement();
      if (!focusedSuccessfully) {
        element.focus();
      }
      break;
    }
    case 'first-heading':
      focusBySelector(element, 'h1, h2, h3, h4, h5, h6, [role="heading"]', checker);
      break;
    default:
      focusBySelector(element, autoFocus, checker);
      break;
  }
}

function focusBySelector(root: HTMLElement, selector: string, checker: InteractivityChecker): void {
  const target = root.querySelector<HTMLElement>(selector);
  if (target) {
    forceFocus(target, checker);
  }
}

/**
 * Focuses `element`, forcing it to be focusable (via a temporary
 * `tabindex="-1"`, removed on the next blur/mousedown) when it isn't
 * natively focusable. Mirrors `CdkDialogContainer._forceFocus()`.
 */
function forceFocus(element: HTMLElement, checker: InteractivityChecker): void {
  if (!checker.isFocusable(element)) {
    element.tabIndex = -1;
    const cleanup = () => {
      element.removeEventListener('blur', cleanup);
      element.removeEventListener('mousedown', cleanup);
      element.removeAttribute('tabindex');
    };
    element.addEventListener('blur', cleanup);
    element.addEventListener('mousedown', cleanup);
  }
  element.focus();
}
