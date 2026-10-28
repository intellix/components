import {$, useStore, type QRL} from '@builder.io/qwik';

/**
 * A small, framework-appropriate replacement for Angular's reactive forms
 * (`FormControl` + `Validators`), used by the `error-state` form-field
 * scenario and intended to stay reusable for select/datepicker/chips later
 * (see `docs/superpowers/specs/2026-10-27-qwik-material-remaining-components-roadmap.md`
 * and `form-field/SYNC.md`'s "key design decision").
 *
 * Mirrors upstream's `FormControl`/`Validators`/`NgControlStatus` shape
 * closely enough to port 1:1 (value/touched/dirty, `Validators.required`/
 * `.email` → {@link matRequiredValidator}/{@link matEmailValidator},
 * `hasError('key')`), while staying a plain, inspectable, Qwik-native
 * primitive.
 *
 * ## Why validators are never stored inside the reactive `useStore()`
 *
 * `useMatFormControl()`'s result is routinely passed as a prop ACROSS a
 * component boundary — to `<MatInput formControl={fc}>`, and indirectly to
 * `<MatFormField>` via `readControlProps()` introspecting the `control`
 * JSX descriptor (see `core/mat-form-field-control.ts`). Qwik's `useStore()`
 * values and QRLs (`$(...)`-wrapped functions) are BOTH safe to carry across
 * that boundary (they're first-class, independently resumable); a PLAIN
 * closure/function is not — Qwik has no general mechanism for serializing
 * an arbitrary function reference embedded as a plain object property (as
 * opposed to a QRL, or a named, statically-importable symbol), and even
 * `noSerialize()` only keeps a value alive for the remainder of the SAME
 * execution context (the server's render, OR the current browser tab after
 * it was created there) — it is never a way to ship a function from server
 * to client.
 *
 * So `MatFormControl` returned by {@link useMatFormControl} carries ONLY
 * plain data (`value`/`touched`/`dirty`, all serializable primitives) and
 * QRL methods (`setValue$`/`markAsTouched$`/`markAsDirty$`, natively
 * serializable). Validators are **never** attached to it. Instead, the
 * validator functions ({@link matRequiredValidator}, {@link matEmailValidator})
 * are plain, stateless, MODULE-LEVEL exported functions — like upstream's
 * `Validators.required`/`Validators.email` — invoked DIRECTLY by the
 * consumer (the route/page component that owns the `useMatFormControl()`
 * call) via {@link matValidationErrors}, inline, in the SAME synchronous
 * render pass that builds the JSX tree it hands to `<MatFormField>`/
 * `<MatInput>`. The RESULT of that call (a plain `MatValidationErrors |
 * null`, or the booleans derived from it) is what crosses the component
 * boundary — never the functions themselves. This exactly mirrors how the
 * Angular mirror scenario itself is written
 * (`@if (nameControl.invalid) { <mat-error>...</mat-error> }` — the
 * TEMPLATE, not `MatFormField`, decides whether to render the error).
 *
 * Because the route reads `fc.value`/`fc.touched`/`fc.dirty` directly to
 * compute those booleans, Qwik's normal signal-subscription reactivity
 * means the route's OWN render re-runs whenever those fields change (e.g.
 * after `fc.markAsTouched$()` from a blur handler), rebuilding fresh
 * `<MatFormField control={...} errors={...}>` JSX with up-to-date values —
 * ordinary parent-rerenders-on-prop-change reactivity, nothing exotic
 * needed for this path (unlike the `focused`/`empty`/`shouldLabelFloat`
 * trio, which has no consumer-visible owner and uses the
 * `MAT_FORM_FIELD_CONTROL_STATE` context instead — see
 * `core/mat-form-field-control.ts`).
 */

/** Mirrors Angular Forms' `ValidationErrors` (a map of failed validator
 *  keys to truthy detail — simplified to `true` here, since no scenario
 *  needs the richer per-key detail object Angular supports). */
export type MatValidationErrors = Record<string, true>;

/** Mirrors Angular Forms' `ValidatorFn` — a pure function from the
 *  control's current value to `null` (valid) or a {@link MatValidationErrors}
 *  map (invalid). */
export type MatValidatorFn = (value: string) => MatValidationErrors | null;

/** Mirrors `Validators.required`. */
export const matRequiredValidator: MatValidatorFn = value =>
  value == null || value === '' ? {required: true} : null;

