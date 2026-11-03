# scrolling — Angular CDK sync status

Added 2026-11-03 (blockers/cdk expansion — new entry point). Non-virtual-scroll parts only.
Last synced from upstream: `v21.2.14` (`8fe4d6a8ffcf`).

## Ported items

### `ScrollDispatcher`

- Source: `src/cdk/scrolling/scroll-dispatcher.ts`
- Destination: `scroll-dispatcher.ts`
- Changes from CDK original:
  - `createScrollDispatcher()` factory (object literal + closures) instead of an
    `@Injectable({providedIn: 'root'})` service — same convention as `createFocusMonitor` in
    `qwik-cdk/a11y`.
  - `CdkScrollable` (the concrete directive class upstream's `register()`/
    `getAncestorScrollContainers()` take) → `CdkScrollableHandle`, a minimal structural
    interface (`{element, elementScrolled(listener)}`) — this package has no
    directive-on-a-component concept; `use-cdk-scrollable.ts`'s `useCdkScrollable()` builds
    one for whatever element it's attached to.
  - `scrolled(auditTimeInMs)`/`ancestorScrolled(elementOrRef, auditTimeInMs)` returning
    `Observable<CdkScrollable | void>` → `scrolled(listener): () => void` /
    `ancestorScrolled(element, listener): () => void` (plain callback registration, no RxJS,
    no built-in `auditTime` throttle — a caller that wants one can debounce `listener`
    itself; upstream's default, `20`ms, was a convenience default, not load-bearing
    behavior).
  - `register()` now returns the deregister function directly (in addition to `deregister()`
    remaining separately callable with the same handle) — convenience, not a behavior
    change.
  - The lazy, refcounted document-level `scroll` listener (installed on the first `scrolled()`
    subscriber, torn down once the last one unsubscribes) ported verbatim — same mechanism
    upstream uses via `this._cleanupGlobalListener`/`this._scrolledCount`.
  - `getAncestorScrollContainers()`'s DOM-ancestry walk (`element.parentElement` loop)
    ported verbatim.
  - **Module-level lazy singleton (`shared-instances.ts`), not threaded through
    `qwik-cdk/internals`/`<QwikCdkRoot>`.** See that file's own doc comment for the full
    reasoning — in short: this is actually the MORE faithful translation of upstream's
    "one instance per Angular application" (`providedIn: 'root'`) than a Qwik context would
    be (a context is scoped to whatever subtree sits below its provider, not the whole app),
    and it's safe across SSR requests on a long-running server because the dispatcher's own
    internal `isBrowser` gates mean nothing is ever written to its registries during SSR in
    the first place (matching upstream's own `!platform.isBrowser` short-circuit in
    `scrolled()`). `useCdkScrollable()` only ever calls `register()` from inside a
    `useVisibleTask$` anyway, which is the actual safety net regardless of how the
    dispatcher itself is shared.

### `CdkScrollable` → `useCdkScrollable()` / `scrollable.ts`

- Source: `src/cdk/scrolling/scrollable.ts`
- Destination: `use-cdk-scrollable.ts` (the hook) + `scrollable.ts` (the RTL-normalizing
  scroll-math, as plain functions)
