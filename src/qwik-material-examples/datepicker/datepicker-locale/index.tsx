import {$, component$, useSignal} from '@qwik.dev/core';
import {MatFormField, MatHint, MatLabel} from '@angular-community/qwik-material/form-field';
import {MatButton} from '@angular-community/qwik-material/button';
import {useDateLocale, useMatDateAdapterProvider} from '@angular-community/qwik-material/core';
import {
  MatDatepicker,
  MatDatepickerInput,
  MatDatepickerToggle,
  formatDateForDisplay,
  useMatDatepicker,
  type MatDatepickerHandle,
} from '@angular-community/qwik-material/datepicker';
import './datepicker-locale-example.css';

/**
 * Port of material.angular.dev's `datepicker-locale` docs example
 * (src/components-examples/material/datepicker/datepicker-locale/) — upstream provides
 * `provideLuxonDateAdapter()` + `{provide: MAT_DATE_LOCALE, useValue: 'ja-JP'}` at the
 * COMPONENT level, then switches to `'fr'` on a button click via `DateAdapter.setLocale()`
 * (upstream also updates `MatDatepickerIntl`'s close-button label — not ported; this port's
 * `datepicker-intl.ts` has no live-override mechanism, a pre-existing, documented deviation —
 * see `datepicker/SYNC.md`).
 *
 * This port's `NativeDateAdapter` supports any `Intl`-known locale directly (no Moment/Luxon
 * dependency needed), and `MAT_DATE_LOCALE` is a Qwik context carrying a reactive
 * `Signal<string>` (`useDateLocale()`) instead of upstream's one-shot DI token — see
 * `datepicker/SYNC.md`'s "DateAdapter / MAT_DATE_FORMATS / MAT_DATE_LOCALE / dateClass" section.
 * `useMatDateAdapterProvider({locale: 'ja-JP'})` seeds it (app-wide if called near an app's own
 * root; scoped to this example here); the inner component reads the SAME signal via
 * `useDateLocale()` and writes to it directly on the button click — the Qwik-native equivalent
 * of calling `DateAdapter.setLocale()`.
 */
const DatepickerLocaleExample = component$(() => {
  const locale = useDateLocale();
  const value = useSignal<Date | null>(null);
  const picker = useMatDatepicker<Date>({
    onValueChange$: $((v: Date | null) => {
      value.value = v;
    }),
  }) as unknown as MatDatepickerHandle<unknown>;

  const dateFormatString =
    locale.value === 'ja-JP' ? 'YYYY/MM/DD' : locale.value === 'fr' ? 'DD/MM/YYYY' : '';

  return (
    <datepicker-locale-example>
      <MatFormField
        label={<MatLabel>Different locale</MatLabel>}
        control={
          <MatDatepickerInput
            picker={picker}
            value={formatDateForDisplay(value.value) || undefined}
          />
        }
        hintStart={<MatHint>{dateFormatString}</MatHint>}
        iconSuffix={<MatDatepickerToggle picker={picker} />}
        infixContent={<MatDatepicker picker={picker} />}
      />
      <MatButton
        onClick$={$(() => {
          locale.value = 'fr';
        })}
      >
        Dynamically switch to French
      </MatButton>
    </datepicker-locale-example>
  );
});

export default component$(() => {
  useMatDateAdapterProvider({locale: 'ja-JP'});
  return <DatepickerLocaleExample />;
});
