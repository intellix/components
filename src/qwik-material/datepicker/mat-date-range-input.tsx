/**
 * `<MatDateRangeInput>` — ported from upstream `date-range-input.ts`/`.html`. Unlike
 * `MatDatepickerInput` (a plain directive merged with `matInput`), `MatDateRangeInput` is itself
 * a REAL `MatFormFieldControl` — the whole group (both native `<input>`s + the mirror/separator
 * spans) is ONE component, passed as `<MatFormField control={<MatDateRangeInput .../>}>`.
 *
 * `MatStartDate`/`MatEndDate` (upstream's separate directives, projected via
 * `<ng-content select="input[matStartDate]">`/`[matEndDate]`) are collapsed into named props
 * here (`startPlaceholder`/`endPlaceholder`) rather than `<Slot>`-projected children — same
 * "named prop, not projected content" pattern this project uses throughout (see
 * `MatTimepickerToggle`'s `icon` prop). No scenario in this port's contract TYPES into either
 * native input (`range-basic`/`actions` only ever click calendar cells), so the typed-text
 * parsing half of `MatStartDate`/`MatEndDate` (`_onInput`'s `DateAdapter.parse` dispatch, the
 * arrow-key cross-navigation at a boundary, Backspace-to-previous-field) is NOT ported — a
 * documented scope cut, not a missing feature relative to any test (see SYNC.md).
 *
 * Unlike `MatInput`/`MatDatepickerInput` (whose `id` is the authority `MatFormField` itself
 * assigns — see `core/mat-form-field-control.ts`'s `assignedId` doc comment), this control
 * generates its OWN id (`mat-date-range-input-N`, mirrors upstream's own `inject(_IdGenerator)
 * .getId('mat-date-range-input-')` class-field initializer) and sets `disableAutomaticLabeling`
 * (mirrors upstream's identical field, "to avoid issues like #27241") so `MatFormField` never
 * tries to point its floating `<label for="...">` at this control — `aria-labelledby` (not
 * `for`) is how this control associates with that label instead, exactly mirroring
 * `_getAriaLabelledby()`.
 */
import {component$, Slot, useContext, useSignal} from '@builder.io/qwik';
import {useFocusOrigin, useIdGenerator} from '@angular-community/qwik-cdk/a11y';
import {
  MAT_FORM_FIELD_CONNECTED_ORIGIN,
  MAT_FORM_FIELD_CONTROL_STATE,
  type MatFormFieldControlProps,
} from '../core/mat-form-field-control';
import type {DateAdapter} from '../core/datetime/date-adapter';
import {DEFAULT_DATE_ADAPTER} from '../core/datetime/native-date-adapter';
import {formatDateForDisplay} from './datepicker-runtime';
import type {MatDateRangePickerHandle} from './use-mat-datepicker';

const adapter = DEFAULT_DATE_ADAPTER as unknown as DateAdapter<unknown>;

/** `.mat-date-range-input-container`, its own component so `useFocusOrigin()` attaches to THIS
 *  div — mirrors `cdkMonitorSubtreeFocus`/`(cdkFocusChange)="_updateFocus($event)"`. */
const RangeInputContainer = component$(() => {
  const focusOrigin = useFocusOrigin();
  return (
    <div
      class={
        [
          'mat-date-range-input-container',
          focusOrigin.value && 'cdk-focused',
          focusOrigin.value && `cdk-${focusOrigin.value}-focused`,
        ].filter(Boolean) as string[]
      }
      {...{cdkmonitorsubtreefocus: ''}}
    >
      <Slot />
    </div>
  );
});

export interface MatDateRangeInputProps<D = unknown> extends Omit<
  MatFormFieldControlProps,
  'touched' | 'dirty' | 'invalid' | 'value' | 'placeholder'
> {
  picker: MatDateRangePickerHandle<D>;
  startPlaceholder?: string;
  endPlaceholder?: string;
  separator?: string;
  class?: string | ReadonlyArray<string>;
}

