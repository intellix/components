import {createContextId} from '@builder.io/qwik';

/**
 * Defaults applied to every <MatGridList> in a subtree. Consumers provide
 * this via <QwikMaterialProvider matGridListConfig={...}>. Currently empty
 * — the grid-list has no consumer-configurable defaults today. Kept for
 * family shape parity with the other qwik-material components and to
 * allow future fields without an API break.
 */
export interface MatGridListConfig {}

/**
 * Context id used by <MatGridList> to read config. The id string is
 * exposed publicly and MUST remain stable across releases — consumers may
 * inject it directly in advanced scenarios.
 */
export const MAT_GRID_LIST_CONFIG = createContextId<MatGridListConfig>(
  'qwik-material/grid-list-config',
);
