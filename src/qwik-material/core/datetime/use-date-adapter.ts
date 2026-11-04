/**
 * Render-time context accessors for `DateAdapter`/`MatDateFormats`/locale — see
 * `date-adapter.ts`'s and `native-date-adapter.ts`'s module doc comments.
 *
 * `useMatDateAdapterProvider()` (below) wires all three contexts
 * (`factory`/`formats`/`locale` keys), app-wide or per
 * subtree (an inner call shadows an outer one for its own descendants,
 * exactly like upstream's hierarchical DI and every other provider hook this project
 * already has) — see `datepicker/SYNC.md`'s "DateAdapter / MAT_DATE_FORMATS / MAT_DATE_LOCALE /
 * dateClass" section for the full design.
 *
 * Two different shapes are deliberately used for the two contexts that matter for a CUSTOM
 * adapter:
 *
 * - `MAT_DATE_ADAPTER_FACTORY` carries a `QRL<(locale) => DateAdapter<D>>` — a FACTORY, never a
 *   live instance. A `DateAdapter` instance (ours or a custom subclass) is a class with methods,
 *   which per this project's own established rule can't be put into serializable Qwik state
 *   (signal/store/context value) and survive an SSR→resume round trip — reading it back after
 *   resume would be `undefined`. A `QRL` is Qwik's OWN native mechanism for exactly this: it
 *   survives serialization natively (a lazy import reference, not a captured live object), so
 *   `resolveDateAdapter()` below can call it FRESH, synchronously-awaited, from render code
 *   (`useTask$`, which Qwik awaits before producing output, both during SSR and on every
 *   client-side re-run its `track()`ed inputs trigger) or from inside a `$()` event handler
 *   (already async-capable — see `mat-month-view.tsx`'s own `dateFilter` QRL for the identical,
 *   already-proven pattern this one mirrors). The resulting instance is used immediately and
 *   discarded — NEVER stored into a signal/store field directly — so there is nothing to
 *   serialize and nothing that can go stale across a resume.
 * - `MAT_DATE_LOCALE` carries a plain `Signal<string>` — safe to store/read directly (a string
 *   has no serialization hazard at all), and reactive: writing a NEW locale into this signal (or
 *   calling `.setLocale()` on a live adapter instance, which bumps that instance's OWN
 *   `localeChanges` signal — see `date-adapter.ts`) is what makes a runtime locale switch
 *   re-render locale-sensitive labels, the Qwik-native equivalent of upstream's `localeChanges`
 *   subscription. Calendar/label-rendering code that only needs the LOCALE (not a genuinely
 *   custom adapter class) can skip the factory entirely and just call
 *   `new NativeDateAdapter(locale)` directly — a hardcoded, resume-safe construction, exactly
 *   like `qwik-cdk`'s `ensureCdkDispatchers()` falling back to a hardcoded factory.
 *
 * `MAT_DATE_ADAPTER` (an INSTANCE, not a factory) and `useDateAdapter()` remain as a narrower,
 * synchronous escape hatch for render-only code that provides (via `useContextProvider`) or
 * reads a ready-made adapter instance directly and never needs it to survive past the CURRENT
 * render pass (e.g. module-singleton defaults) — `qwik-material/timepicker`'s/
 * `qwik-material/datepicker`'s own interactive runtime code still does NOT call any of these
 * hooks from inside a `$()` handler directly (hooks can't be called from inside one); instead
 * each picker handle stashes the resolved factory/formats/locale once, at hook-creation time
 * (render-legal), and `resolveDateAdapter()` is called explicitly wherever a live instance is
 * needed.
 */
import {
  $,
  createContextId,
  useContext,
  useContextProvider,
  useSignal,
  type QRL,
  type Signal,
} from '@qwik.dev/core';
import type {DateAdapter} from './date-adapter';
import {createNativeDateAdapter, DEFAULT_DATE_ADAPTER} from './native-date-adapter';
import {MAT_DATE_FORMATS, type MatDateFormats} from './date-formats';
import {MAT_NATIVE_DATE_FORMATS} from './native-date-formats';

/** Context id a provider can use to override the live `DateAdapter` INSTANCE every date-aware
 *  component reads via `useDateAdapter()`. See this module's doc comment for why
 *  `MAT_DATE_ADAPTER_FACTORY` (a QRL), not this, is the mechanism for an app-supplied CUSTOM
 *  adapter class. */
export const MAT_DATE_ADAPTER = createContextId<DateAdapter<unknown>>('qwikMaterial/dateAdapter');

