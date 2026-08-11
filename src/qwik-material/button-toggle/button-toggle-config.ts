import {createContextId} from '@builder.io/qwik';

/**
 * Defaults applied to every MatButtonToggleGroup / MatButtonToggle in a subtree.
 * Consumers provide this via <QwikMaterialProvider matButtonToggleConfig={...}>.
 * Currently empty — the port has no consumer-configurable defaults today. Kept
 * for family shape parity with divider / grid-list / list and to allow future
 * fields (e.g. re-adding an appearance variant) without an API break.
 */
export interface MatButtonToggleConfig {}

/**
 * Context id used by MatButtonToggleGroup to read config. The id string is
 * exposed publicly and MUST remain stable across releases — consumers may
 * inject it directly in advanced scenarios.
 */
export const MAT_BUTTON_TOGGLE_CONFIG = createContextId<MatButtonToggleConfig>(
  'qwik-material/button-toggle-config',
);
