import {createContextId, useContextProvider} from '@qwik.dev/core';
import type {MatProgressBarColor} from './progress-bar-color';
import type {MatProgressBarMode} from './progress-bar-mode';

/**
 * Defaults applied to every <MatProgressBar> in a subtree. Consumers provide
 * this via `useMatProgressBarProvider(...)`. Mirrors upstream
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
  'qwikMaterial/progressBarConfig',
);

/**
 * Provides {@link MAT_PROGRESS_BAR_CONFIG} for this subtree — call once near the root (or anywhere
 * deeper, to override just that part of the tree) so every MatProgressBar
 * descendant resolves its defaults from `config` instead of its own hardcoded fallback.
 * Only this one context is provided; every other qwik-material configuration context
 * stays whatever an ancestor (or nothing) already provided — see README.md's
 * "Configuring the library" section.
 */
export function useMatProgressBarProvider(config?: MatProgressBarConfig): void {
  useContextProvider(MAT_PROGRESS_BAR_CONFIG, config ?? {});
}
