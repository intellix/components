import {test, expect, type Page} from '@playwright/test';

/**
 * Functional tests for the pluggable `DateAdapter` / `MAT_DATE_FORMATS` / `MAT_DATE_LOCALE` /
 * `dateClass` task (see `datepicker/SYNC.md`'s "DateAdapter / MAT_DATE_FORMATS /
 * MAT_DATE_LOCALE / dateClass" section). Unlike `angular-parity.spec.ts` (which only asserts
 * the two apps render IDENTICAL DOM), these assert the Qwik port actually BEHAVES correctly —
 * parsing/formatting through an app-supplied custom adapter, and a runtime locale switch. No
 * Angular page involved.
 *
 * Every test here opens the Qwik page via a plain `page.goto()` — a genuine fresh navigation,
 * so every interaction that follows is necessarily POST-RESUME (the page was server-rendered,
 * then resumed by the browser; nothing here runs in the same session the SSR pass itself ran
 * in). This is the real-browser proof the task asked for: a custom `DateAdapter` is a class
 * with methods, which per this project's own rule can't be put into serializable Qwik state —
 * `MAT_DATE_ADAPTER_FACTORY` instead carries a `QRL` factory, resolved fresh wherever a live
 * instance is needed (`core/datetime/use-date-adapter.ts`'s `resolveDateAdapter()`). If that
 * design were wrong, the FIRST interaction on a freshly-loaded page (exactly what every test
 * below does) would be the first place it would show — see the `custom-adapter` route's own doc
 * comment (`src/qwik-cdk-dev-app/src/routes/mat-datepicker/custom-adapter/index.tsx`) for the
 * `DotDateAdapter` fixture (a real `NativeDateAdapter` subclass, accepting/emitting `dd.mm.yyyy`)
 * these tests exercise.
 *
 * Same convention as `specs/formisch/functional.spec.ts` for a test that doesn't need the
 * Angular comparison at all.
 */

const QWIK_URL = process.env['QWIK_URL'] ?? 'http://localhost:4173';

async function openCustomAdapterPage(page: Page): Promise<void> {
  await page.goto(`${QWIK_URL}/mat-datepicker/custom-adapter/`);
  await page.waitForSelector('[data-scenario-ready]', {state: 'attached'});
}

async function openLocalePage(page: Page): Promise<void> {
  await page.goto(`${QWIK_URL}/examples/datepicker-locale/`);
  await page.waitForSelector('[data-scenario-ready]', {state: 'attached'});
}

/** Opens the calendar belonging to the `nth` `mat-form-field` in `[data-parity-root]` (0 = the
 *  single-date field, 1 = the range field, 2 = the timepicker, on the `custom-adapter` route)
 *  and waits past its enter animation — same wait pattern
 *  `specs/examples/angular-parity.spec.ts`'s own `openDatepicker` step uses. */
async function openCalendar(page: Page, formFieldIndex: number): Promise<void> {
  await page
    .locator('[data-parity-root] mat-form-field')
    .nth(formFieldIndex)
    .locator('mat-datepicker-toggle button, mat-timepicker-toggle button')
    .click();
  await page.waitForSelector('.mat-datepicker-content, .mat-timepicker-panel', {
    state: 'attached',
    timeout: 5000,
  });
  await page
    .waitForFunction(
      () => !document.querySelector('.mat-datepicker-content.mat-datepicker-content-animating'),
      undefined,
      {timeout: 2000},
    )
    .catch(() => {});
}

