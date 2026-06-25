# Overlay — CDK Sync Notes

## Ported files

| Qwik file | CDK source | Notes |
|-----------|-----------|-------|
| `overlay-config.ts` | `src/cdk/overlay/overlay-config.ts` | Verbatim port. Angular-specific `@angular/core` imports dropped. `NoopScrollStrategy` default for `scrollStrategy` dropped (not ported yet — Task 14+). Class-level property defaults (`hasBackdrop`, `panelClass`, `backdropClass`, `disposeOnNavigation`) removed so the class is plain-data with no runtime dependencies. `Direction`/`Directionality` imported from `../bidi/directionality` instead of `@angular/cdk/bidi`. `usePopover` field retained (future use). |
| `position/connected-position.ts` | `src/cdk/overlay/position/connected-position.ts` | Verbatim copy. `ConnectedPosition` interface added from `flexible-connected-position-strategy.ts` (it belongs with connected-position types). |
| `position/position-strategy.ts` | `src/cdk/overlay/position/position-strategy.ts` | Forward-declaration pattern — uses `PositionStrategyOverlayHandle` instead of `OverlayRef` (which doesn't exist until Task 16). `getPopoverInsertionPoint` added for popover support. |
| `scroll/scroll-strategy.ts` | `src/cdk/overlay/scroll/scroll-strategy.ts` | Forward-declaration pattern — uses `ScrollStrategyOverlayHandle` instead of `OverlayRef`. `getMatScrollStrategyAlreadyAttachedError` helper omitted (can be added alongside concrete strategies). |
| `overlay-context.ts` | n/a (Qwik-specific) | `OverlayContextOverride<T>` type for passing Qwik context values into overlay component trees. |

## Deferred

- Concrete scroll strategies (`NoopScrollStrategy`, `BlockScrollStrategy`, etc.) — Task 14+
- Concrete position strategies (`FlexibleConnectedPositionStrategy`, etc.) — Task 15+
- `OverlayRef` — Task 16
- Once `OverlayRef` exists, `PositionStrategyOverlayHandle` / `ScrollStrategyOverlayHandle` can be merged or replaced with the real type.
