import {$, component$, useSignal} from '@builder.io/qwik';
import {MatError, MatFormField, MatLabel} from '@angular-community/qwik-material/form-field';
import {
  formatDateForDisplay,
  MatDatepicker,
  MatDatepickerInput,
  MatDatepickerToggle,
  useMatDatepicker,
} from '@angular-community/qwik-material/datepicker';

// Mirrors src/dev-app/qwik-parity/datepicker.ts's DatepickerTypedDateBlur — [formControl]
// (needed for the parse-error path, see that file's TYPED-DATE PARSING/BLUR note), a mat-error
// gated on the matDatepickerParse error. No popup interaction at all. touched/dirty/parseError
// come from `picker` itself (see use-mat-datepicker.ts's doc comment) — no separate
// useMatFormControl() needed, mirroring qwik-material/timepicker's own min-max scenario.
export default component$(() => {
  const value = useSignal<Date | null>(null);
  const picker = useMatDatepicker<Date>({
    onValueChange$: $((v: Date | null) => (value.value = v)),
  });

  // ── Frozen `errors` element — see qwik-material/timepicker's min-max route for why this
  // pattern (never hand MatFormField's `errors` prop a NEW element reference after mount) is
  // used defensively here too.
  const errorLabel = useSignal('');
  const nextErrorLabel = picker.parseError.value ? 'Please enter a valid date' : '';
  if (errorLabel.value !== nextErrorLabel) errorLabel.value = nextErrorLabel;
  const errorElement = useSignal(() => <MatError>{errorLabel}</MatError>);

  return (
    <>
      <div data-parity-root>
        <MatFormField
          style="width: 300px"
          label={<MatLabel>Choose a date</MatLabel>}
          touched={picker.touched.value}
          dirty={picker.dirty.value}
          invalid={picker.parseError.value}
          control={
            <MatDatepickerInput
              picker={picker}
              formBound
              value={formatDateForDisplay(value.value) || undefined}
            />
          }
          iconSuffix={<MatDatepickerToggle picker={picker} />}
          infixContent={<MatDatepicker picker={picker} />}
          errors={errorElement.value}
        />
      </div>
      <main data-scenario-ready>ready</main>
    </>
  );
});
