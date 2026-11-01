/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.dev/license
 */

import {createContextId, useContext} from '@qwik.dev/core';

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
export interface InputModalityDetector {
  /** Signal-shim: consumers read `.modality.value`. */
  readonly modality: {value: InputModality};
  /** The most recently detected input modality event target. */
  _mostRecentTarget: HTMLElement | null;
  /** Convenience getter — matches CDK's `mostRecentModality`. */
  readonly mostRecentModality: InputModality;
  /** Register a callback invoked whenever the modality changes. Returns an unsubscribe fn. */
  onModalityChange(cb: (m: InputModality) => void): () => void;
  /** Removes all event listeners. Call when the detector is no longer needed. */
  destroy(): void;
}

export function createInputModalityDetector(
  options?: InputModalityDetectorOptions,
): InputModalityDetector {
  const opts: InputModalityDetectorOptions = {ignoreKeys: DEFAULT_IGNORE_KEYS, ...options};
  const modality: {value: InputModality} = {value: null};
  let mostRecentTarget: HTMLElement | null = null;
  let lastTouchMs = 0;
  let onChangeCallbacks: Array<(m: InputModality) => void> = [];

  function setModality(m: InputModality, target: EventTarget | null): void {
    modality.value = m;
    mostRecentTarget = target as HTMLElement | null;
    onChangeCallbacks.forEach(cb => cb(m));
  }

  const onKeydown = (event: KeyboardEvent) => {
    if (opts.ignoreKeys?.some(k => k === event.keyCode)) {
      return;
    }
    setModality('keyboard', getEventTarget(event));
  };

  const onMousedown = (event: MouseEvent) => {
    if (Date.now() - lastTouchMs < TOUCH_BUFFER_MS) {
      return;
    }
    setModality(
      isFakeMousedownFromScreenReader(event) ? 'keyboard' : 'mouse',
      getEventTarget(event),
    );
  };

  const onTouchstart = (event: TouchEvent) => {
    if (isFakeTouchstartFromScreenReader(event)) {
      setModality('keyboard', null);
      return;
    }
    lastTouchMs = Date.now();
    setModality('touch', getEventTarget(event));
  };

  let listenerCleanups: Array<() => void> = [];

  // Use typeof guard rather than `isBrowser` because the qwik optimizer's CSR
  // library build inlines `isBrowser` to `true` and DCE strips the guard,
  // leaving `document.addEventListener` unconditional and crashing during SSR.
  if (typeof document !== 'undefined') {
    const doc = document;
    doc.addEventListener('keydown', onKeydown as EventListener, modalityEventListenerOptions);
    doc.addEventListener('mousedown', onMousedown as EventListener, modalityEventListenerOptions);
    doc.addEventListener('touchstart', onTouchstart as EventListener, modalityEventListenerOptions);

    listenerCleanups = [
      () =>
        doc.removeEventListener(
          'keydown',
          onKeydown as EventListener,
          modalityEventListenerOptions,
        ),
      () =>
        doc.removeEventListener(
          'mousedown',
          onMousedown as EventListener,
          modalityEventListenerOptions,
        ),
      () =>
        doc.removeEventListener(
          'touchstart',
          onTouchstart as EventListener,
          modalityEventListenerOptions,
        ),
    ];
  }

  return {
    modality,
    get _mostRecentTarget() {
      return mostRecentTarget;
    },
    set _mostRecentTarget(v: HTMLElement | null) {
      mostRecentTarget = v;
    },
    get mostRecentModality() {
      return modality.value;
    },
    onModalityChange(cb) {
      onChangeCallbacks.push(cb);
      return () => {
        onChangeCallbacks = onChangeCallbacks.filter(c => c !== cb);
      };
    },
    destroy() {
      listenerCleanups.forEach(fn => fn());
      listenerCleanups = [];
      onChangeCallbacks = [];
    },
  };
}

export const INPUT_MODALITY_DETECTOR = createContextId<InputModalityDetector>(
  'qwik-cdk/input-modality-detector',
);

export function useInputModalityDetector(): InputModalityDetector {
  return useContext(INPUT_MODALITY_DETECTOR);
}
