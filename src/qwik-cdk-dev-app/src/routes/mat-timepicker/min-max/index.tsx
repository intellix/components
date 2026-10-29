import {$, component$, useSignal} from '@builder.io/qwik';
import {MatError, MatFormField, MatLabel} from '@angular-community/qwik-material/form-field';
import {
  formatTimeForDisplay,
  MatTimepickerInput,
  MatTimepickerToggle,
  useMatTimepicker,
} from '@angular-community/qwik-material/timepicker';

function time(hours: number, minutes: number): Date {
  return new Date(2024, 0, 15, hours, minutes, 0);
}

// Mirrors src/dev-app/qwik-parity/timepicker.ts's TimepickerMinMax — a bare FormControl (no
// Validators), matTimepickerMin/Max bound to 9:00 AM/5:00 PM, three conditional <mat-error>s for
// matTimepickerParse/Min/Max. touched/dirty come from `picker` itself (see
// use-mat-timepicker.ts's doc comment): the implicit control upstream's bare `FormControl`
// creates has the SAME touched/dirty semantics as every other scenario's `[(ngModel)]` — no
// separate `useMatFormControl()` needed.
export default component$(() => {
  const value = useSignal<Date | null>(null);
  const picker = useMatTimepicker<Date>({
    value: value.value,
    min: time(9, 0),
    max: time(17, 0),
    onValueChange$: $((v: Date | null) => (value.value = v)),
  });
  const invalid = picker.parseError.value || picker.minError.value || picker.maxError.value;

  // ── Frozen `errors` element — read this before touching this scenario ──
  // A naive `errors={invalid ? <MatError>{label}</MatError> : undefined}` hits a genuine,
  // confirmed-live Qwik 1.20 core crash ("Rendering promises in JSX signals is not supported")
  // the FIRST time `invalid` flips true, corrupting the whole page (every later Playwright
  // locator call on it hangs) — the exact same "replacing a `_fnSignal`-bound prop's element
  // reference with a brand-new one" bug class `mat-form-field.tsx`'s own `controlSnapshot` doc
  // comment documents for `control`, just hit via `errors` instead. Switching the prop from an
  // array to a ternary (an earlier attempt) did NOT fix it — the trigger is the undefined→real
  // transition itself, not the shape. The fix mirrors `controlSnapshot`'s own: never hand
  // `MatFormField`'s `errors` prop a NEW element reference after mount. `errorLabel` is a plain
  // signal; passing it (not `.value`) as `<MatError>`'s child lets Qwik update the TEXT node
  // live, in place, on the one frozen `<MatError>` instance — no second element reference ever
  // reaches `errors`. `hasErrors` is therefore always `true`, but `MatFormField`'s own
  // `showErrors = hasErrors && errorState` still gates whether the error wrapper actually
  // renders at all (errorState needs `touched && invalid` too) — see that file's render body.
  const errorLabel = useSignal('');
  const nextErrorLabel = picker.parseError.value
    ? "Value isn't a valid time"
    : picker.minError.value
      ? 'Value is too early'
      : picker.maxError.value
        ? 'Value is too late'
        : '';
  if (errorLabel.value !== nextErrorLabel) errorLabel.value = nextErrorLabel;
  const errorElement = useSignal(() => <MatError>{errorLabel}</MatError>);

  return (
    <>
      <div data-parity-root>
        <MatFormField
          style="width: 300px"
          label={<MatLabel>Pick a time</MatLabel>}
          touched={picker.touched.value}
          dirty={picker.dirty.value}
          invalid={invalid}
          control={
            <MatTimepickerInput
              picker={picker}
              formBound
              value={formatTimeForDisplay(value.value) || undefined}
            />
          }
          iconSuffix={<MatTimepickerToggle picker={picker} />}
          errors={errorElement.value}
        />
      </div>
      <main data-scenario-ready>ready</main>
    </>
  );
});
