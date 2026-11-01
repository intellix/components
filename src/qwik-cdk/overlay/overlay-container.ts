import {createContextId, useContext} from '@qwik.dev/core';
import {isBrowser} from '@qwik.dev/core/build';

export interface OverlayContainer {
  getContainerElement(): HTMLElement | null;
}

/**
 * Default container that looks up `.cdk-overlay-container` in the document and
 * memoizes the result. SSR-safe — returns `null` on the server.
 */
export function createDefaultOverlayContainer(): OverlayContainer {
  let el: HTMLElement | null = null;
  return {
    getContainerElement() {
      if (!isBrowser) return null;
      if (!el) {
        el = document.querySelector<HTMLElement>('.cdk-overlay-container');
      }
      return el;
    },
  };
}

export const OVERLAY_CONTAINER = createContextId<OverlayContainer>('qwik-cdk/overlay-container');
export function useOverlayContainer(): OverlayContainer {
  return useContext(OVERLAY_CONTAINER);
}

export interface OverlayContainerOptions {
  // Reserved for future custom-container insertion points (e.g. fullscreen).
}
