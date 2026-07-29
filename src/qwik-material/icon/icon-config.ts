import {createContextId} from '@builder.io/qwik';
import type {MatIconColor} from './icon-color';

/**
 * Defaults applied to every <MatIcon> in a subtree. Consumers provide this via
 * <QwikMaterialProvider matIconConfig={...}>. Mirrors upstream
 * MatIconDefaultOptions (src/material/icon/icon.ts:31-42).
 */
export interface MatIconConfig {
  /** Default M2 palette color. Adds the `.mat-<color>` class if set. */
  color?: MatIconColor;
  /** Default font-set class(es) applied to the host in font mode. */
  fontSet?: string;
}

/**
 * Context id used by <MatIcon> to read config. The id string is exposed
 * publicly and MUST remain stable across releases — consumers may inject it
 * directly in advanced scenarios.
 */
export const MAT_ICON_CONFIG = createContextId<MatIconConfig>('qwik-material/icon-config');
