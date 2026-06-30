import {createContextId, useContext} from '@builder.io/qwik';
import {isBrowser as qIsBrowser} from '@builder.io/qwik/build';

/** Re-export for direct use outside Qwik components. */
export const isBrowser = qIsBrowser;

/**
 * Platform feature-detection bag. All fields are `false` on the server.
 *
 * Uses `typeof navigator/window` runtime checks instead of importing
 * `isBrowser` because the qwik optimizer treats imported `isBrowser` as a
 * build-time constant and DCEs the `isBrowser && …` short-circuit, which
 * leaves the `navigator.userAgent` access bare in the bundle and crashes
 * during SSR with "navigator is not defined". The typeof form cannot be DCE'd
 * because it operates on the runtime global.
 */
export interface Platform {
  readonly isBrowser: boolean;
  readonly EDGE: boolean;
  readonly TRIDENT: boolean;
  readonly BLINK: boolean;
  readonly WEBKIT: boolean;
  readonly IOS: boolean;
  readonly FIREFOX: boolean;
  readonly ANDROID: boolean;
  readonly SAFARI: boolean;
}

export function createPlatform(): Platform {
  if (typeof navigator === 'undefined' || typeof window === 'undefined') {
    return {
      isBrowser,
      EDGE: false,
      TRIDENT: false,
      BLINK: false,
      WEBKIT: false,
      IOS: false,
      FIREFOX: false,
      ANDROID: false,
      SAFARI: false,
    };
  }
  const EDGE = /(edge)/i.test(navigator.userAgent);
  const TRIDENT = /(msie|trident)/i.test(navigator.userAgent);
  const BLINK =
    !!((window as any).chrome || hasGlobalProp('CSS')) &&
    !!navigator.userAgent &&
    !EDGE &&
    !TRIDENT;
  const WEBKIT = /AppleWebKit/i.test(navigator.userAgent) && !BLINK && !EDGE && !TRIDENT;
  return {
    isBrowser,
    EDGE,
    TRIDENT,
    BLINK,
    WEBKIT,
    IOS: /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream,
    FIREFOX: /(firefox|minefield)/i.test(navigator.userAgent),
    ANDROID: /android/i.test(navigator.userAgent) && !TRIDENT,
    SAFARI: /safari/i.test(navigator.userAgent) && WEBKIT,
  };
}

function hasGlobalProp(name: string) {
  return typeof globalThis !== 'undefined' && name in globalThis;
}

export const PLATFORM = createContextId<Platform>('qwik-cdk/platform');

export function usePlatform(): Platform {
  return useContext(PLATFORM);
}
