# Sync log: layout

Added while porting `qwik-material/bottom-sheet`, which needs
`BreakpointObserver.observe([Breakpoints.Medium, Breakpoints.Large,
Breakpoints.XLarge])`'s live-viewport class toggling
(`mat-bottom-sheet-container-{medium,large,xlarge}`) and nothing else from
`@angular/cdk/layout`.

Source: `src/cdk/layout/{breakpoints,breakpoints-observer,media-matcher}.ts`.

## Synced

- `breakpoints.ts` ← `breakpoints.ts` (verbatim data map; no platform code to adapt).

## Intentionally not ported — collapsed into `breakpoint-observer.ts`

- `BreakpointObserver` (`@Service()` class, RxJS `Observable`s, `isMatched()`,
  per-query `Map` cache, `takeUntil(destroySubject)` teardown) → replaced by a
  single plain function, `observeBreakpoints(queries, onChange)`, with a
  callback instead of an `Observable` and a returned unsubscribe function
  instead of an `ngOnDestroy`-driven `Subject`. No query de-duplication cache
  (every call sets up its own fresh `MediaQueryList`s) — fine for this
  codebase's one caller (one container per open bottom sheet); revisit if a
  second caller needs the sharing.
- `MediaMatcher` (`@Service()`, `Platform`/`CSP_NONCE` injection, the
  WebKit/Blink `createEmptyStyleRule()` workaround for `matchMedia` not firing
  without at least one matching CSS rule) → `observeBreakpoints()` calls
  `window.matchMedia` directly, with a plain SSR/non-browser fallback (matches
  upstream's `noopMatchMedia`: every query reports non-matching). The
  WebKit/Blink workaround is not reproduced — the real browsers this is
  tested against (Playwright's Chromium) don't need it, and the component
  using this only needs synchronous outright `matches` reads, not reliable
  `change` event firing on a userland-injected stylesheet.
- `mql.addListener`/`removeListener` (deprecated, still used upstream for
  Safari<14 compat) → `addEventListener('change', …)`/`removeEventListener`
  (standard `MediaQueryList` API; this codebase's browser matrix doesn't need
  the deprecated fallback).
- `splitQueries()` (comma-separated query string splitting) → not needed;
  callers pass an array of already-distinct query strings.
- `debounceTime(0)` on subsequent emissions → not reproduced; `observeBreakpoints`
  re-evaluates and emits synchronously on every `change` event. The one caller
  only cares about final class state, not update-frequency coalescing.

## Pipeline

Run `pnpm test:qwik-cdk` from the repo root to verify the package (no specs
yet — pure data + a small DOM-reading helper, exercised indirectly via
`qwik-material/bottom-sheet`'s Playwright specs).
