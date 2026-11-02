import {test, type Page} from '@playwright/test';
import {expectMaterialParity, type ParityStep} from '../../lib/material-parity.js';

const route = 'formisch';
const scenario = 'account';

/**
 * Formisch (`@formisch/qwik`) + qwik-material "account" form — Angular DOM parity.
 *
 * Source of truth: `src/qwik-cdk-dev-app/src/routes/formisch/account/index.tsx` (Qwik,
 * `@formisch/qwik`-driven) vs. `src/dev-app/qwik-parity/formisch.ts`'s `FormischAccount`
 * (Angular, plain reactive forms) — both compared on their shared `[data-parity-root]` subtree
 * (the real form; the Qwik page's demo-only JSON panel/extra buttons live outside it).
 *
 * Every field uses `appearance="outline"` (no line-ripple transitions to settle, unlike the
 * default fill appearance — see `specs/material-form-field`'s own header) — only the universal
 * `mat-form-field-animations-enabled` 300ms mount timer needs settling, via `settle` below.
 *
 * Step sequence exercises exactly the states the task asks for: pristine (the initial compare,
 * post-settle), touching + blurring two invalid fields, an invalid submit (shows every field's
 * error at once, including the two with no built-in Material error component — radio/checkbox —
 * via this page's own `.formisch-demo__error`), filling every field to a VALID value through
 * real interaction (typing, selecting, clicking — never a programmatic shortcut, so this
 * genuinely exercises the same code path a real user would), a valid submit, and a reset back to
 * pristine. See `account-schema.ts` / `formisch.ts` for the validators each field shares.
 */

const settle: ParityStep = {
  name: 'settle (300ms form-field animation timer)',
  run: async (page: Page) => {
    await page.waitForFunction(
      () =>
        Array.from(document.querySelectorAll('.mat-mdc-form-field')).every(el =>
          el.classList.contains('mat-form-field-animations-enabled'),
        ),
      undefined,
      {timeout: 3000},
    );
  },
};

/** 0 = name, 1 = email, 2 = bio — the three plain text/textarea fields, in DOM order. */
const textField = (page: Page, index: number) =>
  page
    .locator(
      '[data-parity-root] input.mat-mdc-input-element, [data-parity-root] textarea.mat-mdc-input-element',
    )
    .nth(index);

const focusAndBlur = (index: number): ParityStep => ({
  name: `focus+blur text field ${index}`,
  run: async (page: Page) => {
    await textField(page, index).focus();
    await textField(page, index).blur();
    await page.mouse.move(0, 0);
  },
});

/**
 * Types into a text field AND blurs it, as ONE combined step — never two separate ones. This
 * matters here specifically (unlike the plain `typeInto`/`blurField`-split convention other
 * parity specs in this suite use): Formisch marks a field touched the moment its VALUE changes
 * (`onInput`), where Angular's `FormControl.touched` only flips on an actual BLUR (see
 * `formisch-bindings.ts`'s own "Validation timing" doc comment for the full writeup) — a
 * documented, unavoidable semantic difference. `expectMaterialParity` compares DOM after EVERY
 * step, so a separate "type" step followed by a separate "blur" step would snapshot the
 * typed-but-not-yet-blurred instant too, where the two apps' `ng-touched`/`ng-untouched` (and,
 * downstream, `errorState`-gated classes) genuinely, expectedly disagree. Combining them into
 * one step means the only snapshot taken is AFTER both — by then both apps agree (Formisch was
 * already touched from the input; Angular only catches up once the blur in THIS SAME step runs)
 * — the same reason every state this task's deliverable actually asks to compare
 * ("after touching+blurring invalid fields") is itself phrased as one combined action.
 */
const typeAndBlur = (index: number, text: string): ParityStep => ({
  name: `type "${text}" into text field ${index} + blur`,
  run: async (page: Page) => {
    await textField(page, index).fill(text);
    await textField(page, index).blur();
    await page.mouse.move(0, 0);
  },
});

// Every step below parks the pointer off-form afterward (`page.mouse.move(0, 0)`) — same
// technique `specs/material-select`'s own `keyTo` step uses: whichever element the pointer last
// moved over keeps a live `:hover` even once the action itself is done, and two independently-
// timed apps don't necessarily end a click/select/fill at the EXACT same final pointer position
// relative to page content that may have shifted (a new error message changing a field's
// height, a focus-triggered scroll, ...) — confirmed live as the cause of several otherwise
// inexplicable single-property color diffs on completely unrelated fields while building this
// spec (e.g. selecting the country affecting the BIO field's resting label color).

const selectCountry = (label: string): ParityStep => ({
  name: `select country "${label}"`,
  run: async (page: Page) => {
    await page.locator('[data-parity-root] .mat-mdc-select-trigger').click();
    await page.waitForSelector('.mat-mdc-select-panel', {state: 'attached'});
    await page.getByRole('option', {name: label, exact: true}).click();
    await page.waitForSelector('.mat-mdc-select-panel', {state: 'detached'}).catch(() => {});
    await page.mouse.move(0, 0);
  },
});

