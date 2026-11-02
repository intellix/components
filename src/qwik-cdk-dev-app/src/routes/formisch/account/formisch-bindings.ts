import {$, useTask$, type QRL} from '@qwik.dev/core';
import type {FieldStore, FormStore} from '@formisch/qwik';
import type {HostRef} from '@angular-community/qwik-material/core';
import {
  setMatDatepickerValue,
  type MatDatepickerHandle,
} from '@angular-community/qwik-material/datepicker';
import type {MatCheckboxChangeEvent} from '@angular-community/qwik-material/checkbox';
import type {AccountSchema} from './account-schema';

/**
 * Wiring between Formisch's headless `FieldStore` (`@formisch/qwik`) and qwik-material's
 * control props — the "recommended consumer wiring" this spike's README section ("Using with
 * Formisch") points to. Kept here, in the DEV APP, deliberately: qwik-material/qwik-cdk stay
 * form-library-agnostic (no `@formisch/qwik` dependency), so any Formisch-specific glue lives on
 * the consumer's side of the fence — this file IS that consumer.
 *
 * Typed against this one example's concrete `AccountSchema` (not generic over an arbitrary
 * `FormSchema`) — small and typed, per the task's own framing, not a reusable library. A real
 * app would copy/adapt this file per form, the same way a reactive-forms Angular app writes its
 * own small `ErrorStateMatcher`/validator glue per form.
 *
 * ## Why `MatInput`/`MatSelect`/etc. each get THEIR OWN small binding function, not one generic
 * `matField()`
 *
 * The native-element controls (`MatInput`) want Formisch's full `field.props` spread (ref +
 * native event handlers — Formisch reads/writes the value directly off the registered DOM
 * element). The "custom controls" (`MatSelect`/`MatRadioGroup`/`MatCheckbox`/`MatSlideToggle`,
 * none of which expose the native element Formisch's `field.props` is meant to be spread onto —
 * select renders its own trigger/listbox, radio/checkbox/toggle are controlled value+onChange$
 * components) use `field.onInput(value)` instead — Formisch's own documented pattern for a
 * custom control (see the `FieldStore.onInput` doc comment in `@formisch/qwik`'s own types).
 * Trying to force both shapes through one function would just mean every call site immediately
 * re-destructures/overrides half of what it returned.
 *
 * ## `value` is deliberately NOT part of `matInputBindings()`/`matSelectBindings()`'s returned
 * object — write it as its OWN literal `value={field.input.value}` JSX attribute at the call
 * site, a DIRECT signal `.value` read, never a value that passed through a helper FUNCTION call
 *
 * Confirmed live (a throwaway debug route + Playwright, before/after clicking a button that
 * reassigns the bound signal), narrowed down through three attempts:
 *  1. `<MatInput {...{value: field.input.value, ...otherProps}} />` (spread) — does NOT update.
 *  2. `<MatInput value={matInputValue(field)} />` (a helper FUNCTION that reads the signal
 *     internally and returns a plain string) — ALSO does NOT update.
 *  3. `<MatInput value={field.input.value} />` (the signal read written directly, inline, as
 *     this literal attribute's expression) — DOES update.
 * `MatInput`/`MatSelect` are routinely nested as `<MatFormField control={<MatInput .../>}>` —
 * `MatFormField` freezes its OWN `control` prop's VALUE (the whole `<MatInput .../>` object) on
 * first render (`useSignal(() => props.control)` — see `core/mat-form-field-control.ts`'s doc
 * comment), so the CHILD's own vnode reference never gets rebuilt by a later route re-render.
 * Qwik's OPTIMIZER (a static, compile-time transform) gives a LITERAL `attr={signal.value}` JSX
 * expression its own live binding at the attribute level, independent of the enclosing vnode's
 * identity — but it can only do that for an expression shape it recognizes AT COMPILE TIME; it
 * has no way to see "through" an opaque function call (attempt 2) to know the value it returns
 * came from a signal, so that case is treated exactly like a plain, dead value (attempt 1) —
 * frozen the moment it was computed, same as everything else inside that frozen `control` prop.
 * `MatCheckbox`/`MatRadioGroup`/`MatSlideToggle` below don't have this problem (rendered directly
 * by the route, never frozen inside anyone else's prop — an ordinary re-render rebuilds their
 * vnode fresh every time, spread or helper-function or not), so their bindings keep
 * `checked`/`value` inside the returned, spreadable object. See `input/SYNC.md`'s 2026-11-02
 * entry for the identical finding written up from `MatInput`'s own side.
 *
 * ## Validation timing — configuring Formisch to match Angular's defaults
 *
 * `useForm$({validate: 'initial', revalidate: 'input', ...})` (set in `index.tsx`) makes
 * Formisch validate every field EAGERLY, from mount, and continuously thereafter — matching
 * Angular reactive forms' own always-on validity (a required-but-empty field is `invalid` from
 * the very first render on BOTH sides, `ng-invalid`/`mat-form-field-invalid` included). Error
 * *display* still only turns on once `touched` (or the form submits) — exactly Angular's own
 * default `ErrorStateMatcher` formula (`invalid && (touched || submitted)`, see
 * `core/mat-form.tsx`) — so this doesn't make errors appear any earlier than Angular's.
 *
 * ONE semantic difference remains, and can't be configured away: Formisch's `isTouched` flips
 * on FOCUS (or any value change), where Angular's `touched` flips on BLUR only. Since
 * `errorState` is gated on `invalid && touched`, and `invalid` is already decided the moment
 * either side's error is computed, in practice this only matters for a snapshot taken BETWEEN
 * focus and blur on the SAME field — a state this spike's parity spec never captures (every
 * compared state is post-blur/post-submit/post-fill), so it has no observed effect here. A real
 * app that cares about this exact instant could track its own "has blurred" signal per field
 * instead of reading `field.isTouched` directly; not done here, to keep this binding file small.
 */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyField = FieldStore<typeof AccountSchema, any>;

