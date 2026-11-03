# @angular-community/qwik-cdk/scrolling

Qwik port of [@angular/cdk/scrolling](https://github.com/angular/components/tree/main/src/cdk/scrolling) —
non-virtual-scroll parts only (see `SYNC.md` for why `cdk-virtual-scroll-viewport` is out of
scope for this port).

- `getSharedScrollDispatcher()` / `createScrollDispatcher()` — register scrollables, listen
  for any-scrollable-scrolled / ancestor-scrolled.
- `useCdkScrollable()` — directive-hook form of `[cdkScrollable]`; spread `hostProps` onto a
  scrollable element to register it. `scrollToElement()`/`measureScrollOffset()`
  (`scrollable.ts`) are the RTL-normalizing scroll-math helpers, callable on the element
  `useCdkScrollable()` gives you.
- `getSharedViewportRuler()` / `createViewportRuler()` — `getViewportSize`/`getViewportRect`/
  `getViewportScrollPosition`/`onChange`.

**Overlay integration:** `qwik-cdk/overlay`'s own scroll-strategy listeners
(`RepositionScrollStrategy`/`CloseScrollStrategy`) already use a single document-level,
capture-phase `scroll` listener, which catches scrolling inside ANY scrollable ancestor
without needing explicit registration — they don't call into this entry point and don't need
to. This entry point is for everything ELSE that wants `ScrollDispatcher`'s registration
model (e.g. your own scroll-aware component).

See `SYNC.md` for every deviation from upstream.
