import {createContextId, useContextProvider} from '@qwik.dev/core';

/**
 * Defaults applied to every `useMatTimepicker()`/`<MatTimepickerToggle>` in a subtree that
 * doesn't set its own. Mirrors upstream `MatTimepickerConfig` + `MAT_TIMEPICKER_CONFIG`
 * injection token (`src/material/timepicker/util.ts`). Consumers provide this via
 * `useMatTimepickerProvider({...})`.
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
  'qwikMaterial/timepickerConfig',
);

/**
 * Provides {@link MAT_TIMEPICKER_CONFIG} for this subtree — call once near the root (or anywhere
 * deeper, to override just that part of the tree) so every useMatTimepicker() / MatTimepickerToggle
 * descendant resolves its defaults from `config` instead of its own hardcoded fallback.
 * Only this one context is provided; every other qwik-material configuration context
 * stays whatever an ancestor (or nothing) already provided — see README.md's
 * "Configuring the library" section.
 */
export function useMatTimepickerProvider(config?: MatTimepickerConfig): void {
  useContextProvider(MAT_TIMEPICKER_CONFIG, config ?? {});
}
