import {test, expect, type Page} from '@playwright/test';

/**
 * Functional tests for the Formisch (`@formisch/qwik`) + qwik-material "account" example
 * (`src/qwik-cdk-dev-app/src/routes/formisch/account/index.tsx`). Unlike
 * `angular-parity.spec.ts` (which only asserts the two apps render IDENTICAL DOM), these assert
 * the Qwik+Formisch page actually BEHAVES correctly on its own — typing, validation, submit,
 * reset, and the `setInput`/`focus` imperative APIs. No Angular page involved.
 *
 * Opens the Qwik page directly (not through `expectMaterialParity`) — same convention as
 * `specs/material-button/ripple-mid-flight.spec.ts` for a test that doesn't need the Angular
 * comparison at all.
 */

const QWIK_URL = process.env['QWIK_URL'] ?? 'http://localhost:4173';

async function openAccountPage(page: Page): Promise<void> {
  await page.goto(`${QWIK_URL}/formisch/account/`);
  await page.waitForSelector('[data-scenario-ready]', {state: 'attached'});
}

/** The three plain text/textarea fields, in DOM order: 0 = name, 1 = email, 2 = bio. */
function textField(page: Page, index: number) {
  return page
    .locator(
      '[data-parity-root] input.mat-mdc-input-element, [data-parity-root] textarea.mat-mdc-input-element',
    )
    .nth(index);
}

async function formState(page: Page): Promise<{
  input: Record<string, unknown>;
  errors: Record<string, unknown>;
  form: Record<string, unknown>;
}> {
  const text = await page.locator('.formisch-demo__json').first().textContent();
  return JSON.parse(text ?? '{}');
}

