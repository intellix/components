import {$, component$, useContext, useSignal, useTask$, type QRL} from '@builder.io/qwik';
import {useIdGenerator} from '@angular-community/qwik-cdk/a11y';
import {
  MAT_FORM_FIELD_CONTROL_STATE,
  type MatFormFieldControlProps,
} from '../core/mat-form-field-control';
import {MAT_INPUT_CONFIG, MAT_INPUT_CONFIG_DEFAULTS} from './input-config';

type NativeControlElement = HTMLInputElement | HTMLTextAreaElement;

/**
 * Props for `<MatInput>`. Mirrors upstream's `matInput`/`matNativeControl`
 * directive (`src/material/input/input.ts`) applied to a native `<input>`
 * or `<textarea>` (the `as` prop — the polymorphic-host pattern design doc
 * rule 4 establishes for a directive-on-a-consumer-element: "the Qwik
 * component renders that element itself via a polymorphic `as` prop").
 *
 * Extends {@link MatFormFieldControlProps} — the Qwik port's
 * `MatFormFieldControl` contract (`core/mat-form-field-control.ts`) — so
 * `<MatFormField control={<MatInput .../>}>` can introspect this exact
 * props shape at its own SSR render time, with no execution of `MatInput`
 * itself required. `formBound`/`touched`/`dirty`/`invalid`/`required`
 * (when derived from validators, not a literal `required` attribute) are
 * all computed by the CONSUMER from `useMatFormControl()` +
 * `core/mat-form-control.ts`'s pure validator functions and passed in
 * directly — see that module's doc comment for why `MatInput` never
 * receives a `FormControl`/validators object itself.
 */
export interface MatInputProps extends MatFormFieldControlProps {
  /** Which native element to render. Default `'input'`. */
  as?: 'input' | 'textarea';
  /** Input type (ignored for `as="textarea"`, which has none). Default `'text'`. */
  type?: string;
  name?: string;
  /** `as="textarea"` only. */
  rows?: number;
  maxLength?: number;
  /** Whether the input should remain interactive when disabled. Falls
   *  back to `MatInputConfig`, then `false`. */
  disabledInteractive?: boolean;
  class?: string | ReadonlyArray<string>;
  /** Fires on the native `input` event with the live element — read
   *  `el.value` for the current value (matches upstream's own
   *  `(input)="_onInput()"`, which exists purely so change detection
   *  notices the native value changed; this port's consumer reads the
   *  value directly off the element, same as a plain uncontrolled React
   *  input). */
  onInput$?: QRL<(event: Event, el: NativeControlElement) => void>;
  onFocus$?: QRL<(event: FocusEvent, el: NativeControlElement) => void>;
  onBlur$?: QRL<(event: FocusEvent, el: NativeControlElement) => void>;
}

