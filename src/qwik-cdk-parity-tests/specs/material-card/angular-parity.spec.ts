import {test} from '@playwright/test';
import {expectMaterialParity} from '../../lib/material-parity.js';

const route = 'mat-card';

test.describe('mat-card — Angular DOM parity', () => {
  test('basic', ({browser}) => expectMaterialParity(browser, {route, scenario: 'basic'}));

  test('outlined', ({browser}) => expectMaterialParity(browser, {route, scenario: 'outlined'}));

  test('filled', ({browser}) => expectMaterialParity(browser, {route, scenario: 'filled'}));

  test('with-header', ({browser}) =>
    expectMaterialParity(browser, {route, scenario: 'with-header'}));

  test('with-image', ({browser}) => expectMaterialParity(browser, {route, scenario: 'with-image'}));

  test('full-composed', ({browser}) =>
    expectMaterialParity(browser, {route, scenario: 'full-composed'}));

  test('title-group', ({browser}) =>
    expectMaterialParity(browser, {route, scenario: 'title-group'}));

  test('with-footer', ({browser}) =>
    expectMaterialParity(browser, {route, scenario: 'with-footer'}));

  test('with-actions-start', ({browser}) =>
    expectMaterialParity(browser, {route, scenario: 'with-actions-start'}));

  test('with-actions-end', ({browser}) =>
    expectMaterialParity(browser, {route, scenario: 'with-actions-end'}));
});
