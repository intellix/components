import {test} from '@playwright/test';
import {expectMaterialParity} from '../../lib/material-parity.js';

const route = 'mat-divider';

test.describe('mat-divider — Angular DOM parity', () => {
  test('basic', ({browser}) => expectMaterialParity(browser, {route, scenario: 'basic'}));

  test('aria-labeled', ({browser}) =>
    expectMaterialParity(browser, {route, scenario: 'aria-labeled'}));

  test('inset', ({browser}) => expectMaterialParity(browser, {route, scenario: 'inset'}));

  test('list-context', ({browser}) =>
    expectMaterialParity(browser, {route, scenario: 'list-context'}));

  test('vertical', ({browser}) => expectMaterialParity(browser, {route, scenario: 'vertical'}));

  test('vertical-inset', ({browser}) =>
    expectMaterialParity(browser, {route, scenario: 'vertical-inset'}));
});
