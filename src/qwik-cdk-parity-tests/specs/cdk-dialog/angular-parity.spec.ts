import {test, type Page} from '@playwright/test';
import {expectMaterialParity, type ParityStep} from '../../lib/material-parity.js';

/**
 * Unlike the other qwik-parity components, every `dialog/<scenario>` route (see
 * src/dev-app/qwik-parity/cdk-dialog.ts) opens its dialog automatically once the component
 * mounts — there is no trigger button to click. `[data-parity-root]` therefore wraps only the
 * page's own (non-dialog) content, which is empty for every scenario except `restore-focus`.
 * The dialog itself renders into `.cdk-overlay-container` under <body>, so every test below
 * uses that as the comparison root.
 *
 * Both sides open asynchronously, so `skipInitialCompare` is set and the first
 * comparison happens after the `dialogOpens` step.
 */

const route = 'dialog';
const rootSelector = '.cdk-overlay-container';

const dialogOpens: ParityStep = {
  name: 'dialog opens',
  run: async (page: Page) => {
    await page.waitForSelector('.cdk-dialog-container');
  },
};

const stackedDialogsOpen: ParityStep = {
  name: 'dialogs open',
  run: async (page: Page) => {
    await page.waitForFunction(
      () => document.querySelectorAll('.cdk-dialog-container').length >= 2,
    );
  },
};

const pressEscape = (name = 'press Escape'): ParityStep => ({
  name,
  run: (page: Page) => page.keyboard.press('Escape'),
});

const clickBackdrop = (name = 'click backdrop'): ParityStep => ({
  name,
  run: (page: Page) => page.locator('.cdk-overlay-backdrop').click({force: true}),
});

test.describe('cdk-dialog — Angular DOM parity', () => {
  test('basic', ({browser}) =>
    expectMaterialParity(browser, {
      route,
      scenario: 'basic',
      rootSelector,
      skipInitialCompare: true,
      steps: [dialogOpens],
    }));

  test('aria-label', ({browser}) =>
    expectMaterialParity(browser, {
      route,
      scenario: 'aria-label',
      rootSelector,
      skipInitialCompare: true,
      steps: [dialogOpens],
    }));

  test('aria-labelledby', ({browser}) =>
    expectMaterialParity(browser, {
      route,
      scenario: 'aria-labelledby',
      rootSelector,
      skipInitialCompare: true,
      steps: [dialogOpens],
    }));

  test('aria-describedby', ({browser}) =>
    expectMaterialParity(browser, {
      route,
      scenario: 'aria-describedby',
      rootSelector,
      skipInitialCompare: true,
      steps: [dialogOpens],
    }));

  test('alertdialog-role', ({browser}) =>
    expectMaterialParity(browser, {
      route,
      scenario: 'alertdialog-role',
      rootSelector,
      skipInitialCompare: true,
      steps: [dialogOpens],
    }));

  test('auto-focus-disabled', ({browser}) =>
    expectMaterialParity(browser, {
      route,
      scenario: 'auto-focus-disabled',
      rootSelector,
      skipInitialCompare: true,
      steps: [dialogOpens],
    }));

  test('auto-focus-first-heading', ({browser}) =>
    expectMaterialParity(browser, {
      route,
      scenario: 'auto-focus-first-heading',
      rootSelector,
      skipInitialCompare: true,
      steps: [dialogOpens],
    }));

  test('auto-focus-first-tabbable', ({browser}) =>
    expectMaterialParity(browser, {
      route,
      scenario: 'auto-focus-first-tabbable',
      rootSelector,
      skipInitialCompare: true,
      steps: [dialogOpens],
    }));

  test('custom-panel-class', ({browser}) =>
    expectMaterialParity(browser, {
      route,
      scenario: 'custom-panel-class',
      rootSelector,
      skipInitialCompare: true,
      steps: [dialogOpens],
    }));

  test('custom-position', ({browser}) =>
    expectMaterialParity(browser, {
      route,
      scenario: 'custom-position',
      rootSelector,
      skipInitialCompare: true,
      steps: [dialogOpens],
    }));

  test('custom-scroll-strategy', ({browser}) =>
    expectMaterialParity(browser, {
      route,
      scenario: 'custom-scroll-strategy',
      rootSelector,
      skipInitialCompare: true,
      steps: [dialogOpens],
    }));

  test('min-max', ({browser}) =>
    expectMaterialParity(browser, {
      route,
      scenario: 'min-max',
      rootSelector,
      skipInitialCompare: true,
      steps: [dialogOpens],
    }));

  test('width-height', ({browser}) =>
    expectMaterialParity(browser, {
      route,
      scenario: 'width-height',
      rootSelector,
      skipInitialCompare: true,
      steps: [dialogOpens],
    }));

  test('with-data', ({browser}) =>
    expectMaterialParity(browser, {
      route,
      scenario: 'with-data',
      rootSelector,
      skipInitialCompare: true,
      steps: [dialogOpens],
    }));

  test('no-backdrop', ({browser}) =>
    expectMaterialParity(browser, {
      route,
      scenario: 'no-backdrop',
      rootSelector,
      skipInitialCompare: true,
      steps: [dialogOpens],
    }));

  test('escape-close', ({browser}) =>
    expectMaterialParity(browser, {
      route,
      scenario: 'escape-close',
      rootSelector,
      skipInitialCompare: true,
      steps: [dialogOpens, pressEscape()],
    }));

  test('backdrop-click-close', ({browser}) =>
    expectMaterialParity(browser, {
      route,
      scenario: 'backdrop-click-close',
      rootSelector,
      skipInitialCompare: true,
      steps: [dialogOpens, clickBackdrop()],
    }));

  test('disable-close', ({browser}) =>
    expectMaterialParity(browser, {
      route,
      scenario: 'disable-close',
      rootSelector,
      skipInitialCompare: true,
      steps: [
        dialogOpens,
        pressEscape('press Escape (disabled)'),
        clickBackdrop('click backdrop (disabled)'),
      ],
    }));

  test('restore-focus', ({browser}) =>
    expectMaterialParity(browser, {
      route,
      scenario: 'restore-focus',
      rootSelector,
      skipInitialCompare: true,
      steps: [dialogOpens, pressEscape('close via Escape')],
    }));

  test('multiple-stacked', ({browser}) =>
    expectMaterialParity(browser, {
      route,
      scenario: 'multiple-stacked',
      rootSelector,
      skipInitialCompare: true,
      steps: [stackedDialogsOpen],
    }));
});