/** Reads the `MAT_DATE_ADAPTER` context, falling back to the `en-US` native adapter. */
export function useDateAdapter(): DateAdapter<unknown> {
  return useContext(MAT_DATE_ADAPTER, DEFAULT_DATE_ADAPTER as DateAdapter<unknown>);
}

/** Reads the `MAT_DATE_FORMATS` context, falling back to `MAT_NATIVE_DATE_FORMATS`. */
export function useDateFormats(): MatDateFormats {
  return useContext(MAT_DATE_FORMATS, MAT_NATIVE_DATE_FORMATS);
}

/** Context id a provider can use to override the `DateAdapter` FACTORY every date-aware
 *  component resolves via `useDateAdapterFactory()`/`resolveDateAdapter()`. See this module's
 *  doc comment for why this is a `QRL`, not a live instance. */
export const MAT_DATE_ADAPTER_FACTORY = createContextId<
  QRL<(locale: string) => DateAdapter<unknown>>
>('qwikMaterial/dateAdapterFactory');

/** The default factory every date-aware component falls back to when no
 *  `MAT_DATE_ADAPTER_FACTORY` provider is in scope — a `NativeDateAdapter` for the given locale.
 *  A module-level QRL constant (no captured scope), so resolving it is cheap and always
 *  resume-safe on either side, the same "hardcoded module function" shape
 *  `qwik-cdk`'s `ensureCdkDispatchers()` falls back to. */
export const DEFAULT_DATE_ADAPTER_FACTORY: QRL<(locale: string) => DateAdapter<unknown>> = $(
  (locale: string) => createNativeDateAdapter(locale) as DateAdapter<unknown>,
);

/**
 * Reads the `MAT_DATE_ADAPTER_FACTORY` context, falling back to
 * {@link DEFAULT_DATE_ADAPTER_FACTORY}.
 *
 * `useContext(ctx, defaultValue)` has a special case that makes passing a QRL directly as
 * `defaultValue` UNSAFE: Qwik treats any FUNCTION-typed default as a lazy initializer and
 * INVOKES it immediately (with no arguments) when no provider exists, persisting the RETURN
 * VALUE (not the function) — and a QRL is itself callable (`typeof someQrl === 'function'`,
 * confirmed elsewhere in this project — see `mat-month-view.tsx`'s own "a QRL is itself
 * callable, resolving+invoking in one step" doc comment), so it would get invoked as
 * `DEFAULT_DATE_ADAPTER_FACTORY()` — missing its required `locale` argument — and the resulting
 * PENDING PROMISE would be what's persisted into the context slot. Confirmed live: this crashed
 * EVERY `qwik-material/datepicker`/`timepicker` scenario's real SSR with `Code(Q20)`
 * (`QError_serializeErrorUnknownType`) the moment the container tried to serialize that
 * promise. Same exact gotcha `mat-dialog.tsx`'s/`mat-bottom-sheet.tsx`'s own
 * `useContext(..., null)`-then-substitute pattern already documents and works around for a
 * plain (non-QRL) factory function default — `null` (never a function, never `undefined`) is
 * the safe default sentinel here too.
 */
export function useDateAdapterFactory(): QRL<(locale: string) => DateAdapter<unknown>> {
  const factoryOrNull = useContext(
    MAT_DATE_ADAPTER_FACTORY,
    null as unknown as QRL<(locale: string) => DateAdapter<unknown>>,
  );
  return factoryOrNull ?? DEFAULT_DATE_ADAPTER_FACTORY;
}

/** Resolves a `DateAdapter` factory QRL into a live instance for the given locale — the one
 *  place every runtime/render code path should go through (never store the result; call this
 *  again wherever a live instance is needed — see this module's doc comment). */
export function resolveDateAdapter<D>(
  factory: QRL<(locale: string) => DateAdapter<D>>,
  locale: string,
): Promise<DateAdapter<D>> {
  return Promise.resolve(factory(locale));
}

/** Context id a provider can use to override the locale every date-aware component reads via
 *  `useDateLocale()`. A `Signal<string>` (not a plain string) so a runtime locale change
 *  re-renders every consumer tracking it — mirrors upstream `MAT_DATE_LOCALE` (the one-time DI
 *  seed) PLUS live `setLocale()` reactivity in one mechanism. See this module's doc comment. */
export const MAT_DATE_LOCALE = createContextId<Signal<string>>('qwikMaterial/dateLocale');

