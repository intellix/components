import * as v from 'valibot';

/**
 * The "account" form's schema — shared source of truth for Formisch's validation (this file)
 * and, by hand, for the Angular mirror scenario's `Validators`/custom validator fns
 * (`src/dev-app/qwik-parity/formisch.ts`'s `AccountComponent`). Error MESSAGES here are written
 * to match that mirror's `<mat-error>` text exactly — see this spike's parity spec
 * (`src/qwik-cdk-parity-tests/specs/formisch/angular-parity.spec.ts`), which asserts the two
 * render byte-identical DOM.
 *
 * Field choices mirror the task's own "realistic account form": name + email (text, validated),
 * bio (textarea, optional), country (select, required), contact preference (radio, required),
 * newsletter (slide-toggle, optional), terms (checkbox, must be checked), birthday (datepicker,
 * required). `birthday` is a plain ISO-8601 `YYYY-MM-DD` STRING in this schema, not a `Date` —
 * see `formisch-bindings.ts`'s doc comment for why the datepicker's own typed `Date` value is
 * converted at the wiring boundary rather than taught to the schema directly.
 */
// Mirrors `core/mat-form-control.ts`'s own `matEmailValidator` (used by every other scenario in
// this port that needs one) — NOT `v.email()`: valibot's own pipe runs every action regardless
// of an earlier one's result (no implicit abort-on-first-failure), so `v.email()` alone would
// ALSO flag an EMPTY string as a format error, stacking "Enter a valid email" under "Email is
// required" — Angular's `Validators.email` explicitly skips empty values instead (empty is
// `Validators.required`'s problem to report, not `Validators.email`'s), confirmed against the
// real Angular mirror. `v.check()` with the SAME short-circuit reproduces that exactly. Not
// byte-for-byte Angular's own internal email regex (same deliberate scope cut
// `matEmailValidator`'s own doc comment documents) — only the same accept/reject behavior for
// the strings this spike's specs actually type.
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const AccountSchema = v.object({
  name: v.pipe(v.string(), v.nonEmpty('Name is required')),
  email: v.pipe(
    v.string(),
    v.nonEmpty('Email is required'),
    v.check(value => value === '' || EMAIL_RE.test(value), 'Enter a valid email'),
  ),
  bio: v.string(),
  country: v.pipe(v.string(), v.nonEmpty('Country is required')),
  contactPreference: v.pipe(v.string(), v.nonEmpty('Choose a contact preference')),
  newsletter: v.boolean(),
  // `v.literal(true, message)` — mirrors `Validators.requiredTrue` (fails for `false`, passes
  // only for the literal `true`; the field's `initialInput` below seeds a real `false`, not
  // `undefined`, so this is always a type-correct boolean failing only the value check).
  terms: v.pipe(v.boolean(), v.literal(true, 'You must accept the terms')),
  birthday: v.pipe(v.string(), v.nonEmpty('Birthday is required')),
});

export type AccountInput = v.InferInput<typeof AccountSchema>;
export type AccountOutput = v.InferOutput<typeof AccountSchema>;

/** Pristine form state — every scenario (Formisch AND the Angular mirror) starts here. */
export const ACCOUNT_INITIAL_INPUT: AccountInput = {
  name: '',
  email: '',
  bio: '',
  country: '',
  contactPreference: '',
  newsletter: false,
  terms: false,
  birthday: '',
};

/** What the "Fill example data" button sets via `setInput` — also the Angular mirror's own
 *  "Fill example data" button, same values, for the parity spec's "after valid fill" state. */
export const ACCOUNT_EXAMPLE_INPUT: AccountInput = {
  name: 'Jordan Rivera',
  email: 'jordan.rivera@example.com',
  bio: 'Product designer who loves accessible forms.',
  country: 'ca',
  contactPreference: 'email',
  newsletter: true,
  terms: true,
  birthday: '1992-07-14',
};

export const COUNTRIES: ReadonlyArray<{value: string; label: string}> = [
  {value: 'us', label: 'United States'},
  {value: 'ca', label: 'Canada'},
  {value: 'gb', label: 'United Kingdom'},
  {value: 'au', label: 'Australia'},
];

export const CONTACT_PREFERENCES: ReadonlyArray<{value: string; label: string}> = [
  {value: 'email', label: 'Email'},
  {value: 'phone', label: 'Phone'},
  {value: 'mail', label: 'Mail'},
];
