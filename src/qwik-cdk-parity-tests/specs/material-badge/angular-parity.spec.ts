import {test} from '@playwright/test';
import {expectMaterialParity} from '../../lib/material-parity.js';

const route = 'mat-badge';

test.describe('mat-badge — Angular DOM parity', () => {
  test('basic', ({browser}) => expectMaterialParity(browser, {route, scenario: 'basic'}));

  test('colors', ({browser}) => expectMaterialParity(browser, {route, scenario: 'colors'}));

  test('description', ({browser}) =>
    expectMaterialParity(browser, {route, scenario: 'description'}));

  test('disabled', ({browser}) => expectMaterialParity(browser, {route, scenario: 'disabled'}));

  test('empty-content', ({browser}) =>
    expectMaterialParity(browser, {route, scenario: 'empty-content'}));

  test('hidden', ({browser}) => expectMaterialParity(browser, {route, scenario: 'hidden'}));

  test('no-overlap', ({browser}) => expectMaterialParity(browser, {route, scenario: 'no-overlap'}));

  test('positions', ({browser}) => expectMaterialParity(browser, {route, scenario: 'positions'}));

  test('sizes', ({browser}) => expectMaterialParity(browser, {route, scenario: 'sizes'}));
});
