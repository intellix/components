// Public API for @angular-community/qwik-material/progress-spinner.
// See docs/superpowers/specs/2026-07-31-qwik-material-progress-spinner-port-design.md §2.

export type {MatProgressSpinnerColor} from './progress-spinner-color';
export type {MatProgressSpinnerMode} from './progress-spinner-mode';
export type {MatProgressSpinnerConfig} from './progress-spinner-config';
export {
  MAT_PROGRESS_SPINNER_CONFIG,
  useMatProgressSpinnerProvider,
} from './progress-spinner-config';
export {
  MatProgressSpinner,
  MatSpinner,
  type MatProgressSpinnerProps,
  type MatSpinnerProps,
} from './mat-progress-spinner';