export const MatDateRangeInput = component$<MatDateRangeInputProps>(props => {
  const picker = props.picker;
  const idGen = useIdGenerator();
  const id = useSignal(() => idGen.getId('mat-date-range-input-')).value;
  const separator = props.separator ?? '–';

  const formField = useContext(MAT_FORM_FIELD_CONTROL_STATE, undefined);
  const connectedOrigin = useContext(MAT_FORM_FIELD_CONNECTED_ORIGIN, undefined);

  const ariaDescribedBy = formField ? formField.assignedDescribedBy : props['aria-describedby'];
  const ariaLabelledby = formField?.labelId || undefined;

  // Mirrors `isEmpty()`/`getMirrorValue()` — derived LIVE from `picker.value` (the real,
  // committed range — read reactively here, during render, not just once) rather than a
  // typing-only local signal: no scenario in this port's contract ever TYPES into either native
  // input (see this file's own doc comment), so the only way either side ever becomes non-empty
  // is a calendar-cell selection committing straight to `picker.value`, which never touches
  // either input's own `input` event. A local, typing-only signal would simply never update for
  // that path — confirmed live (`range-basic`'s own first click), the mirror span kept showing
  // the placeholder and `mat-form-field-hide-placeholder`/the floating label never updated.
  const startPlaceholder = props.startPlaceholder ?? '';
  const endPlaceholder = props.endPlaceholder ?? '';
  const rangeValue = picker.value.value;
  const startText = formatDateForDisplay(rangeValue.start);
  const endText = formatDateForDisplay(rangeValue.end);
  const startEmpty = startText.length === 0;
  const endEmpty = endText.length === 0;
  const startMirror = startEmpty ? startPlaceholder : startText;
  const endMirror = endEmpty ? endPlaceholder : endText;
  const empty = startEmpty && endEmpty;
  // Mirrors `_shouldHidePlaceholders()`.
  const hidePlaceholders = !startEmpty;
  // Mirrors `_shouldHideSeparator()`.
  const hideSeparator =
    (!formField || (!!formField.labelId && !formField.shouldLabelFloat)) && empty;

  const isOpen = picker.isOpen.value;
  const disabled = picker.disabled.value;
  const minDate = picker.min.value;
  const maxDate = picker.max.value;
  const minIso = minDate != null ? (adapter.toIso8601(minDate) as string) : undefined;
  const maxIso = maxDate != null ? (adapter.toIso8601(maxDate) as string) : undefined;

  // Stashed for `datepicker-runtime.ts`'s `openDateRangePickerPanel`/origin resolution — same
  // "plain field, read later from an event handler" safety argument as `MatDatepickerInput`'s own
  // `_formFieldOrigin` assignment.
  picker._formFieldOrigin = connectedOrigin;
  picker._formFieldLabelId = formField?.labelId;

  // Live resync of `formField.empty`/`.shouldLabelFloat` from `picker.value` — same "guarded
  // write during render" fix `MatDatepickerInput` needed, for the identical reason: a calendar
  // selection never focuses/blurs either native input, so the event-driven
  // `formField.empty`/`.shouldLabelFloat` writes alone would never fire for it. See that
  // component's own doc comment for the full write-up.
  if (formField && formField.empty !== empty) {
    formField.empty = empty;
    formField.shouldLabelFloat = formField.focused || !empty;
  }

  return (
    <mat-date-range-input
      id={id}
      role="group"
      // Mirrors the constructor's own imperative `classList.add('mat-mdc-input-element',
      // 'mat-mdc-form-field-input-control', 'mdc-text-field__input')` — confirmed live these 3
      // MDC classes land on THIS host element, not on the two inner `<input>`s (which carry
      // neither these nor `cdk-text-field-autofill-monitored` at all — just their own
      // `mat-start-date`/`mat-end-date` `mat-date-range-input-inner` pair).
      class={
        [
          'mat-date-range-input',
          formField && 'mat-mdc-input-element',
          formField && 'mat-mdc-form-field-input-control',
          formField && 'mdc-text-field__input',
          hidePlaceholders && 'mat-date-range-input-hide-placeholders',
          ...(props.class ? (Array.isArray(props.class) ? props.class : [props.class]) : []),
        ].filter(Boolean) as string[]
      }
      aria-labelledby={ariaLabelledby}
      aria-describedby={ariaDescribedBy}
      {...{'data-mat-calendar': picker.id}}
    >
      <RangeInputContainer>
        <div class="mat-date-range-input-wrapper">
          <input
            ref={picker._startInputRef}
            type="text"
            class={['mat-date-range-input-inner', 'mat-start-date']}
            placeholder={startPlaceholder || undefined}
            disabled={disabled || undefined}
            aria-haspopup="dialog"
            aria-owns={isOpen ? picker.id : undefined}
            {...{min: minIso, max: maxIso}}
          />
          <span class="mat-date-range-input-mirror" aria-hidden="true">
            {startMirror}
          </span>
        </div>

        <span
          class={
            [
              'mat-date-range-input-separator',
              hideSeparator && 'mat-date-range-input-separator-hidden',
            ].filter(Boolean) as string[]
          }
        >
          {separator}
        </span>

        <div class="mat-date-range-input-wrapper mat-date-range-input-end-wrapper">
          <input
            ref={picker._endInputRef}
            type="text"
            class={['mat-date-range-input-inner', 'mat-end-date']}
            placeholder={endPlaceholder || undefined}
            disabled={disabled || undefined}
            aria-haspopup="dialog"
            aria-owns={isOpen ? picker.id : undefined}
            {...{min: minIso, max: maxIso}}
          />
          <span class="mat-date-range-input-mirror" aria-hidden="true">
            {endMirror}
          </span>
        </div>
      </RangeInputContainer>
    </mat-date-range-input>
  );
});