test.describe('pluggable DateAdapter — functional', () => {
  test('typing dd.mm.yyyy parses correctly and reformats on blur, after resume', async ({
    page,
  }) => {
    await openCustomAdapterPage(page);
    const dateInput = page.locator('#dot-date-input');

    // 05.12.2024 is ambiguous between mm.dd and dd.mm — only a correctly dd.mm.yyyy-parsing
    // adapter reads this as 5 December (not 12 May). Typed WITHOUT leading zeros to also prove
    // `format()` on blur re-renders the adapter's own zero-padded `dd.mm.yyyy`, not an echo of
    // the typed text.
    await dateInput.fill('5.12.2024');
    await dateInput.blur();
    await expect(dateInput).toHaveValue('05.12.2024');

    // Opening the calendar now must land on December 2024 — proves the VALUE (not just the
    // displayed text) was parsed as day=5, month=December.
    await openCalendar(page, 0);
    await expect(page.locator('.mat-calendar-period-button')).toContainText(/DEC 2024/i);
    // The 5th is the active (selected) cell.
    await expect(page.locator('.mat-calendar-body-selected')).toHaveText('5');
  });

  test('an unparseable value is left as-is (not coerced into some other date) on blur', async ({
    page,
  }) => {
    await openCustomAdapterPage(page);
    const dateInput = page.locator('#dot-date-input');
    await dateInput.fill('not a date');
    await dateInput.blur();
    // `handleDatepickerBlur` only reformats a VALID value — unparseable text is left exactly as
    // typed (mirrors upstream: `_formatValue()` is only called when there's something to
    // format). This fixture has no bound form control (bare `[matDatepicker]`, matching every
    // other scenario's own "no ng-* classes/no aria-invalid without a bound control"
    // convention — see `datepicker/SYNC.md`), so `aria-invalid` isn't the right observable here;
    // the committed VALUE is: opening the calendar afterward must show "today" (nothing
    // selected), proving the invalid text was never coerced into a parsed date.
    await expect(dateInput).toHaveValue('not a date');

    await openCalendar(page, 0);
    expect(await page.locator('.mat-calendar-body-selected').count()).toBe(0);
  });

  test('custom adapter works inside MatDateRangeInput (calendar-click selection)', async ({
    page,
  }) => {
    await openCustomAdapterPage(page);
    await openCalendar(page, 1);

    // Click two day cells to complete a range — any two enabled cells in the open month view.
    const cells = page.locator('.mat-calendar-body-cell:not(.mat-calendar-body-disabled)');
    await cells.nth(2).click();
    await cells.nth(5).click();

    const startMirror = page.locator('[data-parity-root] mat-form-field').nth(1).locator('.mat-date-range-input-mirror').first();
    const endMirror = page.locator('[data-parity-root] mat-form-field').nth(1).locator('.mat-date-range-input-mirror').last();
    // Both mirrors show the dot-formatted text (dd.mm.yyyy), not the native en-US default —
    // proves the SAME `MAT_DATE_ADAPTER_FACTORY`/`MAT_DATE_FORMATS` reaches `MatDateRangeInput`.
    await expect(startMirror).toHaveText(/^\d{2}\.\d{2}\.\d{4}$/);
    await expect(endMirror).toHaveText(/^\d{2}\.\d{2}\.\d{4}$/);
  });

  test('custom adapter works inside MatTimepicker (typed input still parses/formats times)', async ({
    page,
  }) => {
    await openCustomAdapterPage(page);
    const timeInput = page.locator('#dot-time-input');
    // DotDateAdapter never overrides time parsing/formatting — only `parse()`/`format()` for
    // dates — so a plugged-in custom adapter must still leave ordinary time entry working
    // (inherited from NativeDateAdapter), proving the SAME adapter class the date fields use
    // doesn't break the timepicker it's ALSO wired into.
    await timeInput.fill('2:30 PM');
    await timeInput.blur();
    await expect(timeInput).toHaveValue(/2:30\s*PM/i);
    await expect(page.locator('[data-parity-root] mat-form-field').nth(2)).not.toHaveClass(
      /mat-form-field-invalid/,
    );
  });

  test('locale switch updates calendar labels', async ({page}) => {
    await openLocalePage(page);

    // Open the calendar under the initial ja-JP locale and capture the period button's month
    // label.
    await page.locator('mat-datepicker-toggle button').click();
    await page.waitForSelector('.mat-datepicker-content', {state: 'attached', timeout: 5000});
    const periodButton = page.locator('.mat-calendar-period-button');
    const beforeText = (await periodButton.textContent())?.trim() ?? '';
    expect(beforeText.length).toBeGreaterThan(0);

    // Clicking the "switch to French" button is itself an OUTSIDE click relative to the open
    // calendar's connected origin — same as any other outside click, the calendar's own
    // transparent backdrop (`.cdk-overlay-backdrop`, covering the full viewport, there
    // specifically to dismiss on an outside click — matching upstream's own
    // outsidePointerEvents()-driven dismissal) sits on top of it. A normal Playwright `.click()`
    // (real mouse event at the button's screen coordinate) hits the BACKDROP first and never
    // reaches the button at all (confirmed live — the calendar closes, but the locale never
    // changes); `{force: true}` only skips Playwright's own pre-click actionability checks, it
    // does NOT change this (still a coordinate-based synthetic mouse event, same miss).
    // `.dispatchEvent('click')` instead dispatches a real DOM `click` straight at the button
    // element (no coordinate hit-testing) — it still bubbles to `document`, so the SAME
    // outside-click dispatcher sees it and closes the calendar too (expected, not a bug), but
    // the button's own `onClick$` ALSO genuinely fires this way.
    // `useDateLocale()`'s signal write then happens: re-opening the calendar afterward must
    // show the NEW locale's labels — a LIVE `useDateLocale()` signal write (not a fresh page
    // load) is what drives this (see `datepicker/SYNC.md`).
    await page.getByRole('button', {name: 'Dynamically switch to French'}).dispatchEvent('click');
    await page.waitForSelector('.mat-datepicker-content', {state: 'detached', timeout: 5000});

    await page.locator('mat-datepicker-toggle button').click();
    await page.waitForSelector('.mat-datepicker-content', {state: 'attached', timeout: 5000});
    const afterText = (await periodButton.textContent())?.trim() ?? '';
    expect(afterText).not.toBe(beforeText);
    // Deterministically FR vs ja-JP: `Intl`'s French month abbreviation ends with a period
    // (e.g. "nov. 2026"), unlike ja-JP's "2026年11月" or an unrelated English fallback.
    expect(afterText).toMatch(/^[a-zéû]+\.? 20\d\d$/i);

    // NOT asserted here: the example's own `<mat-hint>` text (`YYYY/MM/DD` -> `DD/MM/YYYY`)
    // does NOT update on this click — a documented, PRE-EXISTING `MatFormField` limitation
    // unrelated to the date-adapter work (`hintStart` is captured into a frozen
    // `useSignal(() => props.hintStart)` snapshot at mount — see `mat-form-field.tsx`'s own
    // `hintStartSnapshot` — so a later render computing a NEW `<MatHint>` JSX element for the
    // SAME slot is never substituted in). The CALENDAR popup above is NOT subject to this (it's
    // an imperatively-created overlay content component, not a JSX child threaded through any
    // of `MatFormField`'s frozen content props), which is why it correctly updates. See
    // `datepicker/SYNC.md` and `specs/examples-forms/angular-parity.spec.ts`'s own
    // `datepicker-locale` `EXPECTED_FAILURES` entry for the parity-level write-up of this exact
    // gap.
  });
});

