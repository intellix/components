// Public API for @angular-community/qwik-material/sidenav.
// See docs/superpowers/specs/2026-10-27-qwik-material-dom-parity-remediation-design.md.

export type {MatSidenavConfig} from './sidenav-config';
export {MAT_SIDENAV_CONFIG} from './sidenav-config';

export type {MatDrawerMode, MatDrawerPosition} from './drawer-state';

export {MatDrawer, MatSidenav, type MatDrawerProps, type MatSidenavProps} from './mat-drawer';
export {
  MatDrawerContent,
  MatSidenavContent,
  type MatDrawerContentProps,
} from './mat-drawer-content';
export {
  MatDrawerContainer,
  MatSidenavContainer,
  type MatDrawerContainerProps,
} from './mat-drawer-container';
