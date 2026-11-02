import {$, component$, useSignal} from '@qwik.dev/core';
import {MatFormField, MatHint, MatLabel} from '@angular-community/qwik-material/form-field';
import {
  MatDatepicker,
  MatDatepickerInput,
  MatDatepickerToggle,
  formatDateForDisplay,
  useMatDatepicker,
  type MatDatepickerHandle,
} from '@angular-community/qwik-material/datepicker';

/**
 * Port of material.angular.dev's `datepicker-disabled` docs example
 * (src/components-examples/material/datepicker/datepicker-disabled/) — 3 independent disabled
 * combinations: the whole picker, just the toggle, and just the input. The 2nd/3rd cards need
 * `<MatDatepickerInput>`/`<MatDatepickerToggle>`'s own `disabled` prop to override the shared
 * `picker.disabled` independently — see those components' own doc comments
 * (`datepicker/SYNC.md`'s "independent per-element disabled" entry) for the small, additive fix
 * this example needed (upstream's `<input matInput disabled>`/`<mat-datepicker-toggle disabled>`
 * already override independently of each other and of `<mat-datepicker>`'s own state; this
 * port's hook-driven `disabled` had no per-element override at all before).
 *
 * Each card below is wrapped in a `<div>`, not upstream's literal `<p>`: `MatFormField`'s own
 * first rendered child is a `<div class="mat-mdc-text-field-wrapper">`, and per the HTML5
 * parsing algorithm a `<div>` start tag always closes any open `<p>` in scope, however deeply
 * nested through an intervening custom element — the same `<p>`/`<div>` HTML5-parsing conflict
 * as `select-disabled` and `form-field-appearance` (see their doc comments). On the real docs
 * site, a real browser parses this page's SSR'd HTML and that auto-close desyncs Qwik's
 * resumability data for the WHOLE page (confirmed via the docs site's smoke test crashing with
 * `Code(Q27)`, vnode materialize, with `<p>` in place) — `<div>` avoids it, at the cost of this
 * wrapper's tag no longer matching upstream (already an accepted gap — see
 * `specs/examples-forms/angular-parity.spec.ts`'s `EXPECTED_FAILURES['datepicker-disabled']`).
 */
export default component$(() => {
  const value1 = useSignal<Date | null>(null);
  const picker1 = useMatDatepicker<Date>({
    disabled: true,
    onValueChange$: $((v: Date | null) => {
      value1.value = v;
    }),
  }) as unknown as MatDatepickerHandle<unknown>;

  const value2 = useSignal<Date | null>(null);
  const picker2 = useMatDatepicker<Date>({
    onValueChange$: $((v: Date | null) => {
      value2.value = v;
    }),
  }) as unknown as MatDatepickerHandle<unknown>;

  const value3 = useSignal<Date | null>(null);
  const picker3 = useMatDatepicker<Date>({
    onValueChange$: $((v: Date | null) => {
      value3.value = v;
    }),
  }) as unknown as MatDatepickerHandle<unknown>;

  return (
    <datepicker-disabled-example>
      <div>
        <MatFormField
          label={<MatLabel>Completely disabled</MatLabel>}
          control={
            <MatDatepickerInput
              picker={picker1}
              value={formatDateForDisplay(value1.value) || undefined}
            />
          }
          hintStart={<MatHint>MM/DD/YYYY</MatHint>}
          iconSuffix={<MatDatepickerToggle picker={picker1} />}
          infixContent={<MatDatepicker picker={picker1} />}
        />
      </div>

      <div>
        <MatFormField
          label={<MatLabel>Popup disabled</MatLabel>}
          control={
            <MatDatepickerInput
              picker={picker2}
              value={formatDateForDisplay(value2.value) || undefined}
            />
          }
          hintStart={<MatHint>MM/DD/YYYY</MatHint>}
          iconSuffix={<MatDatepickerToggle picker={picker2} disabled />}
          infixContent={<MatDatepicker picker={picker2} />}
        />
      </div>

      <div>
        <MatFormField
          label={<MatLabel>Input disabled</MatLabel>}
          control={
            <MatDatepickerInput
              picker={picker3}
              disabled
              value={formatDateForDisplay(value3.value) || undefined}
            />
          }
          hintStart={<MatHint>MM/DD/YYYY</MatHint>}
          iconSuffix={<MatDatepickerToggle picker={picker3} />}
          infixContent={<MatDatepicker picker={picker3} />}
        />
      </div>
    </datepicker-disabled-example>
  );
});