/**
 * Reads the `MAT_DATE_LOCALE` context, falling back to a fixed `'en-US'` signal when no
 * provider is in scope.
 *
 * The fallback is created fresh on every call via `useSignal()` (a REAL hook call, unconditional
 * so the hook-slot order stays stable — `useContext`'s own default-value parameter is evaluated
 * eagerly regardless of whether a provider exists, so this costs one always-allocated signal
 * slot on the no-provider path, the same trade-off `mat-dialog.tsx`'s own
 * `useContext(..., null)`-then-substitute pattern documents elsewhere in this project).
 *
 * This is NOT merely style: an earlier version used a single MODULE-LEVEL `createSignal('en-US')`
 * singleton shared by every caller/request — which crashed real SSR with `Code(Q20)`
 * (`QError_serializeErrorUnknownType`) the first time two DIFFERENT requests' containers both
 * tried to serialize a reference to the SAME signal object (confirmed live: EVERY
 * `qwik-material/datepicker`/`timepicker` scenario on a real preview server, not just a new one
 * — a signal must belong to the container serializing it; a signal created once at module-import
 * time, before any request/container exists, belongs to none of them. `useSignal()` called here,
 * inside the current component's own render, is correctly owned by THAT render's container).
 */
export function useDateLocale(): Signal<string> {
  const fallback = useSignal('en-US');
  return useContext(MAT_DATE_LOCALE, fallback);
}

/** Options for {@link useMatDateAdapterProvider}. */
export interface MatDateAdapterProviderConfig {
  /** Overrides the `DateAdapter` every `MatDatepicker`/`MatDateRangeInput`/`MatTimepicker`
   *  resolves in this subtree. A `QRL` FACTORY, not a live instance — see this module's doc
   *  comment. Defaults to {@link DEFAULT_DATE_ADAPTER_FACTORY}. */
  factory?: QRL<(locale: string) => DateAdapter<unknown>>;
  /** Overrides the parse/display format bag every date-aware component reads via
   *  `useDateFormats()`. Plain data — defaults to `MAT_NATIVE_DATE_FORMATS`. */
  formats?: MatDateFormats;
  /** Seeds the locale every date-aware component reads via `useDateLocale()`/resolves its
   *  adapter with. Defaults to `'en-US'`. */
  locale?: string;
}

/**
 * Provides {@link MAT_DATE_ADAPTER_FACTORY}, {@link MAT_DATE_FORMATS}, and
 * {@link MAT_DATE_LOCALE} for this subtree — call once near the root (or anywhere deeper, to
 * override just that part of the tree) so every date-aware descendant resolves its
 * adapter/formats/locale from `config` instead of the hardcoded fallbacks. Only these three
 * contexts are provided; every other qwik-material configuration context stays whatever an
 * ancestor (or nothing) already provided.
 *
 * Returns the locale `Signal<string>` so the caller can switch locale at runtime (write
 * `.value` on the returned signal — the Qwik-native equivalent of upstream's
 * `DateAdapter.setLocale()`) — see `datepicker/SYNC.md`'s "DateAdapter / MAT_DATE_FORMATS /
 * MAT_DATE_LOCALE / dateClass" section.
 *
 * `config.locale` is a ONE-TIME SEED only, deliberately NOT guarded-resynced on every render:
 * a guard that READS `localeSignal.value` (to compare against `config.locale`) during THIS
 * component's own render would SUBSCRIBE this provider to its OWN signal, so the very next
 * time a descendant changed it, this re-render would fire and immediately overwrite it back
 * to the original seed value — confirmed live (a real bug this comment replaces the write-up
 * of): the "Dynamically switch to French" docs example (`datepicker-locale`) silently reverted
 * every click. `useSignal()`'s initializer already seeds it correctly exactly once; nothing
 * more is needed.
 */
export function useMatDateAdapterProvider(config?: MatDateAdapterProviderConfig): Signal<string> {
  // `MAT_DATE_ADAPTER_FACTORY`'s value is a QRL (a lazy import reference), never a live
  // `DateAdapter` instance — QRLs are natively resumable, no `noSerialize()` needed.
  useContextProvider(MAT_DATE_ADAPTER_FACTORY, config?.factory ?? DEFAULT_DATE_ADAPTER_FACTORY);
  // MatDateFormats is plain, serializable data — no noSerialize needed.
  useContextProvider(MAT_DATE_FORMATS, config?.formats ?? MAT_NATIVE_DATE_FORMATS);
  const localeSignal = useSignal(config?.locale ?? 'en-US');
  useContextProvider(MAT_DATE_LOCALE, localeSignal);
  return localeSignal;
}
