import {test, type Page} from '@playwright/test';
import {expectMaterialParity, type ParityStep} from '../../lib/material-parity.js';

const route = 'mat-progress-bar';

/**
 * Waits for the `onAnimationEnd$` (Qwik) / `(animationEnd)` (Angular) callback to fire, which
 * happens asynchronously once the primary bar's `transitionend` event completes.
 */
const waitForAnimationEnd: ParityStep = {
  name: 'wait for animationEnd',
  run: async (page: Page) => {
    await page.waitForFunction(
      () =>
        document.querySelector('[data-animation-end]')?.getAttribute('data-animation-end') ===
        'fired',
      undefined,
      {timeout: 5000},
    );
  },
};

test.describe('mat-progress-bar — Angular DOM parity', () => {
  test('basic', ({browser}) => expectMaterialParity(browser, {route, scenario: 'basic'}));

  test('aria-labeled', ({browser}) =>
    expectMaterialParity(browser, {route, scenario: 'aria-labeled'}));

  test('determinate', ({browser}) =>
    expectMaterialParity(browser, {route, scenario: 'determinate'}));

  test('indeterminate', ({browser}) =>
    expectMaterialParity(browser, {route, scenario: 'indeterminate'}));

  test('query', ({browser}) => expectMaterialParity(browser, {route, scenario: 'query'}));

  test('buffer', ({browser}) => expectMaterialParity(browser, {route, scenario: 'buffer'}));

  test('colors', ({browser}) => expectMaterialParity(browser, {route, scenario: 'colors'}));

  test('animation-end', ({browser}) =>
    expectMaterialParity(browser, {
      route,
      scenario: 'animation-end',
      skipInitialCompare: true,
      steps: [waitForAnimationEnd],
    }));
});
