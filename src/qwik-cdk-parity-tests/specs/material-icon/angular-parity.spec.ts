import {test} from '@playwright/test';
import {expectMaterialParity} from '../../lib/material-parity.js';

const route = 'mat-icon';

test.describe('mat-icon — Angular DOM parity', () => {
  test('aria-labeled', ({browser}) =>
    expectMaterialParity(browser, {route, scenario: 'aria-labeled'}));

  test('basic', ({browser}) => expectMaterialParity(browser, {route, scenario: 'basic'}));

  test('colors', ({browser}) => expectMaterialParity(browser, {route, scenario: 'colors'}));

  test('font-icon', ({browser}) => expectMaterialParity(browser, {route, scenario: 'font-icon'}));

  test('font-set', ({browser}) => expectMaterialParity(browser, {route, scenario: 'font-set'}));

  test('inline', ({browser}) => expectMaterialParity(browser, {route, scenario: 'inline'}));

  test('svg-literal', ({browser}) =>
    expectMaterialParity(browser, {route, scenario: 'svg-literal'}));

  test('svg-named', ({browser}) => expectMaterialParity(browser, {route, scenario: 'svg-named'}));
});
