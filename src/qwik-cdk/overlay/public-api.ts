export {OverlayConfig} from './overlay-config';
export {OVERLAY_REGISTRY} from './overlay-registry';
export type {OverlayEntry, OverlayRegistry, OverlayEntryState} from './overlay-registry';
export {OverlayContainerOutlet} from './overlay-container-outlet';
export type {PositionStrategy, PositionStrategyOverlayHandle} from './position/position-strategy';
export type {ScrollStrategy, ScrollStrategyOverlayHandle} from './scroll/scroll-strategy';
export type {OverlayContextOverride} from './overlay-context';
export type {
  ConnectedPosition,
  ConnectionPositionPair,
  ConnectedOverlayPositionChange,
  ScrollingVisibility,
  HorizontalConnectionPos,
  VerticalConnectionPos,
  ViewportMargin,
  OriginConnectionPosition,
  OverlayConnectionPosition,
} from './position/connected-position';
export {validateVerticalPosition, validateHorizontalPosition} from './position/connected-position';
export {OverlayRef} from './overlay-ref';
export type {Overlay} from './overlay';
export {OVERLAY, useOverlay, createOverlayService} from './overlay';
export type {OverlayContainer} from './overlay-container';
export {OVERLAY_CONTAINER, useOverlayContainer, DefaultOverlayContainer} from './overlay-container';
export type {OverlayContainerOptions} from './overlay-container';