/** `touched`/`dirty`/`invalid` for `MatFormField`'s (and the nested control's duplicate-copy)
 *  props — see `core/mat-form-field-control.ts`'s doc comment for why this needs to be passed
 *  TWICE. */
export interface MatFieldState {
  touched: boolean;
  dirty: boolean;
  invalid: boolean;
}

export function matFieldState(field: AnyField): MatFieldState {
  return {
    touched: field.isTouched.value,
    dirty: field.isDirty.value,
    invalid: !field.isValid.value,
  };
}

/** Raw error messages for a field — map to `<MatError>{msg}</MatError>` at the call site (kept
 *  as plain strings here rather than pre-built JSX, so this file stays a plain `.ts` module). */
export function matFieldErrors(field: AnyField): readonly string[] {
  return field.errors.value ?? [];
}

/**
 * The `ng-touched`/`ng-untouched`, `ng-pristine`/`ng-dirty`, `ng-valid`/`ng-invalid` trio
 * Angular's `NgControlStatus` directive (selector `[formControlName],[ngModel],[formControl]`)
 * puts directly on a bound control's OWN host element. `MatInput`/`MatSelect`/
 * `MatDatepickerInput` already compute this themselves from `formBound`+`touched`/`dirty`/
 * `invalid` (see each one's own `classes` array) — but `MatCheckbox`/`MatRadioGroup`/
 * `MatSlideToggle` have no such built-in support (they were never designed with a forms
 * binding in mind), so for an Angular mirror written as `<mat-checkbox formControlName="terms">`
 * to match byte-for-byte, THIS binding file computes the same three classes and the call site
 * passes them through the ordinary `class` prop every qwik-material component already accepts
 * — no library change needed, just consumer-level composition. */
export function ngStatusClasses(field: AnyField): string[] {
  return [
    field.isTouched.value ? 'ng-touched' : 'ng-untouched',
    field.isDirty.value ? 'ng-dirty' : 'ng-pristine',
    field.isValid.value ? 'ng-valid' : 'ng-invalid',
  ];
}

/** Whether to show a field's error message right now — the same default `ErrorStateMatcher`
 *  formula every qwik-material form control already uses internally (`invalid && (touched ||
 *  form.submitted)`, see `core/mat-form.tsx`), exposed here for controls with no built-in error
 *  display of their own (`MatRadioGroup`/`MatCheckbox` — upstream Material has no dedicated
 *  error-message component for these either; a real app writes its own, same as this page's
 *  plain `.formisch-demo__error` div). */
export function matShouldShowError(
  field: AnyField,
  form: FormStore<typeof AccountSchema>,
): boolean {
  return !field.isValid.value && (field.isTouched.value || form.isSubmitted.value);
}

/** Marks a field touched without changing its value (Formisch's `onFocus$` is the only
 *  "just mark touched" primitive on `field.props`) — used by discrete controls' own
 *  "closed/blurred without choosing anything" case (`MatSelect`'s `onTouched$`). */
export function matMarkTouched(field: AnyField): QRL<() => void> {
  return $(() => field.props.onFocus$());
}

