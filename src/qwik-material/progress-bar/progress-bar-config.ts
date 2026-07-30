import {createContextId} from '@builder.io/qwik';
import type {MatProgressBarColor} from './progress-bar-color';
import type {MatProgressBarMode} from './progress-bar-mode';

/**
 * Defaults applied to every <MatProgressBar> in a subtree. Consumers provide
 * this via <QwikMaterialProvider matProgressBarConfig={...}>. Mirrors upstream
 * MatProgressBarDefaultOptions (src/material/progress-bar/progress-bar.ts:34-47).
 */
export interface MatProgressBarConfig {
  /** Default M2 palette color. Adds the `.mat-<color>` class if set. */
  color?: MatProgressBarColor;
  /** Default mode. Defaults to `'determinate'` when unset. */
  mode?: MatProgressBarMode;
}

/**
 * Context id used by <MatProgressBar> to read config. The id string is exposed
 * publicly and MUST remain stable across releases — consumers may inject it
 * directly in advanced scenarios.
 */
export const MAT_PROGRESS_BAR_CONFIG = createContextId<MatProgressBarConfig>(
  'qwik-material/progress-bar-config',
);
