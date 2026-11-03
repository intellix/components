# portal — Sync notes (Angular CDK → qwik-cdk)

**Source:** `src/cdk/portal/` (Angular CDK)
**Strategy:** Collapsed port — only the minimal surface needed by the overlay/dialog stack,
plus (2026-11-03) a re-evaluation of the DOM-portal half under Qwik v2.

## Deviations

| Angular CDK | qwik-cdk | Reason |
|---|---|---|
| `Portal` abstract class + `ComponentPortal<T>`, `TemplatePortal<C>`, `DomPortal` subclasses | `Portal<P>` plain interface (in-place rendering) + `useCdkDomPortal()`'s plain element refs (moving existing DOM) | No class hierarchy needed; Qwik components are passed by reference directly, existing DOM nodes by `Signal<Element>` ref |
| `PortalOutlet` interface | Intentionally not ported | Imperative attach/detach API has no Qwik analogue |
| `BasePortalOutlet` abstract class | Intentionally not ported | Imperative lifecycle has no Qwik analogue |
| `DomPortalOutlet.attachComponentPortal`/`attachTemplatePortal` | `<CdkDomPortalOutlet>` (2026-11-03 re-evaluation, see below) | Render normally (full context), physically relocate the resulting DOM node — same trick upstream itself uses |
| `DomPortalOutlet.attachDomPortal` / `DomPortal` | `useCdkDomPortal()` (2026-11-03 re-evaluation, see below) | Direct port — moving a pre-existing DOM node has no Qwik-rendering concern to translate |
| `CdkPortal` directive | Intentionally not ported | No structural directives in Qwik |
| `CdkPortalOutlet` directive | Replaced by `CdkPortalOutlet` component in portal-outlet.tsx | Qwik uses components, not directives |

## Kept (pre-existing, unchanged)

- `Portal<P>` — a plain `{ Component, props }` interface; the single unit of portalling for
  **in-place** rendering.
- `CdkPortalOutlet` — a Qwik component that renders `<portal.Component {...portal.props}/>`
  when a portal is provided, or `<Slot/>` otherwise. No DOM relocation — see `portal-outlet.tsx`.

## 2026-11-03 — `DomPortalOutlet` re-evaluation (blockers/cdk expansion)

