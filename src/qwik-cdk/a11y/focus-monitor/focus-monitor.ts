/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.dev/license
 */

import {createContextId, useContext} from '@builder.io/qwik';
import {Platform} from '../../platform';
import {InputModalityDetector, TOUCH_BUFFER_MS} from '../input-modality/input-modality-detector';

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

/** Monitors mouse and keyboard events to determine the cause of focus events. */
export class FocusMonitor {
  private _platform: Platform;
  private _inputModalityDetector: InputModalityDetector;
  private _detectionMode: FocusMonitorDetectionMode;

  /** The focus origin that the next focus event is a result of. */
  private _origin: FocusOrigin = null;

  /** The FocusOrigin of the last focus event tracked by the FocusMonitor. */
  private _lastFocusOrigin: FocusOrigin = null;

  /** Whether the window has just been focused. */
  private _windowFocused = false;

  private _windowFocusTimeoutId: ReturnType<typeof setTimeout> | undefined;
  private _originTimeoutId: ReturnType<typeof setTimeout> | undefined;

  /**
   * Whether the origin was determined via a touch interaction.
   */
  private _originFromTouchInteraction = false;

  /** Map of elements being monitored to their info. */
  private _elementInfo = new Map<HTMLElement, MonitoredElementInfo>();

  /** The number of elements currently being monitored. */
  private _monitoredElementCount = 0;

  /**
   * Keeps track of the root nodes to which we've currently bound a focus/blur handler.
   */
  private _rootNodeFocusListenerCount = new Map<HTMLElement | Document | ShadowRoot, number>();

  /** Unsubscribe from the InputModalityDetector callback. */
  private _stopModalityListener: (() => void) | null = null;

  /**
   * Event listener for `focus` events on the window.
   */
  private _windowFocusListener = () => {
    this._windowFocused = true;
    this._windowFocusTimeoutId = setTimeout(() => (this._windowFocused = false));
  };

  /**
   * Event listener for `focus` and `blur` events on the document/root node.
   */
  private _rootNodeFocusAndBlurListener = (event: Event) => {
    const target = getEventTarget<HTMLElement>(event);

    for (let element = target; element; element = element.parentElement as HTMLElement) {
      if (event.type === 'focus') {
        this._onFocus(event as FocusEvent, element);
      } else {
        this._onBlur(event as FocusEvent, element);
      }
    }
  };

  constructor(
    platform: Platform = new Platform(),
    modalityDetector: InputModalityDetector = new InputModalityDetector(),
    detectionMode: FocusMonitorDetectionMode = FocusMonitorDetectionMode.IMMEDIATE,
  ) {
    this._platform = platform;
    this._inputModalityDetector = modalityDetector;
    this._detectionMode = detectionMode;
  }

  /**
   * Monitors focus on an element.
   * @param element The element to monitor.
   * @param checkChildren Whether to count the element as focused when its children are focused.
   * @returns A signal-shim `{ value: FocusOrigin }` that reflects the current focus origin.
   */
  monitor(element: HTMLElement, checkChildren: boolean = false): {value: FocusOrigin} {
    // Do nothing if we're not on the browser platform or the passed in node isn't an element.
    if (!this._platform.isBrowser || element.nodeType !== 1) {
      return {value: null};
    }

    const rootNode = getShadowRoot(element) || document;
    const cachedInfo = this._elementInfo.get(element);

    if (cachedInfo) {
      if (checkChildren) {
        cachedInfo.checkChildren = true;
      }
      return cachedInfo.signal;
    }

    const info: MonitoredElementInfo = {
      checkChildren,
      signal: {value: null},
      rootNode,
    };
    this._elementInfo.set(element, info);
    this._registerGlobalListeners(info);

    return info.signal;
  }

  /**
   * Stops monitoring an element and removes all focus classes.
   */
  stopMonitoring(element: HTMLElement): void {
    const elementInfo = this._elementInfo.get(element);

    if (elementInfo) {
      this._setClasses(element);
      this._elementInfo.delete(element);
      this._removeGlobalListeners(elementInfo);
    }
  }

  /**
   * Focuses the element via the specified focus origin.
   */
  focusVia(element: HTMLElement, origin: FocusOrigin, options?: FocusOptions): void {
    const focusedElement = document.activeElement;

    if (element === focusedElement) {
      this._getClosestElementsInfo(element).forEach(([currentElement, info]) =>
        this._originChanged(currentElement, origin, info),
      );
    } else {
      this._setOrigin(origin);
      if (typeof element.focus === 'function') {
        element.focus(options);
      }
    }
  }

  /** Stops monitoring all elements. */
  destroy(): void {
    this._elementInfo.forEach((_info, element) => this.stopMonitoring(element));
  }

  private _getFocusOrigin(focusEventTarget: HTMLElement | null): FocusOrigin {
    if (this._origin) {
      if (this._originFromTouchInteraction) {
        return this._shouldBeAttributedToTouch(focusEventTarget) ? 'touch' : 'program';
      } else {
        return this._origin;
      }
    }

    if (this._windowFocused && this._lastFocusOrigin) {
      return this._lastFocusOrigin;
    }

    if (focusEventTarget && this._isLastInteractionFromInputLabel(focusEventTarget)) {
      return 'mouse';
    }

    return 'program';
  }

