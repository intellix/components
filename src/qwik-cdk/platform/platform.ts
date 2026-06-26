import {createContextId, useContext} from '@builder.io/qwik';
import {isBrowser as qIsBrowser} from '@builder.io/qwik/build';

/** Re-export for direct use outside Qwik components. */
export const isBrowser = qIsBrowser;

/**
 * Platform feature-detection bag. Computed lazily in the browser; all fields
 * are `false` on the server.
 *
 * Uses `typeof navigator/window` runtime checks instead of importing
 * `isBrowser` because the qwik optimizer treats imported `isBrowser` as a
 * build-time constant and DCEs the `isBrowser && …` short-circuit, which
 * leaves the `navigator.userAgent` access bare in the bundle and crashes
 * during SSR with "navigator is not defined". The typeof form cannot be DCE'd
 * because it operates on the runtime global.
 */
export class Platform {
  isBrowser = isBrowser;
  EDGE = false;
  TRIDENT = false;
  BLINK = false;
  WEBKIT = false;
  IOS = false;
  FIREFOX = false;
  ANDROID = false;
  SAFARI = false;

  constructor() {
    if (typeof navigator === 'undefined' || typeof window === 'undefined') {
      return;
    }
    this.EDGE = /(edge)/i.test(navigator.userAgent);
    this.TRIDENT = /(msie|trident)/i.test(navigator.userAgent);
    this.BLINK =
      !!((window as any).chrome || hasGlobalProp('CSS')) &&
      !!navigator.userAgent &&
      !this.EDGE &&
      !this.TRIDENT;
    this.WEBKIT =
      /AppleWebKit/i.test(navigator.userAgent) && !this.BLINK && !this.EDGE && !this.TRIDENT;
    this.IOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    this.FIREFOX = /(firefox|minefield)/i.test(navigator.userAgent);
    this.ANDROID = /android/i.test(navigator.userAgent) && !this.TRIDENT;
    this.SAFARI = /safari/i.test(navigator.userAgent) && this.WEBKIT;
  }
}

function hasGlobalProp(name: string) {
  return typeof globalThis !== 'undefined' && name in globalThis;
}

export const PLATFORM = createContextId<Platform>('qwik-cdk/platform');

export function usePlatform(): Platform {
  return useContext(PLATFORM);
}
