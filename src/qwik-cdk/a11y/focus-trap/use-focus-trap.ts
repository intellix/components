import {type QRL, type Signal, useOnDocument, useSignal, useTask$, $} from '@builder.io/qwik';
import {isBrowser} from '@builder.io/qwik/build';
import {FocusTrap} from './focus-trap';
import {InteractivityChecker} from '../interactivity-checker/interactivity-checker';

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
   * Whether to automatically capture focus when the trap is initialized.
   */
  autoCapture?: boolean;
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
 *   const { enabled } = useFocusTrap(dialogRef, { autoCapture: true });
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
    const checker = new InteractivityChecker();
    const trap = new FocusTrap(element, checker, {
      deferAnchors: options.deferAnchors,
    });

    trap.enabled = enabled.value;
    trapInstance.value = trap;

    // Auto-capture focus if enabled
    if (options.autoCapture) {
      previouslyFocusedElement.value = document.activeElement as HTMLElement;
      trap.focusInitialElementWhenReady();
    }

    cleanup(() => {
      trap.destroy();
      trapInstance.value = null;

      // Restore focus if we captured it
      if (options.autoCapture && previouslyFocusedElement.value) {
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
