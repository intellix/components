import {component$, useSignal, useStyles$} from '@qwik.dev/core';
import {MatFormField, MatLabel} from '@angular-community/qwik-material/form-field';
import {MatInput} from '@angular-community/qwik-material/input';
import {MatSelect} from '@angular-community/qwik-material/select';
import {MatCheckbox} from '@angular-community/qwik-material/checkbox';
import {MatRadioButton, MatRadioGroup} from '@angular-community/qwik-material/radio';
import {MatIcon} from '@angular-community/qwik-material/icon';
import styles from './form-field-label-example.css?inline';

/**
 * Port of material.angular.dev's `form-field-label` docs example
 * (src/components-examples/material/form-field/form-field-label/) — a checkbox + radio group
 * drive `hideRequiredMarker`/`floatLabel` live across 3 form fields (no label, label+placeholder,
 * rich-content label). Upstream's `[formGroup]="options"` has no validators (always valid, never
 * submitted), so `ng-valid` never changes — but `ng-untouched`/`ng-pristine` genuinely DO flip
 * once either control is interacted with (confirmed live via the "click checkbox"/"click radio"
 * parity interactions in `specs/examples-forms/`: clicking EITHER control marks that control
 * `ng-dirty`, and — since `NgControlStatusGroup` aggregates — the whole `<form
 * [formGroup]>` too). Reproduced here with a `dirty` signal PER control (never touched in this
 * demo — nothing blurs either control) and a form-level `ng-dirty` whenever either is.
 */
export default component$(() => {
  useStyles$(styles);
  const hideRequired = useSignal(false);
  const hideRequiredDirty = useSignal(false);
  const floatLabel = useSignal<'auto' | 'always'>('auto');
  const floatLabelDirty = useSignal(false);
  const formDirty = () => hideRequiredDirty.value || floatLabelDirty.value;

  return (
    <form-field-label-example>
      <div class="example-container">
        <form
          class={['ng-untouched', formDirty() ? 'ng-dirty' : 'ng-pristine', 'ng-valid']}
          noValidate
        >
          <MatCheckbox
            class={['ng-untouched', hideRequiredDirty.value ? 'ng-dirty' : 'ng-pristine', 'ng-valid']}
            checked={hideRequired.value}
            onChange$={e => {
              hideRequired.value = e.checked;
              hideRequiredDirty.value = true;
            }}
          >
            Hide required marker
          </MatCheckbox>
          <div>
            <label>Float label: </label>
            <MatRadioGroup
              class={['ng-untouched', floatLabelDirty.value ? 'ng-dirty' : 'ng-pristine', 'ng-valid']}
              value={floatLabel.value}
              onChange$={v => {
                floatLabel.value = v as 'auto' | 'always';
                floatLabelDirty.value = true;
              }}
            >
              <MatRadioButton value="auto">Auto</MatRadioButton>
              <MatRadioButton value="always">Always</MatRadioButton>
            </MatRadioGroup>
          </div>

          <div class="example-form-fields">
            <MatFormField
              hideRequiredMarker={hideRequired.value}
              floatLabel={floatLabel.value}
              control={<MatInput placeholder="Simple placeholder" required />}
            />

            <MatFormField
              floatLabel={floatLabel.value}
              label={<MatLabel>Both a label and a placeholder</MatLabel>}
              control={<MatInput placeholder="Simple placeholder" />}
            />

            <MatFormField
              hideRequiredMarker={hideRequired.value}
              floatLabel={floatLabel.value}
              label={
                <MatLabel>
                  <MatIcon>favorite</MatIcon>
                  <strong> Fancy</strong>
                  <em> label</em>
                </MatLabel>
              }
              control={
                <MatSelect
                  controlType="mat-select"
                  required
                  options={[
                    {value: undefined, label: '-- None --'},
                    {value: 'option', label: 'Option'},
                  ]}
                />
              }
            />
          </div>
        </form>
      </div>
    </form-field-label-example>
  );
});
