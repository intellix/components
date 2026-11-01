import {createContextId} from '@qwik.dev/core';
import type {MatProgressSpinnerColor} from './progress-spinner-color';

/**
 * Defaults applied to every <MatProgressSpinner> / <MatSpinner> in a subtree.
 * Consumers provide this via <QwikMaterialProvider matProgressSpinnerConfig={...}>.
 * Mirrors upstream MatProgressSpinnerDefaultOptions
 * (src/material/progress-spinner/progress-spinner.ts:26-44), minus the obscure
 * `_forceAnimations` DI toggle (§6 deviation #5).
 */
export interface MatProgressSpinnerConfig {
  /** Default M2 palette color. Adds the `.mat-<color>` class if set. */
  color?: MatProgressSpinnerColor;
  /** Default pixel diameter of the spinner. Falls back to 100 at render time. */
  diameter?: number;
  /** Default pixel stroke width. Falls back to diameter / 10 at render time. */
  strokeWidth?: number;
}

/**
 * Context id used by <MatProgressSpinner> and <MatSpinner> to read config. The
 * id string is exposed publicly and MUST remain stable across releases —
 * consumers may inject it directly in advanced scenarios.
 */
export const MAT_PROGRESS_SPINNER_CONFIG = createContextId<MatProgressSpinnerConfig>(
  'qwikMaterial/progressSpinnerConfig',
);
