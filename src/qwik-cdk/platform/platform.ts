import {createContextId, useContext} from '@builder.io/qwik';
import {isBrowser as qIsBrowser} from '@builder.io/qwik/build';

/** Re-export for direct use outside Qwik components. */
export const isBrowser = qIsBrowser;

/**
 * Platform feature-detection bag. Computed lazily in the browser; all fields
 * are `false` on the server.
 */
export class Platform {
  isBrowser = isBrowser;
  EDGE = isBrowser && /(edge)/i.test(navigator.userAgent);
  TRIDENT = isBrowser && /(msie|trident)/i.test(navigator.userAgent);
  BLINK =
    isBrowser &&
    !!((window as any).chrome || hasGlobalProp('CSS')) &&
    !!navigator.userAgent &&
    !this.EDGE &&
    !this.TRIDENT;
  WEBKIT =
    isBrowser &&
    /AppleWebKit/i.test(navigator.userAgent) &&
    !this.BLINK &&
    !this.EDGE &&
    !this.TRIDENT;
  IOS = isBrowser && /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
  FIREFOX = isBrowser && /(firefox|minefield)/i.test(navigator.userAgent);
  ANDROID = isBrowser && /android/i.test(navigator.userAgent) && !this.TRIDENT;
  SAFARI = isBrowser && /safari/i.test(navigator.userAgent) && this.WEBKIT;
}

function hasGlobalProp(name: string) {
  return typeof globalThis !== 'undefined' && name in globalThis;
}

export const PLATFORM = createContextId<Platform>('qwik-cdk/platform');

export function usePlatform(): Platform {
  return useContext(PLATFORM);
}
