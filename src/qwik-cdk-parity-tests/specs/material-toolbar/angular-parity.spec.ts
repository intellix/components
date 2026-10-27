import {test} from '@playwright/test';
import {expectMaterialParity} from '../../lib/material-parity.js';

const route = 'mat-toolbar';

test.describe('mat-toolbar — Angular DOM parity', () => {
  test('basic', ({browser}) => expectMaterialParity(browser, {route, scenario: 'basic'}));

  test('color-accent', ({browser}) =>
    expectMaterialParity(browser, {route, scenario: 'color-accent'}));

  test('color-primary', ({browser}) =>
    expectMaterialParity(browser, {route, scenario: 'color-primary'}));

  test('color-warn', ({browser}) => expectMaterialParity(browser, {route, scenario: 'color-warn'}));

  test('multiple-rows', ({browser}) =>
    expectMaterialParity(browser, {route, scenario: 'multiple-rows'}));
});
