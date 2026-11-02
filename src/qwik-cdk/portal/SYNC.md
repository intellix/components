# portal — Sync notes (Angular CDK → qwik-cdk)

**Source:** `src/cdk/portal/` (Angular CDK)
**Strategy:** Collapsed port — only the minimal surface needed by the overlay/dialog stack is kept.

## Deviations

| Angular CDK | qwik-cdk | Reason |
|---|---|---|
| `Portal` abstract class + `ComponentPortal<T>`, `TemplatePortal<C>`, `DomPortal` subclasses | `Portal<P>` plain interface | No class hierarchy needed; Qwik components are passed by reference directly |
| `PortalOutlet` interface | Intentionally not ported | Imperative attach/detach API has no Qwik analogue |
| `BasePortalOutlet` abstract class | Intentionally not ported | Imperative lifecycle has no Qwik analogue |
| `DomPortalOutlet` | Intentionally not ported (see dom-portal-outlet.removed.md) | Replaced by reactive JSX rendering in overlay/ |
| `CdkPortal` directive | Intentionally not ported | No structural directives in Qwik |
| `CdkPortalOutlet` directive | Replaced by `CdkPortalOutlet` component in portal-outlet.tsx | Qwik uses components, not directives |

## Kept

- `Portal<P>` — a plain `{ Component, props }` interface; the single unit of portalling in qwik-cdk.
- `CdkPortalOutlet` — a Qwik component that renders `<portal.Component {...portal.props}/>` when a portal is provided, or `<Slot/>` otherwise.
