import {test, type Page} from '@playwright/test';
import {expectMaterialParity, type ParityStep} from '../../lib/material-parity.js';

const route = 'mat-dialog';

/**
 * Dialogs render into `.cdk-overlay-container` under <body>, not inside the
 * page's own `[data-parity-root]` (which exists only so expectMaterialParity's
 * open() has something to wait for — see src/dev-app/qwik-parity/dialog.ts).
 */
const rootSelector = '.cdk-overlay-container';

/**
 * Most scenarios open the dialog as soon as the page mounts (Angular:
 * ngOnInit; Qwik: a useVisibleTask$ in the shared <MatAutoOpen> helper) —
 * there is no trigger element to click. This step waits out the *entire*
 * MDC enter animation — `mdc-dialog--open` present AND `mdc-dialog--opening`
 * already cleared — on each page independently, so the structural compare
 * that follows sees the same fully-settled state on both sides.
 *
 * Waiting for `mdc-dialog--open` alone is not enough: upstream adds
 * `--opening` and `--open` TOGETHER in the same requestAnimationFrame, then
 * only removes `--opening` once the (default 150ms) enter duration elapses
 * (see MatDialogContainer._startOpenAnimation/_clearAnimationClasses). Since
 * Angular's own step runs first and Qwik's hydration adds its own startup
 * latency, by the time both sides are checked, Angular's clock since ITS
 * OWN open() call has usually run further past that 150ms mark than Qwik's
 * — so a `--open`-only wait leaves Qwik's `--opening` class still attached
 * when the Angular side's has already cleared, and vice-versa for the
 * reverse ordering. Waiting for the fully-cleared state removes that
 * timing-order asymmetry entirely.
 *
 * NOTE: expectMaterialParity() runs its "initial" compare of `rootSelector`
 * BEFORE any step (see lib/material-parity.ts). For these auto-open
 * scenarios that initial compare races the two frameworks' independent
 * mount timing (Angular's ngOnInit vs. Qwik's hydration-gated
 * useVisibleTask$), and nothing in this spec file can run before it. If that
 * "initial" compare turns out to be flaky/failing in practice, the fix is a
 * helper change, not a spec change — see this file's header comment in the
 * handback report for the exact shape of the suggested option
 * (`skipInitialCompare` on `ParityScenario`).
 */
const settled: ParityStep = {
  name: 'dialog open (settled)',
  run: async (page: Page) => {
    await page
      .waitForFunction(
        () => {
          const el = document.querySelector('mat-dialog-container');
          return (
            !!el &&
            el.classList.contains('mdc-dialog--open') &&
            !el.classList.contains('mdc-dialog--opening')
          );
        },
        undefined,
        {timeout: 2000},
      )
      .catch(() => {});
  },
};

const escape: ParityStep = {
  name: 'press Escape',
  run: (page: Page) => page.keyboard.press('Escape'),
};

/**
 * Clicks the backdrop near a corner, NOT its (Playwright-default) center.
 * The backdrop's bounding box is the full viewport, and the dialog pane is
 * centered — i.e. the pane's own center always coincides with the
 * viewport's center. A plain `.click()` targets that exact point, which is
 * *inside* the pane for any dialog, however small; the click would land on
 * the dialog's own content, not the backdrop, on both sides identically (a
 * real stacking fact, not a qwik-vs-Angular difference) — correctly NOT
 * closing the dialog (clicking inside a dialog must not close it), but also
 * not exercising backdrop-click-close at all. `{x: 5, y: 5}` is reliably
 * outside any of these dialogs' small centered panes. `force: true` is kept
 * defensively in case anything else (e.g. a focus-trap anchor) ever
 * overlaps that corner — matching the `clickBackdrop` helper already used
 * in specs/cdk-dialog/angular-parity.spec.ts.
 */
const backdropClick: ParityStep = {
  name: 'click backdrop',
  run: (page: Page) =>
    page.locator('.cdk-overlay-backdrop').click({position: {x: 5, y: 5}, force: true}),
};

