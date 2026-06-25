/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.dev/license
 */

import {createContextId, useContext} from '@builder.io/qwik';
import {isBrowser} from '@builder.io/qwik/build';

/** The input modalities detected by this service. Null if unknown. */
export type InputModality = 'keyboard' | 'mouse' | 'touch' | null;

/** Options to configure the behavior of the InputModalityDetector. */
export interface InputModalityDetectorOptions {
  ignoreKeys?: number[];
}

// Keycode constants (inlined — no CDK import needed)
const ALT = 18;
const CONTROL = 17;
const MAC_META = 224;
const META = 91;
const SHIFT = 16;

const DEFAULT_IGNORE_KEYS = [ALT, CONTROL, MAC_META, META, SHIFT];

/**
 * The amount of time needed to pass after a touchstart event in order for a subsequent mousedown
 * event to be attributed as mouse and not touch.
 */
export const TOUCH_BUFFER_MS = 650;

const modalityEventListenerOptions: AddEventListenerOptions = {
  passive: true,
  capture: true,
};

function isFakeMousedownFromScreenReader(event: MouseEvent): boolean {
  return event.buttons === 0 || event.detail === 0;
}

function isFakeTouchstartFromScreenReader(event: TouchEvent): boolean {
  const touch: Touch | undefined =
    (event.touches && event.touches[0]) || (event.changedTouches && event.changedTouches[0]);
  return (
    !!touch &&
    touch.identifier === -1 &&
    (touch.radiusX == null || touch.radiusX === 1) &&
    (touch.radiusY == null || touch.radiusY === 1)
  );
}

function getEventTarget<T extends EventTarget>(event: Event): T | null {
  return (event.composedPath ? event.composedPath()[0] : event.target) as T | null;
}

/**
 * Detects the user's input modality (keyboard / mouse / touch).
 * Drop-in replacement for Angular CDK's InputModalityDetector — no DI, no RxJS.
 */
export class InputModalityDetector {
  /** Signal shim: consumers read `.modality.value`. */
  readonly modality: {value: InputModality} = {value: null};

  /** The most recently detected input modality event target. */
  _mostRecentTarget: HTMLElement | null = null;

  /** Convenience getter — matches CDK's `mostRecentModality`. */
  get mostRecentModality(): InputModality {
    return this.modality.value;
  }

  private readonly _options: InputModalityDetectorOptions;
  private _lastTouchMs = 0;
  private _onChangeCallbacks: Array<(m: InputModality) => void> = [];

  private _onKeydown = (event: KeyboardEvent) => {
    if (this._options.ignoreKeys?.some(k => k === event.keyCode)) {
      return;
    }
    this._setModality('keyboard', getEventTarget(event));
  };

  private _onMousedown = (event: MouseEvent) => {
    if (Date.now() - this._lastTouchMs < TOUCH_BUFFER_MS) {
      return;
    }
    this._setModality(
      isFakeMousedownFromScreenReader(event) ? 'keyboard' : 'mouse',
      getEventTarget(event),
    );
  };

  private _onTouchstart = (event: TouchEvent) => {
    if (isFakeTouchstartFromScreenReader(event)) {
      this._setModality('keyboard', null);
      return;
    }
    this._lastTouchMs = Date.now();
    this._setModality('touch', getEventTarget(event));
  };

  private _listenerCleanups: Array<() => void> = [];

  constructor(options?: InputModalityDetectorOptions) {
    this._options = {ignoreKeys: DEFAULT_IGNORE_KEYS, ...options};

    if (isBrowser) {
      const doc = document;
      const onKeydown = this._onKeydown as EventListener;
      const onMousedown = this._onMousedown as EventListener;
      const onTouchstart = this._onTouchstart as EventListener;

      doc.addEventListener('keydown', onKeydown, modalityEventListenerOptions);
      doc.addEventListener('mousedown', onMousedown, modalityEventListenerOptions);
      doc.addEventListener('touchstart', onTouchstart, modalityEventListenerOptions);

      this._listenerCleanups = [
        () => doc.removeEventListener('keydown', onKeydown, modalityEventListenerOptions),
        () => doc.removeEventListener('mousedown', onMousedown, modalityEventListenerOptions),
        () => doc.removeEventListener('touchstart', onTouchstart, modalityEventListenerOptions),
      ];
    }
  }

  /** Register a callback invoked whenever the modality changes. Returns an unsubscribe fn. */
  onModalityChange(cb: (m: InputModality) => void): () => void {
    this._onChangeCallbacks.push(cb);
    return () => {
      this._onChangeCallbacks = this._onChangeCallbacks.filter(c => c !== cb);
    };
  }

  /** Removes all event listeners. Call when the detector is no longer needed. */
  destroy(): void {
    this._listenerCleanups.forEach(fn => fn());
    this._listenerCleanups = [];
    this._onChangeCallbacks = [];
  }

  private _setModality(m: InputModality, target: EventTarget | null): void {
    this.modality.value = m;
    this._mostRecentTarget = target as HTMLElement | null;
    this._onChangeCallbacks.forEach(cb => cb(m));
  }
}

export const INPUT_MODALITY_DETECTOR = createContextId<InputModalityDetector>(
  'qwik-cdk/input-modality-detector',
);

export function useInputModalityDetector(): InputModalityDetector {
  return useContext(INPUT_MODALITY_DETECTOR);
}
