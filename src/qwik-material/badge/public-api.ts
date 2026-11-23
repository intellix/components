// Public API for @angular-community/qwik-material/badge.
// See docs/superpowers/specs/2026-07-27-qwik-material-badge-port-design.md §2.

export type {MatBadgeColor} from './badge-color';
export type {MatBadgePosition} from './badge-position';
export type {MatBadgeSize} from './badge-size';
export type {MatBadgeConfig} from './badge-config';
export {MAT_BADGE_CONFIG, useMatBadgeProvider} from './badge-config';
export {MatBadge, type MatBadgeProps} from './mat-badge';
export {matBadge, matBadgeStyleVariants, useMatBadge} from './use-mat-badge';
export type {UseMatBadgeProps, MatBadgeHook} from './use-mat-badge';

// The entry point's CSS, registered by its components; see badge-styles.ts.
export {type MatBadgeStyleVariant, useMatBadgeStyles} from './badge-styles';