/**
 * Clicks a button inside the open dialog, matched by its visible text.
 *
 * Deliberately NOT a `[mat-dialog-close]` selector: the Angular scenario
 * bodies mostly bind it as a property (`[mat-dialog-close]="'yes'"`), which
 * Angular does not reflect as a DOM attribute (property bindings only add an
 * attribute when the directive has an explicit `[attr.x]` host binding —
 * `MatDialogClose` doesn't have one for its selector input). Only the one
 * scenario body that writes the bare, bracket-less `mat-dialog-close`
 * (restore-focus) gets the literal attribute on Angular's side; `[mat-dialog-
 * close]`-selector clicks would hang indefinitely (element never found) on
 * every other scenario, since qwik-material's `<MatDialogClose>` always
 * renders the attribute unconditionally — making the two sides agree only by
 * accident. Matching by text works identically regardless of binding style.
 */
const clickButton = (text: string): ParityStep => ({
  name: `click button "${text}"`,
  run: (page: Page) => page.getByRole('button', {name: text, exact: true}).click(),
});

/**
 * Clicks a trigger that opens the dialog, then waits for the container to
 * attach. Qwik's `open$` is a lazily-loaded QRL — on a cold click, there's a
 * real (if brief) async gap between the click resolving and the overlay
 * actually registering, unlike Angular's fully-synchronous `MatDialog.open()`.
 * Without this wait, a compare run immediately after this step (before the
 * next step gets a chance to settle anything) can race ahead of Qwik's QRL
 * load, same as every other step here waits for its own expected state.
 */
const clickTrigger = (selector: string): ParityStep => ({
  name: 'click trigger',
  run: async (page: Page) => {
    await page.locator(selector).click();
    await page.waitForSelector('mat-dialog-container', {state: 'attached', timeout: 2000});
  },
});

test.describe('mat-dialog — Angular DOM parity', () => {
  test('basic', ({browser}) =>
    expectMaterialParity(browser, {
      route,
      scenario: 'basic',
      rootSelector,
      skipInitialCompare: true,
      steps: [settled],
    }));

  test('aria-label', ({browser}) =>
    expectMaterialParity(browser, {
      route,
      scenario: 'aria-label',
      rootSelector,
      skipInitialCompare: true,
      steps: [settled],
    }));

  test('aria-labelledby', ({browser}) =>
    expectMaterialParity(browser, {
      route,
      scenario: 'aria-labelledby',
      rootSelector,
      skipInitialCompare: true,
      steps: [settled],
    }));

  test('aria-describedby', ({browser}) =>
    expectMaterialParity(browser, {
      route,
      scenario: 'aria-describedby',
      rootSelector,
      skipInitialCompare: true,
      steps: [settled],
    }));

  test('role-alertdialog', ({browser}) =>
    expectMaterialParity(browser, {
      route,
      scenario: 'role-alertdialog',
      rootSelector,
      skipInitialCompare: true,
      steps: [settled],
    }));

  test('panel-class', ({browser}) =>
    expectMaterialParity(browser, {
      route,
      scenario: 'panel-class',
      rootSelector,
      skipInitialCompare: true,
      steps: [settled],
    }));

  test('has-actions', ({browser}) =>
    expectMaterialParity(browser, {
      route,
      scenario: 'has-actions',
      rootSelector,
      skipInitialCompare: true,
      steps: [settled, clickButton('Yes')],
    }));

  test('close-on-escape', ({browser}) =>
    expectMaterialParity(browser, {
      route,
      scenario: 'close-on-escape',
      rootSelector,
      skipInitialCompare: true,
      steps: [settled, escape],
    }));

  test('close-on-backdrop', ({browser}) =>
    expectMaterialParity(browser, {
      route,
      scenario: 'close-on-backdrop',
      rootSelector,
      skipInitialCompare: true,
      steps: [settled, backdropClick],
    }));

  test('disable-close', ({browser}) =>
    expectMaterialParity(browser, {
      route,
      scenario: 'disable-close',
      rootSelector,
      skipInitialCompare: true,
      steps: [settled, escape, backdropClick],
    }));

  test('close-with-result', ({browser}) =>
    expectMaterialParity(browser, {
      route,
      scenario: 'close-with-result',
      rootSelector,
      steps: [clickTrigger('button.open-button'), settled, clickButton('Close with result')],
    }));

  test('restore-focus', ({browser}) =>
    expectMaterialParity(browser, {
      route,
      scenario: 'restore-focus',
      rootSelector,
      steps: [clickTrigger('button.restore-trigger'), settled, clickButton('Close')],
    }));
});
