import {Slot, component$, type QRL} from '@qwik.dev/core';
import {useContext} from '@qwik.dev/core';
import {MAT_FORM_FIELD_CONTROL_STATE} from '@angular-community/qwik-material/core';

/**
 * A `<select matNativeControl>` form-field control, generalized from `select/example`'s original
 * one-off version (see that file's own doc comment for why this exists at all — `qwik-material/
 * input`'s `MatInput` deliberately doesn't port native-`<select>` support, see its SYNC.md).
 * Reused across every `select-*` docs example whose upstream template pairs a `<mat-select>` card
 * with a `<select matNativeControl>` card (`select-form`, `select-hint-error`, `select-disabled`,
 * `select-reset`, `select-optgroup`) — each passes different `<option>`/`<optgroup>` children, a
 * different default-selected `value`, and (for the `ngModel`/`FormControl`-bound ones) different
 * `formBound`/`touched`/`dirty`/`invalid`.
 *
 * `formBound`'s `ng-untouched`/`ng-pristine`/`ng-valid`-family classes mirror `MatInput`/
 * `MatSelect`'s own convention (`core/mat-form-field-control.ts`'s "no forms system" deviation) —
 * this control has no `useMatFormControl()` of its own, so the consumer computes `touched`/
 * `dirty`/`invalid` (if any) and passes them straight through, same as every other control in
 * this port.
 */
export interface NativeSelectControlProps {
  /** Non-empty when the first option is genuinely selected (drives `shouldLabelFloat` via
   *  `MatFormField`'s control-agnostic `!empty` formula — see the original version's doc
   *  comment). Pass `''` when the first option is an empty placeholder.
   *
   *  NOT always the same thing as real native-select emptiness — upstream's `shouldLabelFloat`
   *  for a native select floats whenever `firstOption.label` is non-empty EVEN IF the value
   *  itself is empty (`src/material/input/input.ts`'s `shouldLabelFloat` getter), so a caller
   *  that needs to force a float for that reason (see `select-hint-error`) passes a non-empty
   *  sentinel here while passing the GENUINELY correct value through {@link empty} below. */
  value?: string;
  /** Real native-select emptiness, used ONLY for the `aria-invalid` suppression formula below.
   *  Defaults to `!value` — pass this explicitly when it diverges from `value`'s own
   *  float-forcing sentinel (see that prop's doc comment). */
  empty?: boolean;
  required?: boolean;
  disabled?: boolean;
  name?: string;
  id?: string;
  controlType?: string;
  'aria-describedby'?: string;
  /** Present (and `true`) only when the real template binds `ngModel`/`formControl` to this
   *  element — see the module doc comment. Default `false` (no classes), matching `MatInput`. */
  formBound?: boolean;
  touched?: boolean;
  dirty?: boolean;
  invalid?: boolean;
  onChange$?: QRL<(event: Event, el: HTMLSelectElement) => void>;
}

export const NativeSelectControl = component$<NativeSelectControlProps>(props => {
  const formField = useContext(MAT_FORM_FIELD_CONTROL_STATE, undefined);
  const id = formField ? formField.assignedId : props.id;
  const ariaDescribedBy = formField ? formField.assignedDescribedBy : props['aria-describedby'];
  const formBound = props.formBound ?? false;
  const touched = props.touched ?? false;
  const dirty = props.dirty ?? false;
  const invalid = props.invalid ?? false;
  const empty = props.empty ?? !props.value;
  // Mirrors `MatInput`'s own `[attr.aria-invalid]': '(empty && required) ? null : errorState'`
  // (`src/material/input/input.ts`) — an empty-but-required control suppresses aria-invalid
  // entirely (regardless of errorState) so assistive tech doesn't flag it before the user has
  // had a chance to interact. `errorState` here mirrors `MatInput`/`MatSelect`'s own formula
  // (`formBound && invalid && touched`, no `MatForm`/submitted concept in this local control).
  const errorState = formBound && invalid && touched;
  const ariaInvalid = empty && props.required ? undefined : errorState ? 'true' : 'false';

  const classes = [
    'mat-mdc-input-element',
    formBound && (touched ? 'ng-touched' : 'ng-untouched'),
    formBound && (dirty ? 'ng-dirty' : 'ng-pristine'),
    formBound && (invalid ? 'ng-invalid' : 'ng-valid'),
    'mat-mdc-form-field-input-control',
    'mdc-text-field__input',
    'cdk-text-field-autofill-monitored',
  ]
    .filter((c): c is string => !!c)
    .join(' ');

  return (
    <select
      {...({matnativecontrol: ''} as Record<string, string>)}
      name={props.name || undefined}
      required={props.required || undefined}
      disabled={props.disabled || undefined}
      id={id}
      class={classes}
      aria-invalid={ariaInvalid}
      aria-required={props.required ? 'true' : 'false'}
      aria-describedby={ariaDescribedBy}
      onChange$={props.onChange$}
    >
      <Slot />
    </select>
  );
});
