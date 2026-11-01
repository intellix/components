/**
 * Qwik port of upstream `MatDateFormats` + the `MAT_DATE_FORMATS` injection
 * token (`src/material/core/datetime/date-formats.ts`).
 */
import {createContextId} from '@qwik.dev/core';

/** Mirrors upstream `MatDateFormats` exactly — the shape every `Intl.DateTimeFormat`-compatible
 *  format option bag is read from. `timeInput`/`timeOptionLabel` are the two fields
 *  `qwik-material/timepicker` needs; the rest exist for a future date picker. */
export type MatDateFormats = {
  parse: {
    dateInput: unknown;
    timeInput?: unknown;
  };
  display: {
    dateInput: unknown;
    monthLabel?: unknown;
    monthYearLabel: unknown;
    dateA11yLabel: unknown;
    monthYearA11yLabel: unknown;
    timeInput?: unknown;
    timeOptionLabel?: unknown;
  };
};

/**
 * Context id a provider can use to override the format bag every date-aware component reads via
 * `useDateFormats()` (`use-date-adapter.ts`). No provider is wired by `QwikMaterialProvider` yet
 * — no scenario needs a non-default format bag — so this is the always-available extension
 * point for later, matching upstream's naming for drop-in familiarity.
 */
export const MAT_DATE_FORMATS = createContextId<MatDateFormats>('qwikMaterial/dateFormats');
