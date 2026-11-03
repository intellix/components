# @angular-community/qwik-cdk/portal

Qwik port of [@angular/cdk/portal](https://github.com/angular/components/tree/main/src/cdk/portal).

- `Portal<P> = { Component, props }` + `<CdkPortalOutlet>` — renders an arbitrary Qwik
  component **in place** (no DOM relocation).
- `<CdkDomPortalOutlet target={...}>` — re-evaluation of upstream's `DomPortalOutlet`
  (attaching freshly-rendered content into an arbitrary DOM element outside the app tree,
  2026-11-03): renders its children normally (so every ancestor context still resolves),
  then physically relocates the resulting DOM node into `target` once mounted.
- `useCdkDomPortal(elementRef, targetRef)` — re-evaluation of upstream's `DomPortal` (moving
  an EXISTING, non-Qwik-rendered DOM node into a target and back on detach, via an
  anchor-comment restore).

See `SYNC.md` for every deviation from upstream and `dom-portal-outlet.removed.md` for the
original (2026-pre-11-03) decision this re-evaluation revisits.