  private _shouldBeAttributedToTouch(focusEventTarget: HTMLElement | null): boolean {
    return (
      this._detectionMode === FocusMonitorDetectionMode.EVENTUAL ||
      !!focusEventTarget?.contains(this._inputModalityDetector._mostRecentTarget)
    );
  }

  private _setClasses(element: HTMLElement, origin?: FocusOrigin): void {
    element.classList.toggle('cdk-focused', !!origin);
    element.classList.toggle('cdk-touch-focused', origin === 'touch');
    element.classList.toggle('cdk-keyboard-focused', origin === 'keyboard');
    element.classList.toggle('cdk-mouse-focused', origin === 'mouse');
    element.classList.toggle('cdk-program-focused', origin === 'program');
  }

  private _setOrigin(origin: FocusOrigin, isFromInteraction = false): void {
    this._origin = origin;
    this._originFromTouchInteraction = origin === 'touch' && isFromInteraction;

    if (this._detectionMode === FocusMonitorDetectionMode.IMMEDIATE) {
      clearTimeout(this._originTimeoutId);
      const ms = this._originFromTouchInteraction ? TOUCH_BUFFER_MS : 1;
      this._originTimeoutId = setTimeout(() => (this._origin = null), ms);
    }
  }

  _onFocus(event: FocusEvent, element: HTMLElement): void {
    const elementInfo = this._elementInfo.get(element);
    // Fall back to the provided element when the event target is not available
    // (e.g. when the event is constructed directly in tests without a real DOM dispatch).
    const focusEventTarget = getEventTarget<HTMLElement>(event) ?? element;
    if (!elementInfo || (!elementInfo.checkChildren && element !== focusEventTarget)) {
      return;
    }

    this._originChanged(element, this._getFocusOrigin(focusEventTarget), elementInfo);
  }

  _onBlur(event: FocusEvent, element: HTMLElement): void {
    const elementInfo = this._elementInfo.get(element);

    if (
      !elementInfo ||
      (elementInfo.checkChildren &&
        event.relatedTarget instanceof Node &&
        element.contains(event.relatedTarget))
    ) {
      return;
    }

    this._setClasses(element);
    elementInfo.signal.value = null;
  }

  private _registerGlobalListeners(elementInfo: MonitoredElementInfo): void {
    if (!this._platform.isBrowser) {
      return;
    }

    const rootNode = elementInfo.rootNode;
    const rootNodeFocusListeners = this._rootNodeFocusListenerCount.get(rootNode) || 0;

    if (!rootNodeFocusListeners) {
      rootNode.addEventListener(
        'focus',
        this._rootNodeFocusAndBlurListener,
        captureEventListenerOptions,
      );
      rootNode.addEventListener(
        'blur',
        this._rootNodeFocusAndBlurListener,
        captureEventListenerOptions,
      );
    }

    this._rootNodeFocusListenerCount.set(rootNode, rootNodeFocusListeners + 1);

    if (++this._monitoredElementCount === 1) {
      const win = document.defaultView || window;
      win.addEventListener('focus', this._windowFocusListener);

      this._stopModalityListener = this._inputModalityDetector.onModalityChange(modality => {
        this._setOrigin(modality, true /* isFromInteraction */);
      });
    }
  }

  private _removeGlobalListeners(elementInfo: MonitoredElementInfo): void {
    const rootNode = elementInfo.rootNode;

    if (this._rootNodeFocusListenerCount.has(rootNode)) {
      const count = this._rootNodeFocusListenerCount.get(rootNode)!;

      if (count > 1) {
        this._rootNodeFocusListenerCount.set(rootNode, count - 1);
      } else {
        rootNode.removeEventListener(
          'focus',
          this._rootNodeFocusAndBlurListener,
          captureEventListenerOptions,
        );
        rootNode.removeEventListener(
          'blur',
          this._rootNodeFocusAndBlurListener,
          captureEventListenerOptions,
        );
        this._rootNodeFocusListenerCount.delete(rootNode);
      }
    }

    if (!--this._monitoredElementCount) {
      const win = document.defaultView || window;
      win.removeEventListener('focus', this._windowFocusListener);

      this._stopModalityListener?.();
      this._stopModalityListener = null;

      clearTimeout(this._windowFocusTimeoutId);
      clearTimeout(this._originTimeoutId);
    }
  }

  private _originChanged(
    element: HTMLElement,
    origin: FocusOrigin,
    elementInfo: MonitoredElementInfo,
  ): void {
    this._setClasses(element, origin);
    elementInfo.signal.value = origin;
    this._lastFocusOrigin = origin;
  }

  private _getClosestElementsInfo(element: HTMLElement): [HTMLElement, MonitoredElementInfo][] {
    const results: [HTMLElement, MonitoredElementInfo][] = [];

    this._elementInfo.forEach((info, currentElement) => {
      if (currentElement === element || (info.checkChildren && currentElement.contains(element))) {
        results.push([currentElement, info]);
      }
    });

    return results;
  }

  private _isLastInteractionFromInputLabel(focusEventTarget: HTMLElement): boolean {
    const mostRecentTarget = this._inputModalityDetector._mostRecentTarget;
    const mostRecentModality = this._inputModalityDetector.mostRecentModality;

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
}

export const FOCUS_MONITOR = createContextId<FocusMonitor>('qwik-cdk/focus-monitor');

export function useFocusMonitor(): FocusMonitor {
  return useContext(FOCUS_MONITOR);
}
