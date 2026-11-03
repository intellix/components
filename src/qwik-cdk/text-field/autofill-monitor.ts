import {isBrowser} from '@qwik.dev/core/build';

/** An event reporting an autofill-state change. */
export interface AutofillEvent {
  /** The element whose autofill state changed. */
  target: Element;
  /** Whether the element is currently autofilled. */
  isAutofilled: boolean;
}

const MONITORED_CLASS = 'cdk-text-field-autofill-monitored';
const AUTOFILLED_CLASS = 'cdk-text-field-autofilled';

/**
 * Port of `src/cdk/text-field/autofill.ts`'s `AutofillMonitor` — detects real browser
 * autofill via the `animationstart`-CSS-trick upstream's own doc comment links
 * (https://medium.com/@brunn/detecting-autofilled-fields-in-javascript-aed598d25da7), backed
 * by this package's structural CSS (`scss/text-field/_text-field-prebuilt.scss`).
 *
 * A plain `createAutofillMonitor()` factory (object literal + closures) instead of an
 * `@Injectable({providedIn: 'root'})` service — same convention as `createFocusMonitor` in
 * `qwik-cdk/a11y`. `monitor()` takes a plain callback and returns an unsubscribe function
 * directly, instead of upstream's `Observable<AutofillEvent>` — no RxJS dependency, same
 * "callback registration" convention as `ListKeyManager.onChange()`/
 * `UniqueSelectionDispatcher.listen()` elsewhere in this package.
 */
export interface AutofillMonitor {
  /**
   * Monitors `element` for autofill state changes, calling `onChange` on every one.
   * @return a function that removes JUST this listener — call `stopMonitoring(element)`
   *   separately to tear down the underlying DOM listener once nothing needs it anymore
   *   (mirrors upstream's `monitor()`/`stopMonitoring()` split).
   */
  monitor(element: Element, onChange: (event: AutofillEvent) => void): () => void;
  /** Stops monitoring `element` and removes every listener registered for it. */
  stopMonitoring(element: Element): void;
  /** Stops monitoring every element this instance is watching. */
  destroy(): void;
}

interface MonitoredElementInfo {
  listeners: Set<(event: AutofillEvent) => void>;
  unlisten: () => void;
}

export function createAutofillMonitor(): AutofillMonitor {
  const monitoredElements = new Map<Element, MonitoredElementInfo>();

  function monitor(element: Element, onChange: (event: AutofillEvent) => void): () => void {
    if (!isBrowser) return () => {};

    let info = monitoredElements.get(element);
    if (!info) {
      const listeners = new Set<(event: AutofillEvent) => void>();
      // Animation events fire on initial element render too; checking the CSS class's
      // current presence confirms this is a REAL state change, not just the initial render
      // before any listener was registered.
      const listener = (event: Event) => {
        const animationEvent = event as AnimationEvent;
        if (
          animationEvent.animationName === 'cdk-text-field-autofill-start' &&
          !element.classList.contains(AUTOFILLED_CLASS)
        ) {
          element.classList.add(AUTOFILLED_CLASS);
          const change: AutofillEvent = {target: animationEvent.target as Element, isAutofilled: true};
          listeners.forEach(l => l(change));
        } else if (
          animationEvent.animationName === 'cdk-text-field-autofill-end' &&
          element.classList.contains(AUTOFILLED_CLASS)
        ) {
          element.classList.remove(AUTOFILLED_CLASS);
          const change: AutofillEvent = {target: animationEvent.target as Element, isAutofilled: false};
          listeners.forEach(l => l(change));
        }
      };

      element.classList.add(MONITORED_CLASS);
      element.addEventListener('animationstart', listener, {passive: true});
      info = {
        listeners,
        unlisten: () => element.removeEventListener('animationstart', listener),
      };
      monitoredElements.set(element, info);
    }

    info.listeners.add(onChange);
    return () => info!.listeners.delete(onChange);
  }

  function stopMonitoring(element: Element): void {
    const info = monitoredElements.get(element);
    if (info) {
      info.unlisten();
      element.classList.remove(MONITORED_CLASS);
      element.classList.remove(AUTOFILLED_CLASS);
      monitoredElements.delete(element);
    }
  }

  function destroy(): void {
    monitoredElements.forEach((_info, element) => stopMonitoring(element));
  }

  return {monitor, stopMonitoring, destroy};
}
