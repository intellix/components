import {$, component$, useContext, useSignal, useTask$, type QRL} from '@qwik.dev/core';
import {useIdGenerator} from '@angular-community/qwik-cdk/a11y';
import {
  type MatFormFieldControlProps,
  useOptionalFormFieldControlState,
} from '../core/mat-form-field-control';
import {MAT_INPUT_CONFIG, MAT_INPUT_CONFIG_DEFAULTS} from './input-config';
import {useMatFormSubmitted} from '../core/mat-form';
import {composeRef, type HostRef} from '../core/host-props';

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
  /**
   * An external ref, composed (via {@link composeRef}) with this component's own internal
   * `inputRef` — so a consumer-owned mechanism that needs the live native element (a form
   * library's field-registration ref, e.g. Formisch's `field.props.ref`, used for `focus()`/
   * programmatic reset — see `qwik-material/README.md`'s "Using with Formisch") can get it
   * without this component giving up its OWN ref (still needed for `handleFocus$`/
   * `handleBlur$`/`handleInput$`/the value-sync `useTask$` above). Both refs receive the SAME
   * element; neither one's absence affects the other.
   */
  ref?: HostRef<NativeControlElement>;
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
  const disabled = props.disabled ?? false;
  const disabledInteractive = props.disabledInteractive ?? config.disabledInteractive ?? false;
  const required = props.required ?? false;
  const formBound = props.formBound ?? false;

  // Only present when actually nested in a `<MatFormField>` (context
  // absent otherwise — see core/mat-form-field-control.ts's doc comment:
  // "never exists without an owning MatFormField").
  const formField = useOptionalFormFieldControlState();
  const isInFormField = formField !== undefined;

  // Prefer the context store's LIVE touched/dirty/invalid (written by the
  // owning `MatFormField` from ITS OWN top-level props — see
  // core/mat-form-field-control.ts's doc comment for why `props.touched`/
  // `.dirty`/`.invalid` are frozen-after-first-render and cannot be relied
  // on here directly: this exact element's JSX descriptor, nested as the
  // VALUE of `MatFormField`'s `control` prop, is only ever constructed
  // once). Standalone usage (no owning `MatFormField`) has no such store
  // to read, so it falls back to the (then correctly-live, since nothing
  // forwards THIS element's props through another component in that case)
  // plain props.
  const touched = isInFormField ? formField.touched : (props.touched ?? false);
  const dirty = isInFormField ? formField.dirty : (props.dirty ?? false);
  // RAW validity (upstream's `NgControlStatus` — `ng-valid`/`ng-invalid`
  // mirror `.valid`/`.invalid` DIRECTLY, independent of touched/dirty —
  // see `mat-form-field.tsx`'s matching comment; NOT the same as
  // `errorState` below, which gates `aria-invalid`/visible errors by
  // touched too).
  const invalid = isInFormField ? formField.invalid : (props.invalid ?? false);
  // Mirrors the DEFAULT `ErrorStateMatcher` exactly (same formula as
  // `MatFormField`'s own independent copy — see that file's comment; each
  // renders its own classes/attributes off this value).
  // Default ErrorStateMatcher: `invalid && (touched || form.submitted)` — see core/mat-form.tsx.
  const formSubmitted = useMatFormSubmitted();
  const errorState = formBound && invalid && (touched || formSubmitted);
  // Live "is this control empty" — seeded from `props.value` for first paint. Kept live
  // thereafter two ways: (1) `handleInput$` below has direct access to the live DOM element via
  // `inputRef` and updates this signal itself on every real keystroke — entirely within this
  // one component, no round-trip through `MatFormField`'s context store needed (confirmed
  // needed: `aria-invalid` reads this on every render, and a render can now happen BEFORE blur
  // too — e.g. when `invalid` flips as soon as a validator starts/stops failing while typing,
  // before `touched` ever becomes true); (2) the value-sync `useTask$` below ALSO re-derives it
  // from `props.value` on every change — needed for an EXTERNAL, non-typed reassignment (a form
  // library's `reset()`/`setInput()`, e.g. Formisch — see `qwik-material/README.md`'s "Using
  // with Formisch"), which `handleInput$` never fires for at all. `props.value` itself must be
  // passed as a literal, NAMED `value={...}` JSX attribute for (2) to work — nested two levels
  // deep inside `<MatFormField control={<MatInput value={...} />}>`'s frozen `control` prop
  // (see core/mat-form-field-control.ts's doc comment), only a literal attribute expression
  // gets Qwik's live per-attribute tracking; a `{...spreadProps}`-sourced `value` is flattened
  // to a plain, dead value at spread time and never updates — confirmed live, see
  // `input/SYNC.md`'s 2026-11-02 entry.
  const emptySignal = useSignal(() => !props.value);

  // Fallback id for standalone usage (`matNativeControl` outside a form
  // field, or a consumer that didn't specify one) — mirrors upstream's own
  // `_uid = inject(_IdGenerator).getId('mat-input-')` constructor fallback.
  const idGen = useIdGenerator();
  const autoId = useSignal(() => idGen.getId('mat-input-'));
  // When nested in a `<MatFormField control={...}>`, the form field is the
  // AUTHORITY for both `id` (so its label's `for` always agrees — see
  // core/mat-form-field-control.ts's `assignedId` doc comment) and
  // `aria-describedby` (so it always reflects the form field's current
  // hint/error ids). Read from the context STORE, never injected by
  // cloning this element's JSX — a clone-based approach was tried first
  // and found, via a real hung-browser repro, to silently freeze a
  // sibling slot's projected children after an unrelated re-render; a
  // store field has no such issue. Standalone usage (no owning
  // `MatFormField`) falls back to this component's own id/prop.
  const id = formField ? formField.assignedId : (props.id ?? autoId.value);
  const ariaDescribedBy = formField ? formField.assignedDescribedBy : props['aria-describedby'];

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
    // Re-derive `empty`/`shouldLabelFloat` for an EXTERNAL value reassignment — see
    // `emptySignal`'s own doc comment above. A real typed keystroke already updates these via
    // `handleInput$` (which runs first, synchronously, on the native `input` event — this task
    // merely re-confirms the same value moments later); this is the path that fires for a
    // reassignment `handleInput$` never sees at all.
    if (value !== undefined) {
      const liveEmpty = !value;
      if (emptySignal.value !== liveEmpty) emptySignal.value = liveEmpty;
      if (formField) {
        if (formField.empty !== liveEmpty) formField.empty = liveEmpty;
        const shouldFloat = formField.focused || !liveEmpty;
        if (formField.shouldLabelFloat !== shouldFloat) formField.shouldLabelFloat = shouldFloat;
      }
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
    const liveEmpty = !el?.value;
    emptySignal.value = liveEmpty;
    if (formField) {
      formField.focused = false;
      formField.empty = liveEmpty;
      formField.shouldLabelFloat = !liveEmpty;
    }
    props.onBlur$?.(event, el as NativeControlElement);
  });

  const handleInput$ = $((event: Event) => {
    const el = inputRef.value as NativeControlElement | undefined;
    emptySignal.value = !el?.value;
    props.onInput$?.(event, el as NativeControlElement);
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
    formBound && (invalid ? 'ng-invalid' : 'ng-valid'),
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
    emptySignal.value && required ? undefined : errorState ? 'true' : 'false';
  const ariaRequired: 'true' | 'false' = required ? 'true' : 'false';
  const ariaDisabled: 'true' | undefined = disabled && disabledInteractive ? 'true' : undefined;

  const sharedProps = {
    ref: composeRef([inputRef, props.ref]),
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
    // Also a plain attribute spread, not the normal `value` JSX prop —
    // found live: Qwik's SSR serializer treats `value` as a pure DOM
    // PROPERTY for `<input>`/`<textarea>` and never writes it as an SSR
    // attribute at all via the standard prop path (confirmed: the
    // `disabled`/`readonly` scenarios' static `value="Mountain View"`/
    // `"ACC-10294"` rendered NO attribute whatsoever as a plain `value={…}`
    // prop, even though the frozen `initialValue` snapshot was correct).
    // The spread form forces a literal `setAttribute`, matching Angular's
    // own plain, unbound `value="…"` template attribute exactly. Safe here
    // specifically because `initialValue` is a frozen, never-reassigned
    // snapshot (see that signal's own comment) — this is not a reactive
    // value prop that would otherwise need the property-diffing path.
    ...{value: initialValue.value || undefined},
    'aria-disabled': ariaDisabled,
    'aria-invalid': ariaInvalid,
    'aria-required': ariaRequired,
    'aria-describedby': ariaDescribedBy,
    'aria-label': props['aria-label'],
    onFocus$: handleFocus$,
    onBlur$: handleBlur$,
    onInput$: handleInput$,
  };

  if (isTextarea) {
    return <textarea {...sharedProps} rows={props.rows} maxLength={props.maxLength} />;
  }
  // `type` is only ever rendered when the consumer explicitly set one —
  // mirrors upstream's `@Input() type` setter, which the TEMPLATE never
  // invokes without an explicit `[type]`/`type="…"` binding, leaving the
  // native element's own browser-default "text" behavior untouched (no
  // `type` attribute at all) rather than writing a redundant
  // `type="text"` nothing in the template ever asked for. Confirmed live:
  // Angular's `fill-basic` input has no `type` attribute whatsoever.
  return <input {...sharedProps} type={props.type} maxLength={props.maxLength} />;
});