/** Native-element bindings for `MatInput`/`MatDatepickerInput`-shaped controls (text-like
 *  inputs that actually expose the registered native element) — spreads Formisch's own
 *  `field.props`, adapted to qwik-material's slightly different handler signatures (extra `el`
 *  argument; `onFocus$`/`onBlur$` take none upstream in Formisch, which is harmless — qwik-
 *  material calls them WITH an event/element, Formisch's handlers just ignore the extra args).
 *
 *  Deliberately does NOT forward `field.props.name`: Formisch sets it to a JSON-stringified path
 *  (e.g. `["name"]`, or `["address","city"]` nested) — its own convention for decoding a plain
 *  `<form>` POST submission without JS (`decodeFormData`, `@formisch/qwik/internals`), not
 *  something this demo needs (submission is handled entirely in JS, via `handleSubmit`/
 *  `<Form onSubmit$>`). Forwarding it would also have no Angular-mirror equivalent to match for
 *  DOM parity — none of this port's other `MatInput` scenarios set a `name` attribute either. A
 *  real app relying on no-JS progressive-enhancement submission would forward it. */
export function matInputBindings(field: AnyField): MatFieldState & {
  formBound: true;
  ref: HostRef<HTMLInputElement | HTMLTextAreaElement>;
  onFocus$: QRL<(event: FocusEvent, el: HTMLInputElement | HTMLTextAreaElement) => void>;
  onInput$: QRL<(event: Event, el: HTMLInputElement | HTMLTextAreaElement) => void>;
  onBlur$: QRL<(event: FocusEvent, el: HTMLInputElement | HTMLTextAreaElement) => void>;
} {
  return {
    formBound: true,
    ref: field.props.ref,
    ...matFieldState(field),
    onFocus$: $(() => field.props.onFocus$()),
    onInput$: $((event: Event, el: HTMLInputElement | HTMLTextAreaElement) =>
      field.props.onInput$(event as InputEvent, el),
    ),
    onBlur$: $(() => field.props.onBlur$()),
  };
}

/** `MatSelect` bindings — a "custom control" (no native element Formisch's `field.props` could
 *  attach to): drives Formisch via `field.onInput(value)` (which also marks the field touched +
 *  edited — see `@formisch/qwik`'s own `setNestedInput`), and marks touched on close too
 *  (`onTouched$`, mirroring upstream `_onTouched()`) for the "opened then closed without
 *  choosing anything" case `onInput` alone wouldn't cover. */
export function matSelectBindings(field: AnyField): MatFieldState & {
  formBound: true;
  onValueChange$: QRL<(value: unknown) => void>;
  onTouched$: QRL<() => void>;
} {
  return {
    formBound: true,
    ...matFieldState(field),
    onValueChange$: $((value: unknown) => field.onInput(value as string)),
    onTouched$: matMarkTouched(field),
  };
}

/** `MatRadioGroup` bindings — controlled `value` + `onChange$`, same "custom control" pattern as
 *  `matSelectBindings`. No separate "touched without changing" case (there's no way to interact
 *  with a radio group without selecting something).
 *
 *  `value` falls back to `undefined`, NEVER `''` — confirmed live (an Angular-vs-Qwik parity
 *  diff on this exact page): `MatRadioGroup`'s roving-tabindex formula
 *  (`radio/mat-radio-button.tsx`'s `hasGroupSelection`) treats ANY non-`null`/`undefined` group
 *  value, including `''`, as "a selection exists, it just doesn't match this button" — giving
 *  EVERY button `tabIndex={-1}` instead of the correct "nothing selected yet, each button keeps
 *  its own default tabIndex (0)". Every other scenario in this port already seeds an unselected
 *  group with `undefined` (never `''`); this is the first consumer whose underlying state
 *  (Formisch's own empty-string default for an unset required string field) needed an explicit
 *  conversion at the wiring boundary. */
export function matRadioGroupBindings(field: AnyField): {
  value: string | undefined;
  onChange$: QRL<(value: unknown) => void>;
} {
  return {
    value: (field.input.value as string | undefined) || undefined,
    onChange$: $((value: unknown) => field.onInput(value as string)),
  };
}

/** `MatCheckbox` bindings. */
export function matCheckboxBindings(field: AnyField): {
  checked: boolean;
  onChange$: QRL<(event: MatCheckboxChangeEvent) => void>;
} {
  return {
    checked: (field.input.value as boolean | undefined) ?? false,
    onChange$: $((event: MatCheckboxChangeEvent) => field.onInput(event.checked)),
  };
}

/** `MatSlideToggle` bindings. */
export function matSlideToggleBindings(field: AnyField): {
  checked: boolean;
  onChange$: QRL<(checked: boolean) => void>;
} {
  return {
    checked: (field.input.value as boolean | undefined) ?? false,
    onChange$: $((checked: boolean) => field.onInput(checked)),
  };
}

