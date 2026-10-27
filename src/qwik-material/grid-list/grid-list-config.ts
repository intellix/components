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
 * Context id reserved for a future `<MatGridList>` config read. Not
 * currently consumed: `<MatGridList>` is a plain function, not a
 * `component$` (see mat-grid-list.tsx's header comment), so it can't call
 * `useContext` — and there are no fields here yet to read anyway. The id
 * string is still exposed publicly and MUST remain stable across releases.
 */
export const MAT_GRID_LIST_CONFIG = createContextId<MatGridListConfig>(
  'qwik-material/grid-list-config',
);
