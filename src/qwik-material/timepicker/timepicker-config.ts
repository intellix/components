import {createContextId} from '@qwik.dev/core';

/**
 * Defaults applied to every `useMatTimepicker()`/`<MatTimepickerToggle>` in a subtree that
 * doesn't set its own. Mirrors upstream `MatTimepickerConfig` + `MAT_TIMEPICKER_CONFIG`
 * injection token (`src/material/timepicker/util.ts`). Consumers provide this via
 * `<QwikMaterialProvider matTimepickerConfig={{...}}>`.
 */
export interface MatTimepickerConfig {
  /** Default interval for every timepicker in the subtree — an amount of seconds (e.g. 90) or a
   *  number with a unit (e.g. `'45m'`). See `parseInterval` (`timepicker-util.ts`). */
  interval?: string | number;
  /** Whether ripples inside the timepicker panel/toggle should be disabled by default. */
  disableRipple?: boolean;
}

/** Context id used by `useMatTimepicker()`/`<MatTimepickerToggle>` to read config. The id string
 *  is exposed publicly and MUST remain stable across releases. */
export const MAT_TIMEPICKER_CONFIG = createContextId<MatTimepickerConfig>(
  'qwik-material/timepicker-config',
);
