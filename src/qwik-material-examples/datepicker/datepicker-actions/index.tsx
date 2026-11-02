import {$, component$, useSignal, useStyles$} from '@qwik.dev/core';
import {MatButton} from '@angular-community/qwik-material/button';
import {MatFormField, MatHint, MatLabel} from '@angular-community/qwik-material/form-field';
import {
  MatDateRangeInput,
  MatDateRangePicker,
  MatDatepicker,
  MatDatepickerInput,
  MatDatepickerToggle,
  applyDateRangePickerSelection,
  applyDatepickerSelection,
  cancelDateRangePickerSelection,
  cancelDatepickerSelection,
  formatDateForDisplay,
  useMatDatepicker,
  useMatDateRangePicker,
  type DateRange,
  type MatDatepickerHandle,
  type MatDateRangePickerHandle,
} from '@angular-community/qwik-material/datepicker';
import styles from './datepicker-actions-example.css?inline';

/**
 * Port of material.angular.dev's `datepicker-actions` docs example
 * (src/components-examples/material/datepicker/datepicker-actions/) — near-verbatim port of this
 * port's own `mat-datepicker/actions` mirror scenario (see that route's doc comment for why
 * there's no separate `MatDatepickerActions`/`MatDatepickerCancel`/`MatDatepickerApply`
 * component here — plain `<MatButton>`s calling the exported apply/cancel functions directly).
 */
export default component$(() => {
  useStyles$(styles);

  const value = useSignal<Date | null>(null);
  const picker = useMatDatepicker<Date>({
    onValueChange$: $((v: Date | null) => {
      value.value = v;
    }),
  }) as unknown as MatDatepickerHandle<unknown>;

  const range = useSignal<DateRange<Date>>({start: null, end: null});
  const rangePicker = useMatDateRangePicker<Date>({
    onValueChange$: $((v: DateRange<Date>) => {
      range.value = v;
    }),
  }) as unknown as MatDateRangePickerHandle<unknown>;

  return (
    <datepicker-actions-example>
      <MatFormField
        class="example-form-field"
        label={<MatLabel>Choose a date</MatLabel>}
        control={
          <MatDatepickerInput picker={picker} value={formatDateForDisplay(value.value) || undefined} />
        }
        hintStart={<MatHint>MM/DD/YYYY</MatHint>}
        iconSuffix={<MatDatepickerToggle picker={picker} />}
        infixContent={
          <MatDatepicker
            picker={picker}
            actions={
              <>
                <MatButton onClick$={$(() => cancelDatepickerSelection(picker))}>Cancel</MatButton>
                <MatButton appearance="elevated" onClick$={$(() => applyDatepickerSelection(picker))}>
                  Apply
                </MatButton>
              </>
            }
          />
        }
      />

      <MatFormField
        class="example-form-field"
        label={<MatLabel>Enter a date range</MatLabel>}
        control={
          <MatDateRangeInput
            picker={rangePicker}
            startPlaceholder="Start date"
            endPlaceholder="End date"
            controlType="mat-date-range-input"
            disableAutomaticLabeling
          />
        }
        hintStart={<MatHint>MM/DD/YYYY – MM/DD/YYYY</MatHint>}
        iconSuffix={<MatDatepickerToggle picker={rangePicker} />}
        infixContent={
          <MatDateRangePicker
            picker={rangePicker}
            actions={
              <>
                <MatButton onClick$={$(() => cancelDateRangePickerSelection(rangePicker))}>
                  Cancel
                </MatButton>
                <MatButton
                  appearance="elevated"
                  onClick$={$(() => applyDateRangePickerSelection(rangePicker))}
                >
                  Apply
                </MatButton>
              </>
            }
          />
        }
      />
    </datepicker-actions-example>
  );
});