// Each click is followed by an explicit `.blur()` on the SAME element, within the SAME step —
// same reason `typeAndBlur` combines typing and blurring: Formisch marks a field touched the
// MOMENT its value changes (`onInput`, used for these "custom control" bindings —
// `matRadioGroupBindings`/`matCheckboxBindings`/`matSlideToggleBindings` — since none of them
// expose a native element for Formisch's own `field.props` to register), where Angular Material's
// CVAs mark `touched` only on blur, for radio/checkbox/toggle exactly as for text inputs
// (confirmed live: a bare click, no blur, left Angular's `contactPreference` group
// `ng-untouched` while Formisch's was already `ng-touched`). Blurring in the same step settles
// both sides before the one comparison that follows.

const clickRadio = (label: string): ParityStep => ({
  name: `click radio "${label}" + blur`,
  run: async (page: Page) => {
    const radio = page.locator('[data-parity-root]').getByRole('radio', {name: label});
    await radio.click();
    await radio.blur();
    await page.mouse.move(0, 0);
  },
});

const clickToggle: ParityStep = {
  name: 'click newsletter toggle + blur',
  run: async (page: Page) => {
    const toggle = page.locator('[data-parity-root] button.mdc-switch');
    await toggle.click();
    await toggle.blur();
    await page.mouse.move(0, 0);
  },
};

const clickCheckbox: ParityStep = {
  name: 'click terms checkbox + blur',
  run: async (page: Page) => {
    const checkbox = page.locator('[data-parity-root] input.mdc-checkbox__native-control');
    await checkbox.click();
    await checkbox.blur();
    await page.mouse.move(0, 0);
  },
};

const typeDateAndBlur = (text: string): ParityStep => ({
  name: `type date "${text}" + blur`,
  run: async (page: Page) => {
    const input = page.locator('[data-parity-root] input.mat-datepicker-input');
    await input.fill(text);
    await input.blur();
    await page.mouse.move(0, 0);
  },
});

const clickSubmit: ParityStep = {
  name: 'click Submit',
  run: async (page: Page) => {
    await page.locator('[data-parity-root] button[type="submit"]').click();
    // An invalid submit focuses the first invalid field (both apps — see `formisch.ts`'s own
    // `focusFirstInvalid()` comment), which can scroll the page by a slightly different amount
    // on each independently-timed app; parking the pointer off-form sidesteps a stale `:hover`
    // on whatever element the LAST real pointer position happens to land on afterward — same
    // technique `specs/material-select`'s own `keyTo` step uses for the same reason.
    await page.mouse.move(0, 0);
  },
};

const clickReset: ParityStep = {
  name: 'click Reset',
  run: async (page: Page) => {
    await page.locator('[data-parity-root] button', {hasText: 'Reset'}).click();
    await page.mouse.move(0, 0);
  },
};

test.describe('formisch/account — Angular DOM parity', () => {
  test('account form', ({browser}) =>
    expectMaterialParity(browser, {
      route,
      scenario,
      skipInitialCompare: true,
      // `<mat-checkbox>`'s own host carries a literal `required=""` attribute ONLY on the
      // Angular side — a real Angular FORMS quirk (`RequiredValidator`, a directive matching any
      // `[required]` + `[formControlName]`/`[formControl]`/`[ngModel]` combination REGARDLESS of
      // element type, reflects `required` onto whatever host it's attached to), not a Material
      // DOM contract this port's own `MatCheckbox` participates in by design (see
      // `qwik-material/checkbox/mat-checkbox.tsx`'s own `required` doc comment: "no forms
      // validation"). `<mat-select>` avoids triggering it entirely (see `formisch.ts`'s own
      // comment) — this scoped ignore is needed for the checkbox only, but `ignoreAttrs` isn't
      // per-element, so it also (harmlessly) covers the `required` the native text inputs AND
      // the checkbox's own inner `<input>` already independently render identically — confirmed
      // via earlier runs of this exact spec before this ignore was added.
      ignoreAttrs: ['required'],
      steps: [
        settle, // ── pristine ──
        focusAndBlur(0), // touch name (empty, required) — "Name is required" shows
        typeAndBlur(1, 'bad-email'), // touch email with an invalid format — "Enter a valid email" shows
        clickSubmit, // ── invalid submit: every field's error shows, form gets ng-submitted ──
        typeAndBlur(0, 'Jordan Rivera'),
        typeAndBlur(1, 'jordan.rivera@example.com'),
        typeAndBlur(2, 'Product designer who loves accessible forms.'),
        selectCountry('Canada'),
        clickRadio('Email'),
        clickToggle,
        clickCheckbox,
        typeDateAndBlur('7/14/1992'),
        clickSubmit, // ── valid submit: every error clears, output committed ──
        clickReset, // ── back to pristine (Formisch's reset() also clears `submitted`) ──
      ],
    }));
});
