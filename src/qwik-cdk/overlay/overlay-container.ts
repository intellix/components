import {createContextId, useContext} from '@builder.io/qwik';
import {isBrowser} from '@builder.io/qwik/build';

export interface OverlayContainer {
  getContainerElement(): HTMLElement | null;
}

export class DefaultOverlayContainer implements OverlayContainer {
  private el: HTMLElement | null = null;
  getContainerElement(): HTMLElement | null {
    if (!isBrowser) return null;
    if (!this.el) {
      this.el = document.querySelector<HTMLElement>('.cdk-overlay-container');
    }
    return this.el;
  }
}

export const OVERLAY_CONTAINER = createContextId<OverlayContainer>('qwik-cdk/overlay-container');
export function useOverlayContainer(): OverlayContainer {
  return useContext(OVERLAY_CONTAINER);
}

export interface OverlayContainerOptions {
  // Reserved for future custom-container insertion points (e.g. fullscreen).
}
