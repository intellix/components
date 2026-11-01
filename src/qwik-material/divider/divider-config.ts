import {createContextId} from '@qwik.dev/core';

/**
 * Defaults applied to every <MatDivider> in a subtree. Consumers provide this
 * via <QwikMaterialProvider matDividerConfig={...}>. Currently empty — the
 * divider has no consumer-configurable defaults today. Kept for family shape
 * parity with the other qwik-material components and to allow future fields
 * without an API break.
 */
export interface MatDividerConfig {}

/**
 * Context id used by <MatDivider> to read config. The id string is exposed
 * publicly and MUST remain stable across releases — consumers may inject it
 * directly in advanced scenarios.
 */
export const MAT_DIVIDER_CONFIG = createContextId<MatDividerConfig>('qwik-material/divider-config');
