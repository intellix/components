import {createContextId} from '@qwik.dev/core';

/**
 * Defaults applied to every MatList / MatNavList / MatActionList / MatSubheader
 * in a subtree. Consumers provide this via
 * <QwikMaterialProvider matListConfig={...}>. Currently empty — the display
 * list has no consumer-configurable defaults today. Kept for family shape
 * parity with the other qwik-material components (divider, grid-list) and to
 * allow future fields without an API break.
 */
export interface MatListConfig {}

/**
 * Context id used by MatList / MatNavList / MatActionList / MatSubheader to
 * read config. The id string is exposed publicly and MUST remain stable
 * across releases — consumers may inject it directly in advanced scenarios.
 */
export const MAT_LIST_CONFIG = createContextId<MatListConfig>('qwikMaterial/listConfig');