// ── Datepicker ───────────────────────────────────────────────────────────────────────────────
//
// `birthday`'s Formisch input is a plain ISO-8601 (`YYYY-MM-DD`) string (`account-schema.ts`);
// the datepicker's own `picker.value` is a typed `Date | null` (qwik-material/datepicker's
// `NativeDateAdapter`). Converted at this boundary rather than teaching the schema a `Date`
// type, so the schema stays the same plain-string shape `getInput(form)`/the JSON panel/
// `setInput` all deal in.
//
// Deliberately NOT `DateAdapter.toIso8601()`/`.deserialize()` — confirmed live (a real, off-by-
// one-day bug outside UTC): `NativeDateAdapter`'s `format()`/`parse()` (what the DATEPICKER INPUT
// itself actually uses for typing/display) read/construct dates via LOCAL-TIME getters
// (`date.getFullYear()`/`getMonth()`/`getDate()`, confirmed in `native-date-adapter.ts`'s own
// `getYear`/`getMonth`/`getDate`), but `toIso8601()` specifically reads UTC getters instead (its
// own deliberate choice for ISO8601 serialization — see that function's own comment). Round-
// tripping a LOCAL-midnight `Date` (what typing/picking a date actually produces) through
// `toIso8601()` reads it back a calendar day off whenever the local timezone isn't UTC+0 exactly
// — this spike's own test caught it (typed "7/14/1992", the picker displayed "7/13/1992" after
// round-tripping through Formisch). These two tiny LOCAL-TIME-based helpers avoid the mismatch
// by never touching UTC at all, matching the datepicker's own convention throughout.
export function isoToDate(iso: string | undefined): Date | null {
  if (!iso) return null;
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!match) return null;
  const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  return Number.isNaN(date.getTime()) ? null : date;
}

export function dateToIso(date: Date | null): string {
  if (date == null || Number.isNaN(date.getTime())) return '';
  const year = String(date.getFullYear()).padStart(4, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/** `useMatDatepicker()`'s `onValueChange$` — fires uniformly whether the user typed or picked a
 *  date (no datepicker-specific "input vs change" split to worry about, unlike a plain text
 *  input). */
export function matDatepickerOnValueChange(field: AnyField): QRL<(value: Date | null) => void> {
  return $((value: Date | null) => field.onInput(dateToIso(value)));
}

/** `<MatDatepickerInput>` bindings — `ref` (composed with the picker's own internal ref; see
 *  `qwik-material/input`'s identical `ref` addition) so Formisch's `focus()` can find the native
 *  element on an invalid submit, plus `onFocus$`/`onBlur$` forwarded to `field.props` for
 *  touched/validation-timing (NOT `onInput$`/`onChange$` — the datepicker's own `onValueChange$`
 *  handle callback above already drives Formisch's value for both typed AND picked dates; the
 *  native input's raw, partially-typed text is not what the field's value should ever be). */
export function matDatepickerInputBindings(field: AnyField): MatFieldState & {
  ref: HostRef<HTMLInputElement>;
  onFocus$: QRL<(event: FocusEvent, el: HTMLInputElement) => void>;
  onBlur$: QRL<(event: FocusEvent, el: HTMLInputElement) => void>;
} {
  return {
    ref: field.props.ref,
    ...matFieldState(field),
    onFocus$: $(() => field.props.onFocus$()),
    onBlur$: $(() => field.props.onBlur$()),
  };
}

/**
 * Keeps `picker.value` in sync with an EXTERNAL change to the field's input (a form library's
 * `reset()`/`setInput()`, e.g. the "Fill example data" button or Formisch's own `reset()`) —
 * needed because `useMatDatepicker({value})`'s own `value` OPTION can't do this itself (a plain
 * hook-call argument, not a `component$` prop — see `datepicker/SYNC.md`'s 2026-11-02 entry for
 * the confirmed-live reason the obvious fix doesn't work there). A small custom hook (not a
 * plain function) because it needs `useTask$` — call it unconditionally, once, from your route's
 * top level, same as any other hook.
 */
export function useSyncDatepickerField(field: AnyField, picker: MatDatepickerHandle<Date>): void {
  useTask$(({track}) => {
    const iso = track(() => field.input.value) as string | undefined;
    const next = isoToDate(iso);
    const current = picker.value.value;
    if ((next?.getTime() ?? null) !== (current?.getTime() ?? null)) {
      setMatDatepickerValue(picker, next);
    }
  });
}
