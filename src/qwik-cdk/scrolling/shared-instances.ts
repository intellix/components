import {createScrollDispatcher, type ScrollDispatcher} from './scroll-dispatcher';
import {createViewportRuler, type ViewportRuler} from './viewport-ruler';

/**
 * Module-level lazy singletons — the most faithful Qwik translation of upstream's
 * `@Injectable({providedIn: 'root'})` (ONE instance per application, not per-subtree the way
 * a Qwik context/`<QwikCdkRoot>`-provided value would be). Deliberately NOT wired through
 * `qwik-cdk/internals`/`<QwikCdkRoot>` — both engines are entirely browser-only in their
 * real effect (their own internal `isBrowser` gates mean nothing is ever written to
 * `scrollContainers`/the listener sets during SSR, matching upstream's own `!platform
 * .isBrowser` short-circuits in `scrolled()`/`getViewportScrollPosition()` etc.), so reusing
 * one instance across every request a long-running SSR server process handles is safe: the
 * SSR-side instance never accumulates any state to leak between requests in the first
 * place. `useCdkScrollable()`/anything else that needs one only ever registers from inside
 * a `useVisibleTask$` anyway, which is the actual safety net regardless.
 */

let sharedScrollDispatcher: ScrollDispatcher | undefined;

export function getSharedScrollDispatcher(): ScrollDispatcher {
  if (!sharedScrollDispatcher) sharedScrollDispatcher = createScrollDispatcher();
  return sharedScrollDispatcher;
}

let sharedViewportRuler: ViewportRuler | undefined;

export function getSharedViewportRuler(): ViewportRuler {
  if (!sharedViewportRuler) sharedViewportRuler = createViewportRuler();
  return sharedViewportRuler;
}
