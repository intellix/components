import {component$, useContext} from '@builder.io/qwik';
import {
  MAT_FORM_FIELD_CONTROL_STATE,
  type MatFormFieldControlProps,
} from '@angular-community/qwik-material/core';

/**
 * A `<select matNativeControl>` form-field control — the `select-overview` docs example's
 * second card (src/components-examples/material/select/select-overview/select-overview-
 * example.html). `qwik-material/input`'s `MatInput` deliberately doesn't port
 * `matNativeControl`/native-`<select>` support (see its SYNC.md: "no parity scenario uses a
 * native select"); this example is the first one that does, so rather than grow `MatInput` with
 * a whole second host-element kind for one docs example, this is a small, LOCAL (this route
 * only) control implementing the SAME `MatFormFieldControlProps` contract `MatInput`/`MatSelect`
 * already implement (see `core/mat-form-field-control.ts`'s doc comment — ANY component can be
 * `<MatFormField control={...}>`'s control, not just the two the package ships).
 *
 * `MatFormField` reads `value`/`required`/`controlType` straight off THIS element's own JSX
 * descriptor (before rendering anything), so passing a non-empty literal `value` here is what
 * makes `MatFormField`'s already-correct, control-agnostic `shouldLabelFloat`/
 * `hidePlaceholder` formulas produce the right result for a native select whose first option is
 * always "selected" by plain HTML default — no native-select-specific logic needed in
 * `MatFormField` itself. Confirmed live against the real example
 * (http://localhost:4200/qwik-parity/mat-select/example): `shouldLabelFloat` is `true` from the
 * very first render (`mdc-floating-label--float-above`, no `mat-form-field-hide-placeholder`) —
 * exactly what `!empty` (from this non-empty `value`) already gives for a plain `MatInput`.
 */
export const NativeSelectControl = component$<MatFormFieldControlProps>(props => {
  const formField = useContext(MAT_FORM_FIELD_CONTROL_STATE, undefined);
  const id = formField ? formField.assignedId : props.id;
  const ariaDescribedBy = formField ? formField.assignedDescribedBy : props['aria-describedby'];

  return (
    <select
      {...({matnativecontrol: ''} as Record<string, string>)}
      required={props.required || undefined}
      id={id}
      class="mat-mdc-input-element mat-mdc-form-field-input-control mdc-text-field__input cdk-text-field-autofill-monitored"
      aria-invalid="false"
      aria-required={props.required ? 'true' : 'false'}
      aria-describedby={ariaDescribedBy}
    >
      <option value="volvo">Volvo</option>
      <option value="saab">Saab</option>
      <option value="mercedes">Mercedes</option>
      <option value="audi">Audi</option>
    </select>
  );
});
