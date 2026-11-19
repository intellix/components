// Public API for @angular-community/qwik-material/progress-bar.
// See docs/superpowers/specs/2026-07-29-qwik-material-progress-bar-port-design.md §2.

export type {MatProgressBarColor} from './progress-bar-color';
export type {MatProgressBarMode} from './progress-bar-mode';
export type {MatProgressBarConfig} from './progress-bar-config';
export {MAT_PROGRESS_BAR_CONFIG, useMatProgressBarProvider} from './progress-bar-config';
export {MatProgressBar, type MatProgressBarProps} from './mat-progress-bar';

// The entry point's CSS, registered by its components; see progress-bar-styles.ts.
export {useMatProgressBarStyles} from './progress-bar-styles';
