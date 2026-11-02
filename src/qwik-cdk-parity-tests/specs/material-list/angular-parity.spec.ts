import {test} from '@playwright/test';
import {expectMaterialParity} from '../../lib/material-parity.js';

const route = 'mat-list';

test.describe('mat-list — Angular DOM parity', () => {
  test('basic', ({browser}) => expectMaterialParity(browser, {route, scenario: 'basic'}));

  test('avatar', ({browser}) => expectMaterialParity(browser, {route, scenario: 'avatar'}));

  test('icon-meta', ({browser}) => expectMaterialParity(browser, {route, scenario: 'icon-meta'}));

  test('nav', ({browser}) => expectMaterialParity(browser, {route, scenario: 'nav'}));

  test('action', ({browser}) => expectMaterialParity(browser, {route, scenario: 'action'}));

  test('three-line', ({browser}) => expectMaterialParity(browser, {route, scenario: 'three-line'}));

  test('two-line', ({browser}) => expectMaterialParity(browser, {route, scenario: 'two-line'}));

  test('with-subheader', ({browser}) =>
    expectMaterialParity(browser, {route, scenario: 'with-subheader'}));
});
