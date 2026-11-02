import {test} from '@playwright/test';
import {expectMaterialParity} from '../../lib/material-parity.js';

const route = 'mat-progress-spinner';

test.describe('mat-progress-spinner — Angular DOM parity', () => {
  test('basic', ({browser}) => expectMaterialParity(browser, {route, scenario: 'basic'}));

  test('aria-labeled', ({browser}) =>
    expectMaterialParity(browser, {route, scenario: 'aria-labeled'}));

  test('determinate', ({browser}) =>
    expectMaterialParity(browser, {route, scenario: 'determinate'}));

  test('indeterminate', ({browser}) =>
    expectMaterialParity(browser, {route, scenario: 'indeterminate'}));

  test('colors', ({browser}) => expectMaterialParity(browser, {route, scenario: 'colors'}));

  test('custom-diameter', ({browser}) =>
    expectMaterialParity(browser, {route, scenario: 'custom-diameter'}));

  test('custom-stroke', ({browser}) =>
    expectMaterialParity(browser, {route, scenario: 'custom-stroke'}));

  test('mat-spinner-alias', ({browser}) =>
    expectMaterialParity(browser, {route, scenario: 'mat-spinner-alias'}));
});
