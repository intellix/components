import {createContextId, useContext} from '@qwik.dev/core';

/**
 * Whether a ripple delegate (`useMatRippleDelegate()`, ripple-delegate.ts) covers this subtree
 * with the ripple global options and animations-disabled state in force here: `true` below the
 * delegate; `false` below a `useMatRippleProvider()`/`useMatAnimationsProvider()` nested under it
 * (the delegate launches with ITS scope's options, so a ripple host there claims with its own —
 * `rippleClaimProps()`); unset without a delegate. Its own module: the providers set it.
 */
export const MAT_RIPPLE_DELEGATE = createContextId<boolean | null>('qwikMaterial/rippleDelegate');

/**
 * Whether this component's ripples are the delegate's to launch with its scope's options: `true`
 * below the delegate, `false` below a provider nested under it (a ripple host there claims its
 * presses — `rippleClaimProps()`), `null` without a delegate: no ripple (nothing listens), and no
 * claim either — see `useMatRippleDelegate()`.
 */
export function useRippleDelegated(): boolean | null {
  return useContext(MAT_RIPPLE_DELEGATE, null);
}