test.describe('Formisch account form — functional', () => {
  test('typing updates Formisch input (live JSON panel)', async ({page}) => {
    await openAccountPage(page);
    await textField(page, 0).fill('Ada Lovelace');
    await expect.poll(async () => (await formState(page)).input['name']).toBe('Ada Lovelace');
  });

  test('blur shows the right errors with Material error-state classes', async ({page}) => {
    await openAccountPage(page);
    const email = textField(page, 1);
    await email.fill('not-an-email');
    await email.blur();

    // The error text itself.
    await expect(page.locator('mat-error', {hasText: 'Enter a valid email'})).toBeVisible();

    // The form-field invalid class.
    const emailFormField = page.locator('[data-parity-root] mat-form-field').nth(1);
    await expect(emailFormField).toHaveClass(/mat-form-field-invalid/);

    // aria-invalid on the native input (non-empty + invalid + touched -> "true").
    await expect(email).toHaveAttribute('aria-invalid', 'true');

    // The error text lives inside the dedicated Material error wrapper, not a plain hint.
    await expect(
      page.locator('[data-parity-root] .mat-mdc-form-field-error-wrapper mat-error'),
    ).toContainText('Enter a valid email');
  });

  test('invalid submit shows all errors and focuses the first invalid field', async ({page}) => {
    await openAccountPage(page);
    // Click into (and back out of) the name field before submitting — NOT just a settle wait.
    // Confirmed live: on a COMPLETELY untouched page, Formisch's `field.props.ref` (which
    // registers a field's native element so `focus()`/`handleSubmit`'s own `shouldFocus` can
    // find it later) had not fired for ANY field yet, no matter how long the test waited first
    // (tried up to 3s) — submitting then left focus on the SUBMIT BUTTON itself, not name. A
    // single click (focus+blur, no typing) was enough to make it work every time afterward. This
    // is Qwik's resumability showing through Formisch's ref-based design: a ref callback doesn't
    // necessarily run just because its element exists in the SSR'd DOM — only once that
    // component has actually resumed on the client, which normally happens by the time a user
    // would plausibly click Submit anyway (they've been looking at and likely interacting with
    // the page), so this quirk is isolated to automated tests driving a totally fresh page
    // straight to a submit click. See `formisch-bindings.ts`'s own note on this.
    const name = page.locator('[data-parity-root] input.mat-mdc-input-element').first();
    await name.click();
    await name.blur();
    // The ref QRL resolves asynchronously — give it a moment to actually register the element
    // before submitting (confirmed needed: without this, the same flakiness as a totally
    // untouched page recurred intermittently).
    await page.waitForTimeout(300);
    await page.locator('[data-parity-root] button[type="submit"]').click();

    // `handleSubmit` validates asynchronously (`await validateFormInput(...)`) before writing
    // any errors — and different fields' errors were observed to sometimes land a frame or two
    // apart (confirmed flaky otherwise) — so poll for the full expected set rather than reading
    // once right after the submit click resolves.
    await expect
      .poll(() => page.locator('[data-parity-root] mat-error').allTextContents())
      .toEqual(
        expect.arrayContaining([
          'Name is required',
          'Email is required',
          'Country is required',
          'Birthday is required',
        ]),
      );

    const errorTexts = await page.locator('[data-parity-root] mat-error').allTextContents();
    // The two controls with no built-in Material error component (radio/checkbox) show this
    // page's own plain error div instead.
    const customErrors = await page.locator('.formisch-demo__error').allTextContents();
    expect(customErrors).toEqual(
      expect.arrayContaining(['Choose a contact preference', 'You must accept the terms']),
    );

    // Focus landed on the first invalid field (name) — Formisch's own `<Form>` does this
    // automatically on every submit (`validateFormInput(..., {shouldFocus: true})`), ASYNC
    // (an `await`ed call), so give it a moment rather than reading `activeElement` immediately.
    const nameId = await textField(page, 0).getAttribute('id');
    await expect.poll(() => page.evaluate(() => document.activeElement?.id)).toBe(nameId);

    // The form itself picked up ng-submitted.
    await expect(page.locator('[data-parity-root] form')).toHaveClass(/ng-submitted/);
  });

  test('valid submit produces the expected output', async ({page}) => {
    await openAccountPage(page);
    await textField(page, 0).fill('Jordan Rivera');
    await textField(page, 1).fill('jordan.rivera@example.com');
    await textField(page, 2).fill('Product designer who loves accessible forms.');

    await page.locator('[data-parity-root] .mat-mdc-select-trigger').click();
    await page.getByRole('option', {name: 'Canada', exact: true}).click();

    await page.locator('[data-parity-root]').getByRole('radio', {name: 'Email'}).click();
    await page.locator('[data-parity-root] button.mdc-switch').click();
    await page.locator('[data-parity-root] input.mdc-checkbox__native-control').click();

    const date = page.locator('[data-parity-root] input.mat-datepicker-input');
    await date.fill('7/14/1992');
    await date.blur();

    await page.locator('[data-parity-root] button[type="submit"]').click();

    const output = page.locator('.formisch-demo__json').nth(1);
    await expect(output).toContainText('"name": "Jordan Rivera"');
    await expect(output).toContainText('"email": "jordan.rivera@example.com"');
    await expect(output).toContainText('"country": "ca"');
    await expect(output).toContainText('"contactPreference": "email"');
    await expect(output).toContainText('"newsletter": true');
    await expect(output).toContainText('"terms": true');
    await expect(output).toContainText('"birthday": "1992-07-14"');

    // No errors left anywhere once the submit actually succeeded.
    expect(await page.locator('[data-parity-root] mat-error').count()).toBe(0);
    expect(await page.locator('.formisch-demo__error').count()).toBe(0);
  });

  test('"Fill example data" (setInput) updates every visible control', async ({page}) => {
    await openAccountPage(page);
    await page.click('text=Fill example data');

    await expect(textField(page, 0)).toHaveValue('Jordan Rivera');
    await expect(textField(page, 1)).toHaveValue('jordan.rivera@example.com');
    await expect(textField(page, 2)).toHaveValue('Product designer who loves accessible forms.');
    await expect(page.locator('[data-parity-root] .mat-mdc-select-value-text')).toHaveText(
      'Canada',
    );
    await expect(
      page.locator('[data-parity-root]').getByRole('radio', {name: 'Email'}),
    ).toBeChecked();
    await expect(page.locator('[data-parity-root] button.mdc-switch')).toHaveAttribute(
      'aria-checked',
      'true',
    );
    await expect(
      page.locator('[data-parity-root] input.mdc-checkbox__native-control'),
    ).toBeChecked();
    await expect(page.locator('[data-parity-root] input.mat-datepicker-input')).toHaveValue(
      '7/14/1992',
    );

    const state = await formState(page);
    expect(state.input).toMatchObject({
      name: 'Jordan Rivera',
      email: 'jordan.rivera@example.com',
      country: 'ca',
      contactPreference: 'email',
      newsletter: true,
      terms: true,
      birthday: '1992-07-14',
    });
  });

  test('Reset clears both Formisch state AND every visible control', async ({page}) => {
    await openAccountPage(page);
    await page.click('text=Fill example data');
    await expect(textField(page, 0)).toHaveValue('Jordan Rivera');

    await page.click('text=Reset');

    await expect(textField(page, 0)).toHaveValue('');
    await expect(textField(page, 1)).toHaveValue('');
    await expect(textField(page, 2)).toHaveValue('');
    await expect(page.locator('[data-parity-root] .mat-mdc-select-value-text')).toHaveCount(0);
    expect(await page.locator('[data-parity-root] input[type="radio"]:checked').count()).toBe(0);
    await expect(page.locator('[data-parity-root] button.mdc-switch')).toHaveAttribute(
      'aria-checked',
      'false',
    );
    await expect(
      page.locator('[data-parity-root] input.mdc-checkbox__native-control'),
    ).not.toBeChecked();
    await expect(page.locator('[data-parity-root] input.mat-datepicker-input')).toHaveValue('');

    const state = await formState(page);
    expect(state.input).toMatchObject({
      name: '',
      email: '',
      bio: '',
      country: '',
      contactPreference: '',
      newsletter: false,
      terms: false,
      birthday: '',
    });
    expect(state.form['isSubmitted']).toBe(false);
    expect(state.form['isTouched']).toBe(false);
    expect(state.form['isDirty']).toBe(false);

    // Reset also clears ng-submitted off the real <form> (Formisch's reset() clears
    // isSubmitted by default — see formisch.ts's own doc comment on this exact behavior).
    await expect(page.locator('[data-parity-root] form')).not.toHaveClass(/ng-submitted/);
  });

  test('select round-trips: choose, then re-open shows it selected', async ({page}) => {
    await openAccountPage(page);
    await page.locator('[data-parity-root] .mat-mdc-select-trigger').click();
    await page.getByRole('option', {name: 'United Kingdom', exact: true}).click();
    await expect(page.locator('[data-parity-root] .mat-mdc-select-value-text')).toHaveText(
      'United Kingdom',
    );

    await page.locator('[data-parity-root] .mat-mdc-select-trigger').click();
    await expect(page.getByRole('option', {name: 'United Kingdom', exact: true})).toHaveAttribute(
      'aria-selected',
      'true',
    );
    const state = await formState(page);
    expect(state.input['country']).toBe('gb');
  });

  test('radio round-trips: clicking one unchecks the others', async ({page}) => {
    await openAccountPage(page);
    const group = page.locator('[data-parity-root]');
    await group.getByRole('radio', {name: 'Phone', exact: true}).click();
    await expect(group.getByRole('radio', {name: 'Phone', exact: true})).toBeChecked();
    await expect(group.getByRole('radio', {name: 'Email', exact: true})).not.toBeChecked();

    await group.getByRole('radio', {name: 'Mail', exact: true}).click();
    await expect(group.getByRole('radio', {name: 'Mail', exact: true})).toBeChecked();
    await expect(group.getByRole('radio', {name: 'Phone', exact: true})).not.toBeChecked();

    await expect.poll(async () => (await formState(page)).input['contactPreference']).toBe('mail');
  });

  test('slide-toggle round-trips', async ({page}) => {
    await openAccountPage(page);
    const toggle = page.locator('[data-parity-root] button.mdc-switch');
    await expect(toggle).toHaveAttribute('aria-checked', 'false');
    await toggle.click();
    await expect(toggle).toHaveAttribute('aria-checked', 'true');
    await expect.poll(async () => (await formState(page)).input['newsletter']).toBe(true);
    await toggle.click();
    await expect(toggle).toHaveAttribute('aria-checked', 'false');
    await expect.poll(async () => (await formState(page)).input['newsletter']).toBe(false);
  });

  test('checkbox round-trips', async ({page}) => {
    await openAccountPage(page);
    const checkbox = page.locator('[data-parity-root] input.mdc-checkbox__native-control');
    await expect(checkbox).not.toBeChecked();
    await checkbox.click();
    await expect(checkbox).toBeChecked();
    await expect.poll(async () => (await formState(page)).input['terms']).toBe(true);
    await checkbox.click();
    await expect(checkbox).not.toBeChecked();
    await expect.poll(async () => (await formState(page)).input['terms']).toBe(false);
  });

  // Typed in the DISPLAY format (`M/D/YYYY`, what `NativeDateAdapter.parse()` treats as a
  // LOCAL-time string, and what a real user actually types/sees) — NOT an ISO-shaped string.
  // `formisch-bindings.ts`'s `isoToDate`/`dateToIso` are local-time-based specifically to match
  // this (and the "Fill example data"/`setInput` path, which also round-trips through the
  // adapter's own LOCAL-time `format()`); `NativeDateAdapter.parse()` itself treats an ISO-
  // shaped string ("2024-02-14") as UTC instead (confirmed in `native-date-adapter.ts`: a bare
  // `Date.parse()` call, which the ECMAScript spec defines as UTC for a date-only ISO string,
  // local for anything else) — a real, pre-existing inconsistency in the adapter itself (not
  // introduced by this wiring), so typing an ISO-shaped string directly into the datepicker can
  // be off by one calendar day outside UTC. Not exercised here since it isn't how a real user
  // interacts with this control (they type/see the M/D/YYYY display format, or pick from the
  // calendar) — documented in `formisch-bindings.ts`'s own `isoToDate`/`dateToIso` comment.
  test('datepicker round-trips: typed text, blurred, reformatted, stored as ISO', async ({
    page,
  }) => {
    await openAccountPage(page);
    const date = page.locator('[data-parity-root] input.mat-datepicker-input');
    await date.fill('2/5/2024'); // differently-formatted-but-equivalent (no leading zero) valid date
    await date.blur();
    // Reformatted to the adapter's canonical display shape (M/D/YYYY, no leading zeros) —
    // unchanged here since it was already in that exact shape; still exercises the parse+
    // reformat path (`handleDatepickerBlur`) a calendar pick never does.
    await expect(date).toHaveValue('2/5/2024');
    await expect.poll(async () => (await formState(page)).input['birthday']).toBe('2024-02-05');
  });
});
