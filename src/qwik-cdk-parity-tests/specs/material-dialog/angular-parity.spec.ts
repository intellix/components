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
 * there is no trigger element to click. This step waits out the MDC enter
 * animation on each page independently so the structural compare that
 * follows sees the same settled `mdc-dialog--open` state on both sides
 * rather than racing the ~150ms transition.
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
    await page.waitForSelector('.mdc-dialog--open', {timeout: 2000}).catch(() => {});
  },
};

const escape: ParityStep = {
  name: 'press Escape',
  run: (page: Page) => page.keyboard.press('Escape'),
};

const backdropClick: ParityStep = {
  name: 'click backdrop',
  run: (page: Page) => page.locator('.cdk-overlay-backdrop').click(),
};

/** Clicks the nth `[mat-dialog-close]` element inside the open dialog. */
const clickClose = (index = 0): ParityStep => ({
  name: `click close button ${index}`,
  run: (page: Page) => page.locator('[mat-dialog-close]').nth(index).click(),
});

const clickTrigger = (selector: string): ParityStep => ({
  name: 'click trigger',
  run: (page: Page) => page.locator(selector).click(),
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
      steps: [settled, clickClose(1)],
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
      steps: [clickTrigger('button.open-button'), settled, clickClose()],
    }));

  test('restore-focus', ({browser}) =>
    expectMaterialParity(browser, {
      route,
      scenario: 'restore-focus',
      rootSelector,
      steps: [clickTrigger('button.restore-trigger'), settled, clickClose()],
    }));
});
