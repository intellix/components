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
 * `useDateFormats()` (`use-date-adapter.ts`). `useMatDateAdapterProvider()`'s `formats` key
 * wires this, app-wide or per subtree (2026-11-03) — see `datepicker/SYNC.md`'s "DateAdapter /
 * MAT_DATE_FORMATS / MAT_DATE_LOCALE / dateClass" section. Plain, serializable data (strings/
 * `Intl.DateTimeFormatOptions`-shaped objects — never a function), so it needs no special
 * resume handling, unlike `MAT_DATE_ADAPTER_FACTORY`.
 */
export const MAT_DATE_FORMATS = createContextId<MatDateFormats>('qwikMaterial/dateFormats');
