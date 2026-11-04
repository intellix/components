import {createContextId, useContextProvider, type QRL} from '@qwik.dev/core';

/**
 * The Qwik port's equivalent of upstream `ErrorStateMatcher.isErrorState(control, form)`'s two
 * arguments, flattened to the plain booleans this port already threads through every control
 * (`core/mat-form-field-control.ts`'s `touched`/`dirty`/`invalid`, `core/mat-form.tsx`'s
 * `submitted`) — there is no real `AbstractControl`/`NgForm` object here to pass instead. Mirrors
 * `ErrorStateMatcher`'s own default formula fields exactly (`control.invalid`, `control.touched`,
 * `control.dirty`, `form.submitted`).
 */
export interface MatErrorStateSnapshot {
  invalid: boolean;
  touched: boolean;
  dirty: boolean;
  submitted: boolean;
}

/**
 * The Qwik port's equivalent of upstream's `ErrorStateMatcher`/`ShowOnDirtyErrorStateMatcher`
 * class pair + the DI-provided custom-matcher escape hatch (`{provide: ErrorStateMatcher,
 * useClass: MyMatcher}` app-wide, or `[errorStateMatcher]="myMatcher"` per-control). Qwik has no
 * DI container and no class-instance injection — see `mat-form-control.ts`'s own doc comment for
 * why a class instance (or any plain function) can't cross this port's component/serialization
 * boundaries — so this is a plain, serializable union instead:
 *
 * - `'touched'` — mirrors upstream's DEFAULT `ErrorStateMatcher`: `invalid && (touched ||
 *   submitted)`. This port's own previous hardcoded formula in every control, before this type
 *   existed.
 * - `'dirty'` — mirrors upstream's built-in `ShowOnDirtyErrorStateMatcher`: `invalid && (dirty ||
 *   submitted)`.
 * - a `QRL<(state: MatErrorStateSnapshot) => boolean>` — mirrors a custom
 *   `isErrorState(control, form)` override, resolved once per dependency change (see
 *   `resolveErrorStateSync`'s own doc comment for why the two string modes are handled
 *   synchronously but a QRL needs a `useTask$`/signal in every consuming control).
 *
 * Settable in two places, exactly mirroring upstream's two injection sites:
 * - App-wide default: `useMatErrorStateMatcherProvider({...})` (mirrors `{provide:
 *   ErrorStateMatcher, useClass: ShowOnDirtyErrorStateMatcher}` at the root/module level) — read
 *   via {@link MAT_ERROR_STATE_MATCHER}.
 * - Per-control override: `<MatInput errorStateMatcher={...}>` /
 *   `<MatSelect errorStateMatcher={...}>` / etc. (mirrors `[errorStateMatcher]`) — declared on
 *   `MatFormFieldControlProps` (`core/mat-form-field-control.ts`), always preferred over the
 *   app-wide default when set.
 */
export type MatErrorStateMatcher =
  | 'touched'
  | 'dirty'
  | QRL<(state: MatErrorStateSnapshot) => boolean>;

/** Upstream's own default (`ErrorStateMatcher`, not `ShowOnDirtyErrorStateMatcher`) — matches
 *  every control's PREVIOUS hardcoded formula exactly, so leaving this unset changes nothing. */
export const MAT_ERROR_STATE_MATCHER_DEFAULT: MatErrorStateMatcher = 'touched';

/** Context id a `<QwikMaterialProvider errorStateMatcher={...}>` provides for the whole subtree
 *  — the id string is exposed publicly and MUST remain stable across releases. */
export const MAT_ERROR_STATE_MATCHER = createContextId<MatErrorStateMatcher>(
  'qwikMaterial/errorStateMatcher',
);

/**
 * Synchronously evaluates one of the two BUILT-IN matcher modes — upstream `ErrorStateMatcher`/
 * `ShowOnDirtyErrorStateMatcher`'s own `isErrorState` bodies, verbatim, just with `!!(control &&
 * ...)`'s null-control guard already folded into the `formBound` check every call site performs
 * separately (upstream: `isErrorState` returns `false` outright for a `null` control — this
 * port's `formBound` IS that same "is there a real bound control" condition).
 *
 * Deliberately NOT used for the `QRL` matcher case — a `QRL` must be resolved (`.resolve()` or
 * calling it directly) before it can run, which cannot happen inside a synchronous render body
 * (`component$` cannot return a `Promise` in this Qwik version). Every control therefore keeps
 * its OWN `useSignal`/`useTask$` pair (the SAME pattern `qwik-material/select/mat-select.tsx`'s
 * `triggerLabel` and `qwik-material/datepicker/mat-month-view.tsx`'s `dateFilter`/`dateClass`
 * resolution already establish — see `select/SYNC.md`'s `compareWith` section for the full
 * write-up of why): a synchronous `useSignal` initializer calls this function directly for the
 * correct value on the very first render, and a `useTask$` (no browser-only strategy, so Qwik
 * awaits it before finalizing SSR output) recomputes it on every relevant change — synchronously,
 * via this same function, for the two built-in modes, or by resolving+calling the QRL for a
 * custom one. This function itself never touches a QRL, so it needs no `core/error-state-
 * matcher.ts` consumer to duplicate this formula by hand.
 */
export function resolveErrorStateSync(
  snapshot: MatErrorStateSnapshot,
  mode: 'touched' | 'dirty',
): boolean {
  return mode === 'dirty'
    ? snapshot.invalid && (snapshot.dirty || snapshot.submitted)
    : snapshot.invalid && (snapshot.touched || snapshot.submitted);
}

/**
 * Provides {@link MAT_ERROR_STATE_MATCHER} for this subtree — call once near the root (or
 * anywhere deeper, to override just that part of the tree) to set the app-wide default
 * `ErrorStateMatcher` every form-field-bound control falls back to when it doesn't set its own
 * per-control `errorStateMatcher` prop. Only this one context is provided; every other
 * qwik-material configuration context stays whatever an ancestor (or nothing) already
 * provided. Defaults to {@link MAT_ERROR_STATE_MATCHER_DEFAULT} when `matcher` is omitted.
 */
export function useMatErrorStateMatcherProvider(matcher?: MatErrorStateMatcher): void {
  useContextProvider(MAT_ERROR_STATE_MATCHER, matcher ?? MAT_ERROR_STATE_MATCHER_DEFAULT);
}