Revisits `dom-portal-outlet.removed.md`'s original "no Qwik analogue" call — read that file
first for why the original decision was reasonable at the time (overlay's own needs were
fully served by `OverlayContainerOutlet`'s render-near-the-root-plus-CSS approach, which
never needs the content to be a literal DOM descendant of anything the app doesn't control).

### `useCdkDomPortal()` — `DomPortal`/`attachDomPortal`

- Source: `src/cdk/portal/portal.ts`'s `DomPortal`, `src/cdk/portal/dom-portal-outlet.ts`'s
  `attachDomPortal`
- Destination: `use-cdk-dom-portal.ts`
- A direct, low-risk port: moves an element Qwik ISN'T itself reactively rendering (a ref to
  some pre-existing DOM subtree — e.g. a third-party widget) into a target element, and
  restores it to its exact original position via an inserted comment anchor (`cdk-dom-portal`,
  same name/technique as upstream's own `anchorNode`) when detached. `enabled: Signal<boolean>`
  replaces imperative `attach()`/`detach()` calls; `attached: Signal<boolean>` replaces
  `hasAttached()`. Runs entirely inside a `useVisibleTask$` (client-only — moving DOM nodes
  around is meaningless during SSR, which has no live document to manipulate; matches every
  other browser-only engine in this package).
- **Why this is safe with no further verification needed beyond unit-level reasoning:** the
  moved element has no Qwik vnode of its own (it was never rendered BY Qwik — it's handed in
  by `Signal<Element>` ref, exactly like a focus target or any other externally-owned DOM
  node this package already deals with elsewhere), so there is no Qwik-side bookkeeping for a
  physical DOM move to ever disturb.

### `<CdkDomPortalOutlet>` — `DomPortalOutlet.attachComponentPortal`/`attachTemplatePortal`

- Source: `src/cdk/portal/dom-portal-outlet.ts`'s `attachComponentPortal`/`attachTemplatePortal`
- Destination: `dom-portal-outlet.tsx`
- **The core problem this re-evaluation had to solve:** attaching Qwik-RENDERED content (not
  pre-existing DOM) into an arbitrary external node, while keeping Qwik context working for
  it (the task motivating this entry point explicitly calls this out: "apps attach content
  that reads app contexts"). Qwik v2's own `render(parent, jsxNode)` (`@qwik.dev/core`) looks
  like the obvious tool — but it creates an INDEPENDENT container with no vnode-ancestor link
  back to wherever it was called from, so nothing provided by an ancestor `useContextProvider()`
  in the calling tree would be visible to `useContext()` inside that `jsxNode` at all. Rejected
  for that reason — it would satisfy "attach somewhere arbitrary" while silently failing
  "context still works," which is explicitly the harder, load-bearing half of the requirement.
- **The fix: do exactly what upstream's OWN `attachComponentPortal` already does.** Upstream's
  own comment gives it away: "At this point the component has been instantiated [normally,
  inside the real Angular injector/view tree — context/DI already resolved correctly], so we
  move it to the location in the DOM where we want it to be rendered." Translated directly:
  `<CdkDomPortalOutlet>` is placed as an ORDINARY descendant wherever the calling app wants it
  (so its `<Slot/>` content sees every ancestor `useContextProvider()` normally, exactly like
  any other nested component — no bridging/re-providing needed, because nothing special
  happens to the vnode tree at all), and a `useVisibleTask$` physically relocates only the
  real DOM node (a wrapper `<div>` holding the slotted content) into `target` once both are
  mounted. Restored to its natural tree position on cleanup/unmount via a captured
  `(parentNode, nextSibling)` pair.
- **Two genuine Qwik v2 gotchas caught live by the `cdk-portal/dom-outlet` dev-app scenario's
  Playwright spec** (`specs/cdk-portal/functional.spec.ts`) — reasoning alone would have
  shipped both bugs:
  1. **First attempt used a plain `useTask$` tracking `wrapperRef.value`** (the exact shape
     `qwik-cdk/a11y`'s `createFocusTrap`/`use-focus-trap.ts` uses for its own client-only
     work: `track(() => elementRef.value)`, then act once it's populated). Confirmed live
     this NEVER reruns on the client for THIS component, even once the ref populates on
     resume — unlike `useFocusTrap`'s consumers, which are always mounted FRESH, client-side,
     in direct response to a real interaction (opening a dialog), so their tasks run as part
     of that same client-side mount — not because a tracked ref changed in isolation.
     `<CdkDomPortalOutlet>` here is part of the page's INITIAL content with no interaction
     ever triggering it, and Qwik's resumability model does not re-invoke a plain `useTask$`
     just because a ref it tracks later populates, with nothing else asking it to wake up.
     Fixed by switching to `useVisibleTask$`, whose `on:qvisible` registration IS the
     explicit "wake this up with no interaction needed" mechanism Qwik provides for exactly
     this situation.
  2. **The wrapper was originally `<div style="display: contents">`** (to avoid giving it any
     box of its own, matching upstream's `outletElement` never being a synthesized wrapper at
     all). Confirmed live: an element with `display: contents` generates no layout box, so it
     never fires ANY `useVisibleTask$`'s IntersectionObserver-based visibility trigger at all
     — the relocation silently never happened, with no error. Fixed by using a plain `<div>`
     (one harmless extra block-level box) — the one upstream-fidelity trade-off this
     mechanism needs that upstream itself doesn't.
- **Not an issue here (unlike `createFocusTrap`'s anchors):** Qwik v2's "a `ref` can fire
  before the element is connected" race. That race is specifically about querying a
  DIFFERENT, not-yet-committed element's CHILDREN from a microtask-deferred callback; here,
  by the time `useVisibleTask$` runs at all, its own component's root (the wrapper) is
  already committed, and `target`'s own ref is read fresh via `track()` on every run.
- **Verified live** (not just reasoned about) via the `cdk-portal/dom-outlet` dev-app scenario
  + Playwright functional spec (`src/qwik-cdk-parity-tests/specs/cdk-portal/
  functional.spec.ts`, passing 3× consecutively):
  1. Content renders inside `target` (a DOM node the outlet's own component tree doesn't
     otherwise touch) once both are mounted.
  2. A context value provided by an ancestor ABOVE `<CdkDomPortalOutlet>` is read correctly
     by `useContext()` inside the slotted content — the specific requirement a `render()`-
     based approach would have failed.
  3. A signal update inside the slotted content AFTER the DOM move still patches the live,
     relocated DOM correctly (confirms Qwik's own reactivity isn't disturbed by the move —
     the one thing `createFocusTrap`'s prior art with static, never-patched-again anchors
     didn't already prove), and the content is still inside `target` afterward.
  4. Toggling the outlet off (an `onClick$` conditionally rendering `{showOutlet.value &&
     <CdkDomPortalOutlet>...}`) unmounts it and removes the relocated content from `target`
     with no orphaned DOM, without corrupting a sibling element re-rendered by the same
     click. Toggling back on relocates it again from scratch, reading the same ancestor
     context correctly.
  - **Caught by this exact test, fixed, and worth flagging as its own gotcha:** re-attaching
    checked SYNCHRONOUSLY right after the click is flaky — `useVisibleTask$` firing is
    asynchronous relative to the click (content renders in place first; the relocation
    happens moments later once the task's visibility trigger resolves), so a same-tick DOM
    check can race ahead of it. The spec polls (`expect.poll(...)`) rather than checking
    once immediately after the click. A consumer of `<CdkDomPortalOutlet>` that needs to know
    the EXACT moment relocation completes has no synchronous signal for it today (no
    `onAttached$` callback) — not needed by this scenario, noted here as a gap for a future
    consumer that does.
- **Not ported:** `ApplicationRef.attachView`/`detachView`, `EnvironmentInjector`,
  `ComponentRef`/`EmbeddedViewRef` — all Angular-specific change-detection-tree plumbing with
  no Qwik equivalent at all; irrelevant once "instantiate normally, then relocate the DOM
  node" means Qwik's OWN normal component lifecycle already handles everything they exist for.
  `viewContainerRef`/`projectableNodes`/`bindings` (the `ViewContainerRef`-based alternate path
  in `attachComponentPortal`) — Qwik has no `ViewContainerRef` concept; `<Slot/>`-based content
  projection (already how the in-place `CdkPortalOutlet` works) is the only "where does the
  content come from" mechanism needed.
