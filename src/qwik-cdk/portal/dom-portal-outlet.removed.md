# Originally not ported: dom-portal-outlet.ts (re-evaluated 2026-11-03)

Original reasoning (pre-11-03): the `DomPortalOutlet` abstraction (imperatively attaching a
`ComponentRef` to an arbitrary DOM node) has no Qwik analogue — `OverlayContainerOutlet` (in
`overlay/`) renders portal entries reactively via JSX instead, which was sufficient for
everything this port needed at the time (overlay content only ever needs to visually float
above the page, not become a literal descendant of some externally-owned DOM node — CSS
positioning, not DOM relocation, covers that case).

**Re-evaluated under Qwik v2** for the blockers/cdk expansion (see `qwik-cdk/portal/SYNC.md`):
a real need exists for attaching content into a DOM node genuinely OUTSIDE the app's own
render tree (e.g. a non-Qwik widget's container), which `OverlayContainerOutlet`'s
render-near-the-root-and-position-with-CSS approach doesn't serve. `<CdkDomPortalOutlet>`
(`dom-portal-outlet.tsx`) now ports the `attachComponentPortal`/`attachTemplatePortal` half
of upstream's `DomPortalOutlet`, using upstream's OWN underlying trick (instantiate normally,
inside the real tree — so context/DI resolves correctly — then physically relocate only the
resulting DOM node) instead of a separate, context-less `render()` call. `useCdkDomPortal()`
(`use-cdk-dom-portal.ts`) separately ports the `DomPortal`/`attachDomPortal` half (moving an
EXISTING, non-Qwik-rendered DOM node). See `SYNC.md` for the full design writeup and its
Playwright verification.
