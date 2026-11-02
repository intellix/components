import {test, type Page} from '@playwright/test';
import {expectMaterialParity, type ParityStep} from '../../lib/material-parity.js';

const route = 'mat-button-toggle';

const click = (index: number): ParityStep => ({
  name: `click toggle ${index}`,
  run: (page: Page) => page.locator('mat-button-toggle button').nth(index).click({force: true}),
});
/** Tabs into the parity root from a sentinel placed just before it (the dev-app chrome differs). */
const tabIn: ParityStep = {
  name: 'Tab into root',
  run: async (page: Page) => {
    await page.locator('[data-parity-root]').evaluate(root => {
      const sentinel = document.createElement('button');
      root.before(sentinel);
      sentinel.focus();
    });
    await page.keyboard.press('Tab');
  },
};

test.describe('mat-button-toggle — Angular DOM parity', () => {
  test('basic', ({browser}) =>
    expectMaterialParity(browser, {route, scenario: 'basic', steps: [click(1), click(2)]}));

  test('multi', ({browser}) =>
    expectMaterialParity(browser, {
      route,
      scenario: 'multi',
      steps: [click(0), click(2), click(0)],
    }));

  test('preselected', ({browser}) =>
    expectMaterialParity(browser, {route, scenario: 'preselected', steps: [click(0)]}));

  test('standalone', ({browser}) =>
    expectMaterialParity(browser, {route, scenario: 'standalone', steps: [click(0), click(0)]}));

  test('disabled-group', ({browser}) =>
    expectMaterialParity(browser, {route, scenario: 'disabled-group', steps: [click(1)]}));

  test('disabled-individual', ({browser}) =>
    expectMaterialParity(browser, {
      route,
      scenario: 'disabled-individual',
      steps: [click(1), click(2)],
    }));

  test('form-name', ({browser}) =>
    expectMaterialParity(browser, {route, scenario: 'form-name', steps: [click(2)]}));

  test('keyboard focus', ({browser}) =>
    expectMaterialParity(browser, {route, scenario: 'basic', steps: [tabIn]}));
});
