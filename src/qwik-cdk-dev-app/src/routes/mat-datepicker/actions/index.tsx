import {$, component$, useSignal} from '@qwik.dev/core';
import {MatButton} from '@angular-community/qwik-material/button';
import {MatFormField, MatLabel} from '@angular-community/qwik-material/form-field';
import {
  applyDatepickerSelection,
  applyDateRangePickerSelection,
  cancelDatepickerSelection,
  cancelDateRangePickerSelection,
  formatDateForDisplay,
  MatDatepicker,
  MatDatepickerInput,
  MatDatepickerToggle,
  MatDateRangeInput,
  MatDateRangePicker,
  useMatDatepicker,
  useMatDateRangePicker,
  type DateRange,
  type MatDateRangePickerHandle,
  type MatDatepickerHandle,
} from '@angular-community/qwik-material/datepicker';

const JAN_1_2024 = new Date(2024, 0, 1);

// Mirrors src/dev-app/qwik-parity/datepicker.ts's DatepickerActions — upstream's own two-field
// datepicker-actions-example almost verbatim (single + range, each with Cancel/Apply). See that
// file's DATEPICKER ACTIONS note for the shared-template/pending-model mechanics, and
// mat-datepicker.tsx's own doc comment for why there's no separate MatDatepickerActions/
// MatDatepickerCancel/MatDatepickerApply component in this port — plain <MatButton> elements
// calling the exported apply/cancel functions directly.
export default component$(() => {
  const value = useSignal<Date | null>(null);
  const picker = useMatDatepicker<Date>({
    startAt: JAN_1_2024,
    onValueChange$: $((v: Date | null) => {
      value.value = v;
    }),
  }) as unknown as MatDatepickerHandle<unknown>;

  const range = useSignal<DateRange<Date>>({start: null, end: null});
  const rangePicker = useMatDateRangePicker<Date>({
    startAt: JAN_1_2024,
    onValueChange$: $((v: DateRange<Date>) => {
      range.value = v;
    }),
  }) as unknown as MatDateRangePickerHandle<unknown>;

  return (
    <>
      <div data-parity-root>
        <MatFormField
          style="width: 300px"
          label={<MatLabel>Choose a date</MatLabel>}
          control={
            <MatDatepickerInput
              picker={picker}
              value={formatDateForDisplay(value.value) || undefined}
            />
          }
          iconSuffix={<MatDatepickerToggle picker={picker} />}
          infixContent={
            <MatDatepicker
              picker={picker}
              actions={
                <>
                  <MatButton onClick$={$(() => cancelDatepickerSelection(picker))}>
                    Cancel
                  </MatButton>
                  <MatButton
                    appearance="elevated"
                    onClick$={$(() => applyDatepickerSelection(picker))}
                  >
                    Apply
                  </MatButton>
                </>
              }
            />
          }
        />
        <MatFormField
          style="width: 300px"
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
      </div>
      <main data-scenario-ready>ready</main>
    </>
  );
});