- Changes from CDK original:
  - Directive → directive hook (`qwik-material/core/host-props.ts`'s pattern): returns
    `{hostProps: {ref}, elementRef}` instead of owning a host element.
  - `scrollTo(options)`/`measureScrollOffset(from)` (instance methods) → `scrollToElement(element,
    options, isRtl?)`/`measureScrollOffset(element, from, isRtl?)` plain exported functions —
    same "logic in module functions operating on a value, not stored on an instance"
    convention as `qwik-cdk/collections/use-selection-model.ts`'s mutators. Call them
    directly from your own `$()` handler, passing `scrollable.elementRef.value`.
  - `inject(Directionality, {optional: true})?.value === 'rtl'` → an optional `isRtl?:
    boolean` parameter; when omitted, falls back to reading the element's own computed
    `direction` via `getComputedStyle` (so a caller with no `qwik-cdk/bidi` context wired up
    still gets correct RTL behavior for whatever's actually rendered, rather than silently
    assuming LTR). **Not** wired to `qwik-cdk/bidi`'s `useDirectionality()` directly — that
    hook's own context (`DIRECTIONALITY`) has no provider anywhere in this port today
    (confirmed via repo search 2026-11-03: nothing calls `useContextProvider(DIRECTIONALITY,
    ...)`), so depending on it here would mean `useCdkScrollable()` could start throwing
    (`useContext()`'s no-default overload throws when no provider exists) for any consumer
    who hasn't separately set that up — out of scope to fix as part of adding this entry
    point.
  - `ngOnInit`'s unconditional `this._renderer.listen(this._scrollElement, 'scroll', ...)` +
    `this.scrollDispatcher.register(this)` → both happen inside `useCdkScrollable()`'s
    `useVisibleTask$` (client-only) instead of unconditionally — see `ScrollDispatcher`'s own
    deviation note above for why this has no observable behavior difference from upstream's
    EFFECTIVE (if not literal) SSR behavior.
  - `getRtlScrollAxisType()`/`supportsScrollBehavior()` are NOT re-ported here — they already
    exist, ported verbatim, in `qwik-cdk/platform/features/scrolling.ts` (part of this
    port's existing `platform` entry point, confirmed 2026-11-03); `scrollable.ts` imports
    them from there directly.

### `ViewportRuler`

- Source: `src/cdk/scrolling/viewport-ruler.ts`
- Destination: `viewport-ruler.ts`
- Changes from CDK original:
  - `createViewportRuler()` factory instead of an `@Injectable({providedIn: 'root'})`
    service — same convention as above. Also exposed via `getSharedViewportRuler()`
    (`shared-instances.ts`) for the same "one per application" reasoning as
    `ScrollDispatcher`.
  - `change(throttleTime)` returning `Observable<Event>` → `onChange(listener): () => void`
    (plain callback registration, no RxJS, no built-in `auditTime` throttle — same
    reasoning as `ScrollDispatcher.scrolled()`'s identical deviation above).
  - `_getWindow()`'s `this._document.defaultView || window` simplified to the bare global
    `window` — this port has no injected-`DOCUMENT`-token concept to fall back from (every
    other browser-only check in this package reads the bare globals directly, gated by
    `isBrowser`).
  - Everything else (the cached viewport size invalidated on resize/orientationchange, the
    `documentElement.getBoundingClientRect()`-based scroll-position calculation that works
    around the Chrome/Firefox `document.body`-vs-`documentElement` disagreement) ported
    verbatim.

## Overlay integration — what overlay needs to call (or doesn't)

**Nothing.** `qwik-cdk/overlay`'s `RepositionScrollStrategy`/`CloseScrollStrategy`
(`overlay/scroll/reposition-scroll-strategy.ts`, `overlay/scroll/close-scroll-strategy.ts`,
read but NOT modified as part of adding this entry point — overlay is owned by a different
workstream) each install their OWN single `document.addEventListener('scroll', handler,
{capture: true, passive: true})`. A capture-phase listener on `document` fires for every
`scroll` event dispatched anywhere in the document during the capture phase — including a
non-bubbling `scroll` event fired on a scrollable DESCENDANT element — so this already
catches "the user scrolled inside some scrollable ancestor of the overlay's trigger" with NO
explicit registration step, which is MORE general than this entry point's
`ScrollDispatcher.ancestorScrolled()` (which only notices scrolling on elements that were
explicitly registered via `useCdkScrollable()`/`ScrollDispatcher.register()`). Confirmed by
reading both scroll-strategy files: neither imports anything from `qwik-cdk/scrolling`, and
neither needs to — their existing mechanism already has full coverage. This entry point
exists for a DIFFERENT need: a consumer's own component that wants upstream's actual
`ScrollDispatcher`/`cdkScrollable` registration-based API (e.g. to know WHICH scrollable
fired, not just "something scrolled").

## Intentionally not ported (virtual scroll — out of scope)

- `cdk-virtual-scroll-viewport` (`virtual-scroll-viewport.ts`/`.html`/`.scss`), `*cdkVirtualFor`
  (`virtual-for-of.ts`), `VirtualScrollStrategy`/`FixedSizeVirtualScrollStrategy`
  (`virtual-scroll-strategy.ts`, `fixed-size-virtual-scroll.ts`), `VirtualScrollRepeater`
  (`virtual-scroll-repeater.ts`), `CdkVirtualScrollable`/`CdkVirtualScrollableElement`/
  `CdkVirtualScrollableWindow` (`virtual-scrollable*.ts`) — virtual scrolling has no Qwik
  structural-directive equivalent to build `*cdkVirtualFor` on, and is explicitly out of
  scope per this port's design spec. None of these files are touched or referenced by
  anything in this entry point.
- `CdkScrollingModule` (`scrolling-module.ts`) — Qwik has no module concept.

## Open deviations

- `ScrollDispatcher`/`ViewportRuler` are process-wide module singletons rather than
  per-`<QwikCdkRoot>`-subtree context values — see `ScrollDispatcher`'s deviation note above.
  An app that genuinely needs two independent dispatchers (e.g. two separate embedded
  widgets that must never see each other's scroll events) isn't served by this; no scenario
  in this port needs that isolation.
- `useCdkScrollable()`'s RTL handling doesn't read `qwik-cdk/bidi`'s `Directionality` context
  (nothing in this port provides it today) — see `CdkScrollable`'s deviation note above.
