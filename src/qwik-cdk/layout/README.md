# qwik-cdk/layout

Minimal port of `@angular/cdk/layout`'s breakpoint matching — just enough for
`qwik-material/bottom-sheet`'s container to toggle its
`mat-bottom-sheet-container-{medium,large,xlarge}` classes against the real
viewport, without pulling in RxJS, Angular DI, or a singleton service layer.

- `Breakpoints` — verbatim copy of upstream's media-query constants.
- `observeBreakpoints(queries, onChange)` — SSR-safe `matchMedia` observer:
  invokes `onChange` immediately with the current match state and again on
  every subsequent change; returns an unsubscribe function. Call it from
  browser-only code (a `useVisibleTask$`).

See `SYNC.md` for what's ported vs. intentionally simplified relative to
`BreakpointObserver`/`MediaMatcher`.
