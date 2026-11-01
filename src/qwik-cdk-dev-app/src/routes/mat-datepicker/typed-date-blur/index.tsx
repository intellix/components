import {$, component$, useSignal} from '@qwik.dev/core';
import {MatError, MatFormField, MatLabel} from '@angular-community/qwik-material/form-field';
import {
  formatDateForDisplay,
  MatDatepicker,
  MatDatepickerInput,
  MatDatepickerToggle,
  useMatDatepicker,
  type MatDatepickerHandle,
} from '@angular-community/qwik-material/datepicker';

// Mirrors src/dev-app/qwik-parity/datepicker.ts's DatepickerTypedDateBlur — [formControl]
// (needed for the parse-error path, see that file's TYPED-DATE PARSING/BLUR note), a mat-error
// gated on the matDatepickerParse error. No popup interaction at all. touched/dirty/parseError
// come from `picker` itself (see use-mat-datepicker.ts's doc comment) — no separate
// useMatFormControl() needed, mirroring qwik-material/timepicker's own min-max scenario.
//
// `errors` is a plain conditional `<MatError>` reconstructed fresh every render (mirrors
// `mat-form-field/error-state`'s own established convention) — NOT frozen into a
// `useSignal(() => <MatError>{errorLabel}</MatError>)`. An earlier revision of this route froze
// it defensively, mirroring timepicker's `min-max` workaround for a DIFFERENT prop; timepicker's
// own SYNC.md later found that specific freeze unnecessary (removed) and the real fix belonged
// inside `MatFormField` itself (all of `label`/`iconSuffix`/.../`infixContent` now freeze
// internally; `errors` never needed it — it goes through `MatFormField`'s normal, safe
// top-level diff). Confirmed live under Qwik v2: the frozen element here, specifically, is what
// broke — `mat-error` rendered but stayed permanently EMPTY (not merely stale) the first time
// its `<Slot/>`-projected `{errorLabel}` signal content needed to update after the element's own
// first render pass, consistent with the same "a JSXNode object isn't safe to reuse across
// multiple render passes under v2" issue `datepicker-runtime.ts`'s `cloneJsxForReuse` call sites
// work around for a DIFFERENT prop (`MatDatepicker`'s `actions`). Removing the freeze (so a
// fresh node is built every render, same as every OTHER scenario's `errors` prop) fixes it
// directly, with no clone needed, since nothing here holds onto one specific node across
// multiple opens/renders the way `actions` does.
export default component$(() => {
  const value = useSignal<Date | null>(null);
  const picker = useMatDatepicker<Date>({
    onValueChange$: $((v: Date | null) => {
      value.value = v;
    }),
  }) as unknown as MatDatepickerHandle<unknown>;

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
          errors={picker.parseError.value ? <MatError>Please enter a valid date</MatError> : undefined}
        />
      </div>
      <main data-scenario-ready>ready</main>
    </>
  );
});
