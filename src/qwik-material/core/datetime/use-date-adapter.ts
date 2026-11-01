/**
 * Render-time context accessors for `DateAdapter`/`MatDateFormats` — see
 * `date-adapter.ts`'s and `native-date-adapter.ts`'s module doc comments.
 *
 * No `QwikMaterialProvider` prop wires `MAT_DATE_ADAPTER`/`MAT_DATE_FORMATS`
 * yet (no scenario needs a non-default locale/format bag), so both hooks
 * always fall back to the plain `en-US` native singleton today — the same
 * "safe, always-available default via `useContext`'s fallback parameter"
 * pattern `useAnimationsDisabled()`/`useIdGenerator()` already establish
 * elsewhere in this project (see those files' own doc comments for why a
 * context's *default* argument — never provided via
 * `useContextProvider()` — needs no `noSerialize()` handling even though
 * the value itself is a plain object of closures: it is computed fresh,
 * identically, on both the server and the client, and never written into
 * any serialized component state).
 *
 * `qwik-material/timepicker`'s own INTERACTIVE runtime code
 * (`timepicker-runtime.ts`) deliberately does NOT call these hooks — a
 * `$()`-wrapped event handler is not a component render context, so hooks
 * can't be called from inside one. It imports `DEFAULT_DATE_ADAPTER`/
 * `MAT_NATIVE_DATE_FORMATS` directly instead (safe: plain module-level
 * constants, see `native-date-adapter.ts`). These two hooks exist for
 * render-time use (e.g. a future date picker formatting a calendar cell)
 * and as the forward-compatible extension point a later `QwikMaterialProvider`
 * prop can wire up without changing any call site.
 */
import {createContextId, useContext} from '@qwik.dev/core';
import type {DateAdapter} from './date-adapter';
import {DEFAULT_DATE_ADAPTER} from './native-date-adapter';
import {MAT_DATE_FORMATS, type MatDateFormats} from './date-formats';
import {MAT_NATIVE_DATE_FORMATS} from './native-date-formats';

/** Context id a provider can use to override the `DateAdapter` every date-aware component reads
 *  via `useDateAdapter()`. See this module's doc comment. */
export const MAT_DATE_ADAPTER = createContextId<DateAdapter<unknown>>('qwik-material/date-adapter');

/** Reads the `MAT_DATE_ADAPTER` context, falling back to the `en-US` native adapter. */
export function useDateAdapter(): DateAdapter<unknown> {
  return useContext(MAT_DATE_ADAPTER, DEFAULT_DATE_ADAPTER as DateAdapter<unknown>);
}

/** Reads the `MAT_DATE_FORMATS` context, falling back to `MAT_NATIVE_DATE_FORMATS`. */
export function useDateFormats(): MatDateFormats {
  return useContext(MAT_DATE_FORMATS, MAT_NATIVE_DATE_FORMATS);
}
