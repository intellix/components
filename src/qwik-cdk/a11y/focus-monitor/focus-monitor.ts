/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.dev/license
 */

import {createContextId, useContext} from '@builder.io/qwik';
import {createPlatform, type Platform} from '../../platform';
import {
  createInputModalityDetector,
  type InputModalityDetector,
  TOUCH_BUFFER_MS,
} from '../input-modality/input-modality-detector';

export type FocusOrigin = 'touch' | 'mouse' | 'keyboard' | 'program' | null;

/** Corresponds to the options that can be passed to the native `focus` event. */
export interface FocusOptions {
  preventScroll?: boolean;
}

/** Detection mode used for attributing the origin of a focus event. */
export enum FocusMonitorDetectionMode {
  /**
   * Any mousedown, keydown, or touchstart event that happened in the previous tick or the current
   * tick will be used to assign a focus event's origin.
   */
  IMMEDIATE,
  /**
   * A focus event's origin is always attributed to the last corresponding interaction event, no
   * matter how long ago it occurred.
   */
  EVENTUAL,
}

const captureEventListenerOptions: AddEventListenerOptions = {
  passive: true,
  capture: true,
};

function getEventTarget<T extends EventTarget>(event: Event): T | null {
  return (event.composedPath ? event.composedPath()[0] : event.target) as T | null;
}

function getShadowRoot(element: HTMLElement): ShadowRoot | null {
  const root = element.getRootNode ? element.getRootNode() : null;
  return root instanceof ShadowRoot ? root : null;
}

type MonitoredElementInfo = {
  checkChildren: boolean;
  signal: {value: FocusOrigin};
  rootNode: HTMLElement | ShadowRoot | Document;
};

/**
 * Monitors mouse and keyboard events to determine the cause of focus events.
 *
 * The internal `_onFocus`/`_onBlur` hooks are exposed (underscored) so tests
 * can drive the detector without going through real DOM focus events
 * (happy-dom doesn't always fire them).
 */
export interface FocusMonitor {
  monitor(element: HTMLElement, checkChildren?: boolean): {value: FocusOrigin};
  stopMonitoring(element: HTMLElement): void;
  focusVia(element: HTMLElement, origin: FocusOrigin, options?: FocusOptions): void;
  destroy(): void;
  /** Internal — exposed for tests that can't dispatch real focus events. */
  _onFocus(event: FocusEvent, element: HTMLElement): void;
  /** Internal — exposed for tests that can't dispatch real focus events. */
  _onBlur(event: FocusEvent, element: HTMLElement): void;
}