export const MatInput = component$<MatInputProps>(props => {
  const config = useContext(MAT_INPUT_CONFIG, MAT_INPUT_CONFIG_DEFAULTS);
  const as = props.as ?? 'input';
  const isTextarea = as === 'textarea';
  const type = props.type ?? 'text';
  const disabled = props.disabled ?? false;
  const disabledInteractive = props.disabledInteractive ?? config.disabledInteractive ?? false;
  const required = props.required ?? false;
  const formBound = props.formBound ?? false;
  const touched = props.touched ?? false;
  const dirty = props.dirty ?? false;
  // Mirrors the DEFAULT `ErrorStateMatcher` exactly (same formula as
  // `MatFormField`'s own independent copy — see that file's comment; each
  // renders its own classes/attributes off this, so each computes it
  // itself rather than threading it through the context store, which only
  // ever carries focused/empty/shouldLabelFloat — see
  // core/mat-form-field-control.ts).
  const errorState = formBound && touched && (props.invalid ?? false);
  const empty = !props.value;

  // Only present when actually nested in a `<MatFormField>` (context
  // absent otherwise — see core/mat-form-field-control.ts's doc comment:
  // "never exists without an owning MatFormField").
  const formField = useContext(MAT_FORM_FIELD_CONTROL_STATE, undefined);
  const isInFormField = formField !== undefined;

  // Fallback id for standalone usage (`matNativeControl` outside a form
  // field, or a consumer that didn't specify one) — mirrors upstream's own
  // `_uid = inject(_IdGenerator).getId('mat-input-')` constructor fallback.
  // In the common case (nested in `<MatFormField control={...}>`),
  // `MatFormField` already injected a concrete `id` onto this element's
  // props before it ever rendered (see `mat-form-field.tsx`'s "id
  // ownership" note), so this lazy initializer never actually runs its
  // id-generation path.
  const idGen = useIdGenerator();
  const autoId = useSignal(() => idGen.getId('mat-input-'));
  const id = props.id ?? autoId.value;

  const inputRef = useSignal<Element>();

  // ── `value` — deliberately NOT a plain reactive JSX prop. See
  // input/SYNC.md's "value on text inputs" writeup for the full reasoning;
  // summary: the parity harness's own comment groups `value` with
  // `checked` as a "non-reflected IDL property" (once set via the live
  // property, it diverges from its content attribute for good), but —
  // unlike checkbox/radio — the harness has NO live-property substitution
  // for `value` on a plain text input, so a STALE/leaked `value` attribute
  // here (checkbox's accepted trade-off, safe only because the harness
  // special-cases `.checked`) would be a REAL, DETECTED diff. Two
  // requirements that would otherwise conflict:
  //  1. `disabled`/`readonly` scenarios pass a literal, STATIC `value="…"`
  //     string that must appear as a real attribute (Angular's own side
  //     has it as a plain, unbound HTML attribute, never touched again).
  //  2. `error-state` passes a LIVE, CHANGING `value` (from
  //     `useMatFormControl()`, fed by typing) that must NEVER leave a
  //     `value="…"` attribute behind (Angular's `[formControl]` binding
  //     is a PROPERTY binding, which never touches the attribute, at any
  //     value, ever).
  // Resolved by rendering the attribute from a ONE-TIME SNAPSHOT
  // (`useSignal(() => props.value)` — captured once, at first render,
  // never reassigned) normalizing `''` to `undefined` (no tested scenario
  // needs an attribute-visible EMPTY initial value, and omitting it
  // sidesteps even having to know whether Qwik's SSR writes `value=""`
  // literally for an empty string) — satisfies (1) exactly (the value
  // never changes for those scenarios, so the frozen snapshot IS the only
  // value there ever is) and (2) at the attribute level (the live,
  // reactive `fc.value` never reaches this JSX prop at all). The
  // useTask$ below handles LIVE updates — including (2)'s typed value —
  // by setting the DOM PROPERTY directly via the ref, exactly mirroring
  // qwik-material/checkbox's proven `checked`/`indeterminate` fix (the
  // task's effect on the SSR pass's mock element has zero effect on the
  // serialized HTML; on the client it reruns only when `props.value`
  // actually changes, with no JSX-prop-diffing path involved at all).
  const initialValue = useSignal(() => props.value);
  useTask$(({track}) => {
    const value = track(() => props.value);
    const el = inputRef.value as NativeControlElement | undefined;
    if (el && value !== undefined && el.value !== value) {
      el.value = value;
    }
  });

  // Mirrors `_focusChanged(true)`. Live-reads `props.disabled` (not the
  // outer-scope `disabled` const) for the same "stale QRL capture" reason
  // documented throughout this project's other controlled inputs
  // (checkbox/slide-toggle/button-toggle) — this closure can be invoked
  // again by a later focus without an intervening re-render.
  const handleFocus$ = $((event: FocusEvent) => {
    const liveDisabled = props.disabled ?? false;
    if (formField && !liveDisabled) {
      formField.focused = true;
      formField.shouldLabelFloat = true;
    }
    props.onFocus$?.(event, inputRef.value as NativeControlElement);
  });

  // Mirrors `_focusChanged(false)` + the live-DOM-value half of
  // `_dirtyCheckNativeValue`/`empty` — read directly off the real element
  // (a ref), not a copied signal, so this is correct regardless of whether
  // the consumer tracks the value themselves (see `mat-form-field.tsx`'s
  // "SSR ordering" note: this is the one moment `empty` needs to be
  // correct for any of the 16 parity scenarios — see that file's "Outline
  // notch width" comment for the same lazy-measurement reasoning).
  const handleBlur$ = $((event: FocusEvent) => {
    const el = inputRef.value as NativeControlElement | undefined;
    if (formField) {
      const liveEmpty = !el?.value;
      formField.focused = false;
      formField.empty = liveEmpty;
      formField.shouldLabelFloat = !liveEmpty;
    }
    props.onBlur$?.(event, el as NativeControlElement);
  });

  const handleInput$ = $((event: Event) => {
    props.onInput$?.(event, inputRef.value as NativeControlElement);
  });

  const classes = [
    'mat-mdc-input-element',
    isInFormField && isTextarea && 'mat-mdc-form-field-textarea-control',
    isInFormField && 'mat-mdc-form-field-input-control',
    disabledInteractive && 'mat-mdc-input-disabled-interactive',
    isInFormField && 'mdc-text-field__input',
    // Mirrors `NgControlStatus` (`[formControl],[ngModel],[formControlName]`)
    // — only present at all when bound to a reactive-forms-like control;
    // see the big comment in angular-parity.spec.ts.
    formBound && (touched ? 'ng-touched' : 'ng-untouched'),
    formBound && (dirty ? 'ng-dirty' : 'ng-pristine'),
    formBound && (errorState ? 'ng-invalid' : 'ng-valid'),
    // `cdk-text-field-autofill-monitored`: upstream's `AutofillMonitor`
    // adds this unconditionally (browser-only) the first time
    // `ngAfterViewInit` runs — no real autofill-detection behavior is
    // ported (the `animationstart`-based CSS trick that backs it has no
    // parity scenario exercising it; static marker class only, same
    // "static containers, not the lazy JS behind them" scope line the
    // remediation design doc draws for ripples — see SYNC.md), so it's
    // simply always present rather than gated behind a lazy mount check.
    'cdk-text-field-autofill-monitored',
    props.class,
  ].filter(Boolean) as string[];

  // Mirrors `_getReadonlyAttribute()`: a literal STRING `'true'` (never
  // bare `readonly` or `'false'`) when readonly, or disabled-and-
  // disabledInteractive — confirmed live, see angular-parity.spec.ts's
  // READONLY note.
  const readonlyAttr: 'true' | undefined =
    (props.readOnly ?? false) || (disabled && disabledInteractive) ? 'true' : undefined;

  const ariaInvalid: 'true' | 'false' | undefined =
    empty && required ? undefined : errorState ? 'true' : 'false';
  const ariaRequired: 'true' | 'false' = required ? 'true' : 'false';
  const ariaDisabled: 'true' | undefined = disabled && disabledInteractive ? 'true' : undefined;

  const sharedProps = {
    ref: inputRef,
    id,
    class: classes,
    disabled: (disabled && !disabledInteractive) || undefined,
    required: required || undefined,
    name: props.name || undefined,
    // `readonly` is written via a plain attribute spread (bypassing
    // Qwik's boolean-property-mapped `readOnly` JSX prop) so the DOM gets
    // the literal STRING `readonly="true"` upstream's own
    // `[attr.readonly]` binding produces — never bare `readonly=""` — see
    // the ariaInvalid/readonlyAttr comment above and
    // angular-parity.spec.ts's READONLY note. Same technique as
    // `mat-ripple`/`matformfieldlineripple` elsewhere in this project.
    ...{readonly: readonlyAttr},
    placeholder: props.placeholder,
    value: initialValue.value || undefined,
    'aria-disabled': ariaDisabled,
    'aria-invalid': ariaInvalid,
    'aria-required': ariaRequired,
    'aria-describedby': props['aria-describedby'],
    onFocus$: handleFocus$,
    onBlur$: handleBlur$,
    onInput$: handleInput$,
  };

  if (isTextarea) {
    return <textarea {...sharedProps} rows={props.rows} maxLength={props.maxLength} />;
  }
  return <input {...sharedProps} type={type} maxLength={props.maxLength} />;
});
