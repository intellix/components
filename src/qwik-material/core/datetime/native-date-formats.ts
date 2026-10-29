/**
 * Qwik port of upstream `MAT_NATIVE_DATE_FORMATS`
 * (`src/material/core/datetime/native-date-formats.ts`) — byte-identical
 * format options, paired with `createNativeDateAdapter()`.
 */
import type {MatDateFormats} from './date-formats';

export const MAT_NATIVE_DATE_FORMATS: MatDateFormats = {
  parse: {
    dateInput: null,
    timeInput: null,
  },
  display: {
    dateInput: {year: 'numeric', month: 'numeric', day: 'numeric'},
    timeInput: {hour: 'numeric', minute: 'numeric'},
    monthYearLabel: {year: 'numeric', month: 'short'},
    dateA11yLabel: {year: 'numeric', month: 'long', day: 'numeric'},
    monthYearA11yLabel: {year: 'numeric', month: 'long'},
    timeOptionLabel: {hour: 'numeric', minute: 'numeric'},
  },
};