// Mirrors Angular Forms' own (deliberately permissive) email regex closely
// enough for this port's one scenario — upstream's actual implementation is
// a longer RFC-ish pattern; this project doesn't need byte-for-byte parity
// with Angular's internal regex, only the same accept/reject behavior for
// the strings the `error-state` scenario actually types ('abc' → invalid).
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Mirrors `Validators.email`. */
export const matEmailValidator: MatValidatorFn = value =>
  value == null || value === '' || EMAIL_RE.test(value) ? null : {email: true};

/** Mirrors Angular Forms' `AbstractControl.hasValidator` + composing
 *  `Validators.compose` — runs every validator against `value` and merges
 *  their error maps (`null` iff every validator passed). Called directly by
 *  the consumer — see the module doc comment for why this is a plain
 *  function, never hook-internal state. */
export function matValidationErrors(
  value: string,
  validators: readonly MatValidatorFn[],
): MatValidationErrors | null {
  let errors: MatValidationErrors | null = null;
  for (const fn of validators) {
    const result = fn(value);
    if (result) errors = Object.assign(errors ?? {}, result);
  }
  return errors;
}

/** Options for {@link useMatFormControl}. */
export interface MatFormControlOptions {
  /** Initial value. Default `''`. */
  value?: string;
}

/**
 * The reactive value/touched/dirty state `useMatFormControl()` returns —
 * mirrors upstream's `FormControl` surface (minus validators — see the
 * module doc comment) closely enough that migrating Angular forms code
 * reads naturally: `fc.value`, `fc.touched`, `fc.dirty`,
 * `fc.markAsTouched$()`.
 */
export interface MatFormControl {
  value: string;
  touched: boolean;
  dirty: boolean;
  /** Sets `value` and marks the control dirty — mirrors
   *  `FormControl.setValue()` + the dirty flag Angular's own `input`-event
   *  handling sets. */
  setValue$: QRL<(value: string) => void>;
  /** Mirrors `FormControl.markAsTouched()`. */
  markAsTouched$: QRL<() => void>;
  /** Mirrors `FormControl.markAsDirty()`. */
  markAsDirty$: QRL<() => void>;
}

/**
 * Qwik's replacement for `new FormControl(value, validators)` — see the
 * module doc comment for the full design rationale. Validators are NOT
 * passed here; call {@link matValidationErrors} (or {@link matControlInvalid}/
 * {@link matControlHasError}) with the returned control's `.value` wherever
 * you need the validation result (typically right where you build the
 * `<MatFormField>`/`<MatInput>`/`<MatError>` JSX for it).
 */
export function useMatFormControl(options: MatFormControlOptions = {}): MatFormControl {
  const control = useStore<MatFormControl>({
    value: options.value ?? '',
    touched: false,
    dirty: false,
    setValue$: $((value: string) => {
      control.value = value;
      control.dirty = true;
    }),
    markAsTouched$: $(() => {
      control.touched = true;
    }),
    markAsDirty$: $(() => {
      control.dirty = true;
    }),
  });
  return control;
}

/** Convenience: `matValidationErrors(control.value, validators) === null`. */
export function matControlValid(
  control: Pick<MatFormControl, 'value'>,
  validators: readonly MatValidatorFn[],
): boolean {
  return matValidationErrors(control.value, validators) === null;
}

/** Convenience: the negation of {@link matControlValid}. */
export function matControlInvalid(
  control: Pick<MatFormControl, 'value'>,
  validators: readonly MatValidatorFn[],
): boolean {
  return !matControlValid(control, validators);
}

/** Convenience: mirrors `FormControl.hasError(key)`. */
export function matControlHasError(
  control: Pick<MatFormControl, 'value'>,
  validators: readonly MatValidatorFn[],
  key: string,
): boolean {
  const errors = matValidationErrors(control.value, validators);
  return !!errors && key in errors;
}

/** Convenience: mirrors `AbstractControl.hasValidator(fn)` (reference
 *  identity — pass the SAME {@link matRequiredValidator}/
 *  {@link matEmailValidator} (or your own) function you validate with). */
export function matControlHasValidator(
  validators: readonly MatValidatorFn[],
  fn: MatValidatorFn,
): boolean {
  return validators.includes(fn);
}
