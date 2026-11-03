import {$, component$, useComputed$, useContext, useSignal, useTask$, type QRL} from '@qwik.dev/core';
import {
  type MatFormFieldControlProps,
  useOptionalFormFieldConnectedOrigin,
  useOptionalFormFieldControlState,
} from '../core/mat-form-field-control';
import {QWIK_CDK} from '@angular-community/qwik-cdk';
import type {DateAdapter} from '../core/datetime/date-adapter';
import {DEFAULT_DATE_ADAPTER} from '../core/datetime/native-date-adapter';
import {resolveDateAdapter} from '../core/datetime/use-date-adapter';
import {
  formatDateWithAdapter,
  handleDatepickerBlur,
  handleDatepickerInput,
  openDatepickerPanel,
} from './datepicker-runtime';
import type {MatDatepickerHandle} from './use-mat-datepicker';
import {useMatFormState} from '../core/mat-form';
import {
  MAT_ERROR_STATE_MATCHER,
  MAT_ERROR_STATE_MATCHER_DEFAULT,
  resolveErrorStateSync,
  type MatErrorStateSnapshot,
} from '../core/error-state-matcher';
import {composeRef, type HostRef} from '../core/host-props';

type NativeInputElement = HTMLInputElement;

const adapter = DEFAULT_DATE_ADAPTER as unknown as DateAdapter<unknown>;

/**
 * Props for `<MatDatepickerInput>`. Mirrors upstream `MatDatepickerInput` (`datepicker-input.ts`)
 * merged with `matInput`'s own control contract — upstream applies BOTH directives to the SAME
 * `<input matInput [matDatepicker]="picker">` element; this port renders one component doing
 * both jobs, exactly like `qwik-material/timepicker`'s own `MatTimepickerInput` (read that
 * component's doc comment first — this one only calls out what's datepicker-specific).
 *
 * `min`/`max`/`value` are NOT props here — they live on the shared `picker` handle
 * (`useMatDatepicker()`) instead, for the SAME cross-sibling-render-order reason
 * `use-mat-datepicker.ts`'s module doc comment gives (`<MatDatepickerToggle>` needs the SAME
 * state, and the two components are unrelated siblings from Qwik's point of view).
 *
 * `formBound` is OMITTED (default `false`) on every scenario in this port's contract EXCEPT
 * `typed-date-blur`, which passes `formBound` (literal `true`). Unlike `qwik-material/timepicker`
 * (where EVERY scenario is `formBound`, because `[matTimepicker]` always provides an implicit
 * value-model regardless of `[(ngModel)]`/`[formControl]`), upstream's real `MatDatepickerInput`
 * provides `NG_VALUE_ACCESSOR`/`NG_VALIDATORS` but NEITHER one, by itself, creates an `NgControl`
 * — that needs an explicit `[(ngModel)]`/`[formControl]`/`formControlName` directive on the SAME
 * element, which only `typed-date-blur`'s `[formControl]="control"` has. Confirmed live: every
 * OTHER scenario's bare `<input matInput [matDatepicker]="picker">` has NO `ng-touched`/
 * `ng-untouched`/etc. classes at all. Pass the SAME value given to `useMatDatepicker()` — this is
 * a true per-usage choice here, unlike timepicker's "always true" requirement.
 *
 * `value` IS still always required (a plain truthiness marker, not the real `D` — which stays on
 * `picker.value`) — PASS `formatDateForDisplay(picker.value.value) || undefined` (the exported
 * helper from `datepicker-runtime.ts`). Same static-introspection reason as `MatTimepickerInput`'s
 * own `value` prop — see that component's doc comment.
 */
export interface MatDatepickerInputProps<D = unknown> extends Omit<
  MatFormFieldControlProps,
  'touched' | 'dirty' | 'invalid'
