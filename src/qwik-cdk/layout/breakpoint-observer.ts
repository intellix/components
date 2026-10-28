/**
 * Minimal, lazy, SSR-safe stand-in for `@angular/cdk/layout`'s
 * `BreakpointObserver.observe()` — just enough for consumers (currently
 * `qwik-material/bottom-sheet`'s container, which toggles
 * `mat-bottom-sheet-container-{medium,large,xlarge}` from
 * `BreakpointObserver.observe([Breakpoints.Medium, Breakpoints.Large,
 * Breakpoints.XLarge])`) to read live `@media` match state without pulling in
 * RxJS or Angular DI.
 *
 * No singleton/service layer, no `MediaMatcher`-style webkit workaround (the
 * structural bug it guards against doesn't affect plain `matchMedia` reads
 * the way this helper uses them) — callers invoke this directly from
 * browser-only code (a `useVisibleTask$`, same as every other qwik-cdk
 * browser API) and get an immediate synchronous callback plus live updates,
 * with an unsubscribe function to tear down the underlying `change`
 * listeners.
 */

/** The current match state for a set of queries, mirroring upstream's `BreakpointState`. */
export interface BreakpointState {
  /** Whether ANY of the observed queries currently match. */
  matches: boolean;
  /** Per-query match state, keyed by the exact query string passed in. */
  breakpoints: Record<string, boolean>;
}

/**
 * Observes a set of `@media` queries, invoking `onChange` immediately with
 * the current state and again on every subsequent change. Returns an
 * unsubscribe function.
 *
 * SSR-safe: when `window.matchMedia` isn't available (no `window` at all, or
 * a test/non-browser environment), `onChange` is invoked once synchronously
 * with every query reported as non-matching, and the returned unsubscribe is
 * a no-op — mirroring upstream `MediaMatcher`'s `noopMatchMedia` fallback.
 */
export function observeBreakpoints(
  queries: readonly string[],
  onChange: (state: BreakpointState) => void,
): () => void {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    const breakpoints: Record<string, boolean> = {};
    for (const q of queries) breakpoints[q] = false;
    onChange({matches: false, breakpoints});
    return () => {};
  }

  const mqls = queries.map(q => window.matchMedia(q));

  const emit = () => {
    const breakpoints: Record<string, boolean> = {};
    let matches = false;
    queries.forEach((q, i) => {
      const m = mqls[i].matches;
      breakpoints[q] = m;
      matches = matches || m;
    });
    onChange({matches, breakpoints});
  };

  emit();
  const handler = () => emit();
  for (const mql of mqls) mql.addEventListener('change', handler);

  return () => {
    for (const mql of mqls) mql.removeEventListener('change', handler);
  };
}
