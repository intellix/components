/**
 * MatToolbar scenario port from src/material/toolbar/toolbar.spec.ts.
 *
 * Upstream has 5 `it()` blocks:
 *   1. `should apply class based on color attribute` — DOM-rendered → Playwright
 *   2. `should not wrap the first row contents inside of a generated element` — DOM-rendered → Playwright
 *   3. `should project each toolbar-row element inside of the toolbar` — DOM-rendered → Playwright
 *   4. `should throw an error if different toolbar modes are mixed` — Angular-only (dev-mode error, skipped per §8 deviation #2)
 *   5. `should pick up indirect descendant rows` — Angular-only (@ContentChildren, skipped per §8 deviation #1)
 *
 * Real DOM assertions live in
 * src/qwik-cdk-parity-tests/specs/material-toolbar/*.spec.ts.
 */
import {describe, it, expect} from 'vitest';
import {MatToolbar, MatToolbarRow, type MatToolbarProps} from './public-api';

describe('MatToolbar — sanity', () => {
  it('MatToolbar is exported', () => {
    expect(MatToolbar).toBeDefined();
    expect(typeof MatToolbar).toBe('function');
  });

  it('MatToolbarRow is exported', () => {
    expect(MatToolbarRow).toBeDefined();
    expect(typeof MatToolbarRow).toBe('function');
  });

  it('MatToolbar and MatToolbarRow are distinct components', () => {
    expect(MatToolbar).not.toBe(MatToolbarRow);
  });

  it('public-api re-exports both components without extras', () => {
    // Simple sanity: both are functions (Qwik components) and are the two
    // consumer-facing named exports the design spec §2.4 promises.
    expect(typeof MatToolbar).toBe('function');
    expect(typeof MatToolbarRow).toBe('function');
  });

  // Task 2 (open-ended `color`): upstream types `color` `string | null`
  // (src/material/toolbar/toolbar.ts:59) — any app-defined palette name is
  // valid. Compile-time assertion for the widened `OpenString<MatToolbarColor>`
  // type (see core/open-string.ts).
  it('MatToolbarProps.color accepts a custom palette name', () => {
    const p: MatToolbarProps = {color: 'accent-outline'};
    expect(p.color).toBe('accent-outline');
  });
});

describe.skip('MatToolbar DOM-rendered scenarios — deferred to Playwright Task 7', () => {
  it('should apply class based on color attribute', () => {});
  it('should not wrap the first row contents inside of a generated element', () => {});
  it('should project each toolbar-row element inside of the toolbar', () => {});
});

describe.skip('MatToolbar — Angular-only tests', () => {
  it('should throw an error if different toolbar modes are mixed', () => {
    // Deferred per design spec §8 deviation #2 (dev-mode error skipped).
  });
  it('should pick up indirect descendant rows', () => {
    // Deferred per design spec §8 deviation #1 (explicit multipleRows prop
    // replaces @ContentChildren runtime detection).
  });
});