> {
  /** The shared handle from `useMatDatepicker()`. Declared generic for documentation purposes
   *  only — see `MatTimepickerInputProps<D>`'s identical doc comment for why. */
  picker: MatDatepickerHandle<D>;
  /** An external ref, composed with this component's own `picker._elementRef` — see
   *  `MatInputProps.ref`'s doc comment (`input/mat-input.tsx`) for the rationale; same use case
   *  (a form library's field-registration ref). Needed for `focus()`-style programmatic focus
   *  support, since `picker._elementRef` alone is internal to this package. */
  ref?: HostRef<NativeInputElement>;
  name?: string;
  class?: string | ReadonlyArray<string>;
  onInput$?: QRL<(event: Event, el: NativeInputElement) => void>;
  onFocus$?: QRL<(event: FocusEvent, el: NativeInputElement) => void>;
  onBlur$?: QRL<(event: FocusEvent, el: NativeInputElement) => void>;
}

export const MatDatepickerInput = component$<MatDatepickerInputProps>(props => {
  const picker = props.picker;
  const ctx = useContext(QWIK_CDK);
  const required = props.required ?? false;
  const formBound = props.formBound ?? false;
  // Mirrors upstream's `<input matInput [matDatepicker]="picker" disabled>` — overrides
  // `picker.disabled` for THIS input only (the toggle and calendar are unaffected). Falls back
  // to `picker.disabled.value` when omitted (every pre-existing usage). See
  // `datepicker/SYNC.md`'s "independent per-element disabled" entry.
  const disabledOverride = props.disabled ?? picker.disabled.value;

  const formField = useOptionalFormFieldControlState();
  const isInFormField = formField !== undefined;
  // Stashed for `datepicker-runtime.ts`'s `openDatepickerPanel`/origin resolution — see
  // `use-mat-datepicker.ts`'s own doc comment on `_formFieldOrigin` for why a plain field
  // assignment here (not a signal write) is safe.
  picker._formFieldOrigin = useOptionalFormFieldConnectedOrigin();
  picker._formFieldLabelId = formField?.labelId;

  // Unlike `MatInput`/`MatTimepickerInput` (whose touched/dirty/invalid can come from an
  // external `useMatFormControl()`/the picker handle respectively, needing a props-based
  // fallback for standalone usage), THIS control's touched/dirty/invalid always live on
  // `picker` itself (see `use-mat-datepicker.ts`) — there is no separate "standalone" shape.
  const touched = isInFormField ? formField.touched : picker.touched.value;
  const dirty = isInFormField ? formField.dirty : picker.dirty.value;
  const invalid = isInFormField ? formField.invalid : picker.parseError.value;
  // `ErrorStateMatcher` — see `core/error-state-matcher.ts`'s own doc comment and `select/
  // SYNC.md`'s `compareWith` section (same `useSignal`+`useTask$` resolution pattern) for the
  // full design.
  const formState = useMatFormState();
  const errorMatcherConfig = useContext(MAT_ERROR_STATE_MATCHER, MAT_ERROR_STATE_MATCHER_DEFAULT);
  const errorMatcher = props.errorStateMatcher ?? errorMatcherConfig;
  const errorStateSignal = useSignal(() =>
    typeof errorMatcher === 'string'
      ? resolveErrorStateSync(
          {invalid, touched, dirty, submitted: formState.submitted},
          errorMatcher,
        )
      : false,
  );
  useTask$(({track}) => {
    const snapshot: MatErrorStateSnapshot = {
      invalid: track(() => (isInFormField ? formField.invalid : picker.parseError.value)),
      touched: track(() => (isInFormField ? formField.touched : picker.touched.value)),
      dirty: track(() => (isInFormField ? formField.dirty : picker.dirty.value)),
      submitted: track(() => formState.submitted),
    };
    const currentMatcher = props.errorStateMatcher ?? errorMatcherConfig;
    if (typeof currentMatcher === 'string') {
      errorStateSignal.value = resolveErrorStateSync(snapshot, currentMatcher);
      return;
    }
    return currentMatcher.resolve().then(fn => {
      errorStateSignal.value = !!fn(snapshot);
    });
  });
  const errorState = formBound && errorStateSignal.value;

  const id = formField ? formField.assignedId : props.id;
  const ariaDescribedBy = formField ? formField.assignedDescribedBy : props['aria-describedby'];

  // Live resync of `formField.empty`/`.shouldLabelFloat` from `picker.value` — mirrors
  // upstream's ALWAYS-FRESH `_control.empty`/`shouldLabelFloat` GETTERS (re-evaluated on every
  // Angular change-detection tick, so a value set via `select(date)`/the calendar — never a
  // focus/blur event on THIS native input — still updates the floating label). This port's
  // other event-driven `formField.empty`/`.shouldLabelFloat` writes (`handleFocus$`/
  // `handleBlur$` below) only fire on a real focus/blur of the input itself, which a calendar
  // selection never causes (`datepicker-runtime.ts`'s `closeDatepickerPanel` always restores
  // focus to the TOGGLE, not the input — confirmed live, see that function's doc comment).
  // Reading `picker.value.value` HERE, during this component's OWN render, re-runs this guarded
  // write whenever that signal changes, regardless of which OTHER component triggered it — same
  // "guarded write during render" pattern `mat-form-field.tsx` itself uses for its own context
  // store.
  // Upstream's `MatInput.empty` reads the NATIVE value: unparseable text ("not a date", model
  // `null`) still counts as non-empty and floats the label. Computed unconditionally (not just
  // `if (formField)`) because `ariaInvalid` below also needs it for the SAME "aria-invalid
  // omitted while empty && required" rule `MatInput`'s own `emptySignal` enforces — confirmed
  // against a real Angular mirror (a pristine, empty, required `[matDatepicker]` input has NO
  // `aria-invalid` attribute at all, not `aria-invalid="false"`; this port previously always
  // rendered one or the other, never omitting it — see datepicker/SYNC.md's 2026-11-02 entry).
  const nativeText = (picker._elementRef.value as NativeInputElement | undefined)?.value;
  const liveEmpty = picker.value.value == null && !nativeText;
  if (formField) {
    if (formField.empty !== liveEmpty) {
      formField.empty = liveEmpty;
      formField.shouldLabelFloat = formField.focused || !liveEmpty;
    }
  }

  // SSR-correct initial display string. `mountValue`/`mountLocale` snapshot `picker.value.value`/
  // `picker._locale.value` ONCE, at mount — this feeds a native `value` DOM property write,
  // which must never be reactively rewritten later (it would clobber whatever the user is
  // actively typing), mirroring `MatInput`'s/`MatTimepickerInput`'s own frozen `initialValue`
  // pattern exactly. `initialDisplay` itself is a `useComputed$`, not a plain `useSignal`,
  // because formatting a NON-null seed needs the app-configured `DateAdapter` (an app-supplied
  // custom adapter's whole point — e.g. `dd.mm.yyyy` — see `datepicker/SYNC.md`), which can only
  // be resolved asynchronously (`picker._dateAdapterFactory` is a `QRL` factory). The compute
  // function returns a plain, synchronous string when there's nothing to format (the common
  // empty-input case — never even an `async function`, so this never enters the async-
  // suspension engine for it) and a `Promise<string>` only when a seed value needs the
  // configured adapter's own `format()`. Reading `.value` on a still-pending result THROWS the
  // in-flight promise, which Qwik's own renderer catches and retries — SSR blocks until
  // resolved (so the server HTML already has the real formatted text, never the wrong
  // hardcoded-default one, and never a flash/fallback state), and the client re-suspends the
  // same way on its own first read after a resume. Same pattern `qwik-material/icon`'s own
  // `resolvedSvgIcon` established first (see that package's SYNC.md deviation #20 for the
  // confirmed-live `AsyncSignal`/`ComputedSignal` suspend-and-retry semantics this relies on).
  const mountValue = useSignal(() => picker.value.value);
  const mountLocale = useSignal(() => picker._locale.value);
  const initialDisplay = useComputed$(() => {
    if (mountValue.value == null) return '';
    return resolveDateAdapter(picker._dateAdapterFactory, mountLocale.value).then(a =>
      formatDateWithAdapter(a, picker._dateFormats, mountValue.value),
    );
  });

  const handleFocus$ = $((event: FocusEvent) => {
    if (!disabledOverride && formField) {
      formField.focused = true;
      formField.shouldLabelFloat = true;
    }
    props.onFocus$?.(event, picker._elementRef.value as NativeInputElement);
  });

  const handleBlur$ = $(async (event: FocusEvent) => {
    await handleDatepickerBlur(picker);
    const liveEmpty = !(picker._elementRef.value as NativeInputElement | undefined)?.value;
    if (formField) {
      formField.focused = false;
      formField.empty = liveEmpty;
      formField.shouldLabelFloat = !liveEmpty;
    }
    props.onBlur$?.(event, picker._elementRef.value as NativeInputElement);
  });

  const handleInput$ = $(async (event: Event) => {
    await handleDatepickerInput(event, picker);
    props.onInput$?.(event, picker._elementRef.value as NativeInputElement);
  });

  // Mirrors `MatDatepickerInputBase._onKeydown()` — Alt+Down opens the popup (not exercised by
  // any scenario in this port's contract; ported for fidelity, same low cost as
  // `MatTimepickerInput`'s own closed-picker Up/Down-arrow handling).
  const handleKeyDown$ = $((event: KeyboardEvent) => {
    const isAltDown =
      event.altKey &&
      event.key === 'ArrowDown' &&
      !event.ctrlKey &&
      !event.shiftKey &&
      !event.metaKey;
    if (isAltDown && !props.readOnly) {
      event.preventDefault();
      openDatepickerPanel(picker, ctx);
    }
  });

  const isOpen = picker.isOpen.value;
  const minDate = picker.min.value;
  const maxDate = picker.max.value;

  const classes = [
    'mat-datepicker-input',
    'mat-mdc-input-element',
    isInFormField && 'mat-mdc-form-field-input-control',
    isInFormField && 'mdc-text-field__input',
    'cdk-text-field-autofill-monitored',
    formBound && (touched ? 'ng-touched' : 'ng-untouched'),
    formBound && (dirty ? 'ng-dirty' : 'ng-pristine'),
    formBound && (invalid ? 'ng-invalid' : 'ng-valid'),
    props.class,
  ].filter(Boolean) as string[];

  // Mirrors `MatInput`'s identical formula (`mat-input.tsx`'s own `ariaInvalid`) — see the
  // `liveEmpty` comment above for why this was wrong before.
  const ariaInvalid: 'true' | 'false' | undefined =
    liveEmpty && required ? undefined : errorState ? 'true' : 'false';

  return (
    // No `type` attribute — mirrors `MatInput`'s own established rule: upstream's real
    // `<input matInput [matDatepicker]="picker">` never binds `[type]`, so Angular never writes
    // the attribute at all (confirmed live; see `mat-input.tsx`'s identical comment).
    <input
      ref={composeRef([picker._elementRef, props.ref])}
      id={id}
      class={classes}
      disabled={disabledOverride || undefined}
      required={required || undefined}
      name={props.name || undefined}
      aria-haspopup="dialog"
      aria-owns={isOpen ? picker.id : undefined}
      {...{min: minDate != null ? (adapter.toIso8601(minDate) as string) : undefined}}
      {...{max: maxDate != null ? (adapter.toIso8601(maxDate) as string) : undefined}}
      {...{'data-mat-calendar': picker.id}}
      aria-invalid={ariaInvalid}
      aria-required={required ? 'true' : 'false'}
      aria-describedby={ariaDescribedBy}
      {...{value: initialDisplay.value || undefined}}
      onFocus$={handleFocus$}
      onBlur$={handleBlur$}
      onInput$={handleInput$}
      onKeyDown$={handleKeyDown$}
    />
  );
});
