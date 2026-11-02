import {test, type Page} from '@playwright/test';
import {expectMaterialParity, type ParityStep} from '../../lib/material-parity.js';

const route = 'mat-button';

/** Clicks the single interactive element inside the parity root (exercises ripple + focus). */
const click: ParityStep = {
  name: 'click button',
  run: (page: Page) =>
    page.locator('[data-parity-root] button, [data-parity-root] a').first().click(),
};

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

test.describe('mat-button — Angular DOM parity', () => {
  test('color-accent', ({browser}) =>
    expectMaterialParity(browser, {route, scenario: 'color-accent'}));

  test('color-primary', ({browser}) =>
    expectMaterialParity(browser, {route, scenario: 'color-primary'}));

  test('color-warn', ({browser}) => expectMaterialParity(browser, {route, scenario: 'color-warn'}));

  test('disabled-interactive-only', ({browser}) =>
    expectMaterialParity(browser, {route, scenario: 'disabled-interactive-only'}));

  test('disabled-interactive', ({browser}) =>
    expectMaterialParity(browser, {route, scenario: 'disabled-interactive'}));

  test('disabled', ({browser}) => expectMaterialParity(browser, {route, scenario: 'disabled'}));

  test('elevated', ({browser}) => expectMaterialParity(browser, {route, scenario: 'elevated'}));

  test('fab-extended', ({browser}) =>
    expectMaterialParity(browser, {route, scenario: 'fab-extended'}));

  test('fab', ({browser}) => expectMaterialParity(browser, {route, scenario: 'fab'}));

  test('filled-link', ({browser}) =>
    expectMaterialParity(browser, {route, scenario: 'filled-link'}));

  test('filled', ({browser}) =>
    expectMaterialParity(browser, {route, scenario: 'filled', steps: [click]}));

  test('icon-button', ({browser}) =>
    expectMaterialParity(browser, {route, scenario: 'icon-button'}));

  test('mini-fab', ({browser}) => expectMaterialParity(browser, {route, scenario: 'mini-fab'}));

  test('outlined', ({browser}) => expectMaterialParity(browser, {route, scenario: 'outlined'}));

  test('text-link', ({browser}) => expectMaterialParity(browser, {route, scenario: 'text-link'}));

  test('text', ({browser}) => expectMaterialParity(browser, {route, scenario: 'text'}));

  test('tonal', ({browser}) => expectMaterialParity(browser, {route, scenario: 'tonal'}));

  test('keyboard focus', ({browser}) =>
    expectMaterialParity(browser, {route, scenario: 'text', steps: [tabIn]}));
});