export function createFocusMonitor(
  platform: Platform = createPlatform(),
  inputModalityDetector: InputModalityDetector = createInputModalityDetector(),
  detectionMode: FocusMonitorDetectionMode = FocusMonitorDetectionMode.IMMEDIATE,
): FocusMonitor {
  /** The focus origin that the next focus event is a result of. */
  let origin: FocusOrigin = null;
  /** The FocusOrigin of the last focus event tracked by the FocusMonitor. */
  let lastFocusOrigin: FocusOrigin = null;
  /** Whether the window has just been focused. */
  let windowFocused = false;
  let windowFocusTimeoutId: ReturnType<typeof setTimeout> | undefined;
  let originTimeoutId: ReturnType<typeof setTimeout> | undefined;
  let originFromTouchInteraction = false;

  /** Map of elements being monitored to their info. */
  const elementInfo = new Map<HTMLElement, MonitoredElementInfo>();

  /** The number of elements currently being monitored. */
  let monitoredElementCount = 0;

  /** Keeps track of the root nodes to which we've currently bound a focus/blur handler. */
  const rootNodeFocusListenerCount = new Map<HTMLElement | Document | ShadowRoot, number>();

  /** Unsubscribe from the InputModalityDetector callback. */
  let stopModalityListener: (() => void) | null = null;

  const windowFocusListener = () => {
    windowFocused = true;
    windowFocusTimeoutId = setTimeout(() => (windowFocused = false));
  };

  const rootNodeFocusAndBlurListener = (event: Event) => {
    const target = getEventTarget<HTMLElement>(event);
    for (let element = target; element; element = element.parentElement as HTMLElement) {
      if (event.type === 'focus') {
        monitor._onFocus(event as FocusEvent, element);
      } else {
        monitor._onBlur(event as FocusEvent, element);
      }
    }
  };

  function isLastInteractionFromInputLabel(focusEventTarget: HTMLElement): boolean {
    const mostRecentTarget = inputModalityDetector._mostRecentTarget;
    const mostRecentModality = inputModalityDetector.mostRecentModality;

    if (
      mostRecentModality !== 'mouse' ||
      !mostRecentTarget ||
      mostRecentTarget === focusEventTarget ||
      (focusEventTarget.nodeName !== 'INPUT' && focusEventTarget.nodeName !== 'TEXTAREA') ||
      (focusEventTarget as HTMLInputElement | HTMLTextAreaElement).disabled
    ) {
      return false;
    }

    const labels = (focusEventTarget as HTMLInputElement | HTMLTextAreaElement).labels;
    if (labels) {
      for (let i = 0; i < labels.length; i++) {
        if (labels[i].contains(mostRecentTarget)) {
          return true;
        }
      }
    }

    return false;
  }

  function shouldBeAttributedToTouch(focusEventTarget: HTMLElement | null): boolean {
    return (
      detectionMode === FocusMonitorDetectionMode.EVENTUAL ||
      !!focusEventTarget?.contains(inputModalityDetector._mostRecentTarget)
    );
  }

  function getFocusOrigin(focusEventTarget: HTMLElement | null): FocusOrigin {
    if (origin) {
      if (originFromTouchInteraction) {
        return shouldBeAttributedToTouch(focusEventTarget) ? 'touch' : 'program';
      } else {
        return origin;
      }
    }

    if (windowFocused && lastFocusOrigin) {
      return lastFocusOrigin;
    }

    if (focusEventTarget && isLastInteractionFromInputLabel(focusEventTarget)) {
      return 'mouse';
    }

    return 'program';
  }

  function setClasses(element: HTMLElement, originValue?: FocusOrigin): void {
    element.classList.toggle('cdk-focused', !!originValue);
    element.classList.toggle('cdk-touch-focused', originValue === 'touch');
    element.classList.toggle('cdk-keyboard-focused', originValue === 'keyboard');
    element.classList.toggle('cdk-mouse-focused', originValue === 'mouse');
    element.classList.toggle('cdk-program-focused', originValue === 'program');
  }

  function setOrigin(next: FocusOrigin, isFromInteraction = false): void {
    origin = next;
    originFromTouchInteraction = next === 'touch' && isFromInteraction;

    if (detectionMode === FocusMonitorDetectionMode.IMMEDIATE) {
      clearTimeout(originTimeoutId);
      const ms = originFromTouchInteraction ? TOUCH_BUFFER_MS : 1;
      originTimeoutId = setTimeout(() => (origin = null), ms);
    }
  }

  function originChanged(
    element: HTMLElement,
    next: FocusOrigin,
    info: MonitoredElementInfo,
  ): void {
    setClasses(element, next);
    info.signal.value = next;
    lastFocusOrigin = next;
  }

  function getClosestElementsInfo(element: HTMLElement): [HTMLElement, MonitoredElementInfo][] {
    const results: [HTMLElement, MonitoredElementInfo][] = [];
    elementInfo.forEach((info, currentElement) => {
      if (currentElement === element || (info.checkChildren && currentElement.contains(element))) {
        results.push([currentElement, info]);
      }
    });
    return results;
  }

  function registerGlobalListeners(info: MonitoredElementInfo): void {
    if (!platform.isBrowser) return;

    const rootNode = info.rootNode;
    const rootNodeFocusListeners = rootNodeFocusListenerCount.get(rootNode) || 0;

    if (!rootNodeFocusListeners) {
      rootNode.addEventListener('focus', rootNodeFocusAndBlurListener, captureEventListenerOptions);
      rootNode.addEventListener('blur', rootNodeFocusAndBlurListener, captureEventListenerOptions);
    }

    rootNodeFocusListenerCount.set(rootNode, rootNodeFocusListeners + 1);

    if (++monitoredElementCount === 1) {
      const win = document.defaultView || window;
      win.addEventListener('focus', windowFocusListener);

      stopModalityListener = inputModalityDetector.onModalityChange(modality => {
        setOrigin(modality, true /* isFromInteraction */);
      });
    }
  }

  function removeGlobalListeners(info: MonitoredElementInfo): void {
    const rootNode = info.rootNode;

    if (rootNodeFocusListenerCount.has(rootNode)) {
      const count = rootNodeFocusListenerCount.get(rootNode)!;
      if (count > 1) {
        rootNodeFocusListenerCount.set(rootNode, count - 1);
      } else {
        rootNode.removeEventListener(
          'focus',
          rootNodeFocusAndBlurListener,
          captureEventListenerOptions,
        );
        rootNode.removeEventListener(
          'blur',
          rootNodeFocusAndBlurListener,
          captureEventListenerOptions,
        );
        rootNodeFocusListenerCount.delete(rootNode);
      }
    }

    if (!--monitoredElementCount) {
      const win = document.defaultView || window;
      win.removeEventListener('focus', windowFocusListener);

      stopModalityListener?.();
      stopModalityListener = null;

      clearTimeout(windowFocusTimeoutId);
      clearTimeout(originTimeoutId);
    }
  }

  const monitor: FocusMonitor = {
    monitor(element, checkChildren = false) {
      if (!platform.isBrowser || element.nodeType !== 1) {
        return {value: null};
      }

      const rootNode = getShadowRoot(element) || document;
      const cachedInfo = elementInfo.get(element);

      if (cachedInfo) {
        if (checkChildren) cachedInfo.checkChildren = true;
        return cachedInfo.signal;
      }

      const info: MonitoredElementInfo = {
        checkChildren,
        signal: {value: null},
        rootNode,
      };
      elementInfo.set(element, info);
      registerGlobalListeners(info);

      return info.signal;
    },

    stopMonitoring(element) {
      const info = elementInfo.get(element);
      if (info) {
        setClasses(element);
        elementInfo.delete(element);
        removeGlobalListeners(info);
      }
    },

    focusVia(element, originValue, options) {
      if (!platform.isBrowser) return;
      const focusedElement = document.activeElement;

      if (element === focusedElement) {
        getClosestElementsInfo(element).forEach(([currentElement, info]) =>
          originChanged(currentElement, originValue, info),
        );
      } else {
        setOrigin(originValue);
        if (typeof element.focus === 'function') {
          element.focus(options);
        }
      }
    },

    destroy() {
      elementInfo.forEach((_info, element) => monitor.stopMonitoring(element));
    },

    _onFocus(event, element) {
      const info = elementInfo.get(element);
      // Fall back to the provided element when the event target is not available
      // (e.g. when the event is constructed directly in tests without a real DOM dispatch).
      const focusEventTarget = getEventTarget<HTMLElement>(event) ?? element;
      if (!info || (!info.checkChildren && element !== focusEventTarget)) {
        return;
      }
      originChanged(element, getFocusOrigin(focusEventTarget), info);
    },

    _onBlur(event, element) {
      const info = elementInfo.get(element);
      if (
        !info ||
        (info.checkChildren &&
          event.relatedTarget instanceof Node &&
          element.contains(event.relatedTarget))
      ) {
        return;
      }
      setClasses(element);
      info.signal.value = null;
    },
  };

  return monitor;
}

export const FOCUS_MONITOR = createContextId<FocusMonitor>('qwik-cdk/focus-monitor');

export function useFocusMonitor(): FocusMonitor {
  return useContext(FOCUS_MONITOR);
}