test.describe('pluggable DateAdapter — pre-seeded value, initial paint', () => {
  // `custom-adapter`'s three examples are seeded with a non-null `value` (`PRESET_DATE`/
  // `PRESET_RANGE_START`/`PRESET_RANGE_END`/`PRESET_TIME` — see that route's own doc comment),
  // specifically so a wrong (hardcoded-`DEFAULT_DATE_ADAPTER`/`MAT_NATIVE_DATE_FORMATS`) first
  // paint is OBSERVABLY different from a correct (app-configured `DotDateAdapter`/
  // `DOT_DATE_FORMATS`) one: `DotDateAdapter` reads/writes dates as `dd.mm.yyyy` (never
  // `12/5/2024`, the default en-US `m/d/yyyy` a hardcoded adapter would produce for 5 December
  // 2024), and `DOT_DATE_FORMATS.display.timeInput` is deliberately 24-hour (`"14:30"`, never
  // `"2:30 PM"`, the default adapter's 12-hour format for the same instant).
  //
  // This matters for real apps rendering an EDIT form with a saved value: the datepicker input,
  // the date-range input, and the timepicker input must all format that pre-seeded value with
  // the APP-CONFIGURED adapter+formats on the very first paint — both in the raw SSR response
  // (nothing here waits for any client JS; a GET request never runs the browser at all) and
  // after the page is resumed in a real browser. See `datepicker/SYNC.md` and
  // `timepicker/SYNC.md` for the `useComputed$`-based fix this proves (mirrors
  // `qwik-material/icon`'s own `resolvedSvgIcon` pattern: the compute function returns a plain
  // string when there's nothing to format, and a real `Promise<string>` — resolved through
  // `resolveDateAdapter()` — only when a seed value needs the configured adapter's own
  // `format()`; reading a still-pending result throws the in-flight promise, which Qwik's
  // renderer catches and retries, so SSR blocks until resolved and the client re-suspends the
  // same way on its first read after a resume).
  test('SSR raw HTML has the custom-formatted initial values (date, range, time)', async ({
    request,
  }) => {
    // A literal HTTP GET — no browser, no JS execution of any kind. Whatever text is in THIS
    // response body is exactly what any crawler/curl/"view source" would see, and exactly what
    // the browser's HTML parser has to work with before Qwik's own loader script runs a single
    // line.
    const response = await request.get(`${QWIK_URL}/mat-datepicker/custom-adapter/`);
    expect(response.ok()).toBe(true);
    const html = await response.text();

    // The WRONG, hardcoded-default-adapter/-formats renderings must never appear anywhere in the
    // raw response — not even transiently (there's no "transiently" in a single GET response).
    expect(html).not.toContain('12/5/2024');
    expect(html).not.toContain('12/25/2024');
    expect(html).not.toMatch(/2:30\s*PM/i);

    // The CORRECT, `DotDateAdapter`/`DOT_DATE_FORMATS`-formatted renderings must already be
    // present. The range mirrors render as plain visible text content; the single-date and
    // timepicker inputs' `.value` DOM property is restored via Qwik's own serialized
    // backpatch state (a native `<input>`'s `value` is a DOM property, not an HTML attribute —
    // see `mat-input.tsx`'s doc comment — so it's carried in that state rather than as a
    // `value="..."` attribute on the tag itself), which is itself part of this same raw response
    // body, not something a browser computes afterward.
    expect(html).toContain('05.12.2024'); // dot-date input AND the range-start mirror
    expect(html).toContain('25.12.2024'); // range-end mirror
    expect(html).toContain('14:30'); // timepicker input, 24-hour format
  });

  test('pre-seeded values are still correctly formatted after resume', async ({page}) => {
    await openCustomAdapterPage(page);

    await expect(page.locator('#dot-date-input')).toHaveValue('05.12.2024');
    await expect(page.locator('#dot-time-input')).toHaveValue('14:30');

    const rangeField = page.locator('[data-parity-root] mat-form-field').nth(1);
    await expect(rangeField.locator('.mat-date-range-input-mirror').first()).toHaveText(
      '05.12.2024',
    );
    await expect(rangeField.locator('.mat-date-range-input-mirror').last()).toHaveText(
      '25.12.2024',
    );
  });
});
