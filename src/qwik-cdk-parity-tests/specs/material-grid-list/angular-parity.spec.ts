import {test} from '@playwright/test';
import {expectMaterialParity} from '../../lib/material-parity.js';

const route = 'mat-grid-list';

// mat-grid-list has no interactive state (no clicks/keyboard), so every
// scenario here is a single structural snapshot — no `steps`.

test.describe('mat-grid-list — Angular DOM parity', () => {
  test('basic', ({browser}) => expectMaterialParity(browser, {route, scenario: 'basic'}));

  test('fit', ({browser}) => expectMaterialParity(browser, {route, scenario: 'fit'}));

  test('gutter', ({browser}) => expectMaterialParity(browser, {route, scenario: 'gutter'}));

  test('ratio', ({browser}) => expectMaterialParity(browser, {route, scenario: 'ratio'}));

  test('ratio-spanning', ({browser}) =>
    expectMaterialParity(browser, {route, scenario: 'ratio-spanning'}));

  test('spanning', ({browser}) => expectMaterialParity(browser, {route, scenario: 'spanning'}));

  test('aria-labeled', ({browser}) =>
    expectMaterialParity(browser, {route, scenario: 'aria-labeled'}));
});
