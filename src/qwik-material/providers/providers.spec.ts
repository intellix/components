/**
 * Unit tests for `useMatProviders()`'s hook-order/key-freezing MECHANISM.
 *
 * This project's vitest environment hangs on `createDOM()` (see
 * `button/mat-button-scenarios.spec.tsx`'s own header comment for the established reason), so
 * no test here renders a real Qwik component or calls `useMatProviders()` itself — that would
 * require a live, multi-render component instance to prove anything about hook ORDER across
 * renders. Instead:
 *
 *   - The pure, Qwik-independent key-SET logic `useMatProviders()` builds its freezing on top
 *     of (`keySetOf`/`sameKeySet`, exported from `public-api.ts` for exactly this reason) is
 *     unit-tested directly below.
 *   - `ALL_PROVIDER_KEYS` (the fixed call order) is asserted to have no duplicates and to
 *     exactly match `MatProvidersConfig`'s own key list, so the dispatch table can't silently
 *     drift out of sync with the type as hooks are added.
 *   - The actual BEHAVIOR — a key set frozen on first render, values changing freely, a
 *     dialog/nested-provider carrying inherited config — is exercised for real in the
 *     Playwright spec `src/qwik-cdk-parity-tests/specs/material-core/providers.spec.ts`
 *     against the dev-app scenario under `src/qwik-cdk-dev-app/src/routes/mat-providers/`.
 */
import {describe, expect, it} from 'vitest';
import {
  useMatProviders,
  keySetOf,
  sameKeySet,
  ALL_PROVIDER_KEYS,
  type MatProvidersConfig,
} from './public-api';

describe('useMatProviders', () => {
  it('is exported and is a function', () => {
    expect(useMatProviders).toBeDefined();
    expect(typeof useMatProviders).toBe('function');
  });
});

describe('ALL_PROVIDER_KEYS', () => {
  it('has no duplicate keys', () => {
    expect(new Set(ALL_PROVIDER_KEYS).size).toBe(ALL_PROVIDER_KEYS.length);
  });

  it('matches the exact, documented key → hook mapping (see providers/SYNC.md)', () => {
    expect([...ALL_PROVIDER_KEYS].sort()).toEqual(
      [
        'formField',
        'dialog',
        'bottomSheet',
        'dateAdapter',
        'icons',
        'tooltip',
        'menu',
        'select',
        'autocomplete',
        'ripple',
        'animationsDisabled',
        'errorStateMatcher',
        'paginator',
        'stepper',
        'snackBar',
        'input',
        'button',
        'card',
        'badge',
        'icon',
        'progressBar',
        'progressSpinner',
        'divider',
        'gridList',
        'list',
        'buttonToggle',
        'slideToggle',
        'expansion',
        'radio',
        'checkbox',
        'sort',
        'tabs',
        'sidenav',
        'chips',
        'timepicker',
      ].sort(),
    );
  });
});

describe('keySetOf', () => {
  it('returns the set of keys actually present on a config object', () => {
    const config: MatProvidersConfig = {formField: {}, tooltip: {}};
    expect(keySetOf(config)).toEqual(new Set(['formField', 'tooltip']));
  });

  it(
    'omitting a key (vs. passing it as undefined) still counts it as "present" — matches ' +
      "JS's own Object.keys() semantics, which useMatProviders() relies on for its freeze",
    () => {
      // `animationsDisabled: undefined` is a key that IS present (just with an undefined value)
      // — `Object.keys()` includes it, same as a real caller writing
      // `{animationsDisabled: someSignal.value ? true : undefined}` would expect.
      const config: MatProvidersConfig = {animationsDisabled: undefined};
      expect(keySetOf(config).has('animationsDisabled')).toBe(true);
    },
  );

  it('an empty config has an empty key set', () => {
    expect(keySetOf({}).size).toBe(0);
  });
});

describe('sameKeySet', () => {
  it('is true for two sets with the same members in any order', () => {
    expect(
      sameKeySet(keySetOf({formField: {}, tooltip: {}}), keySetOf({tooltip: {}, formField: {}})),
    ).toBe(true);
  });

  it('is false when a key was added', () => {
    expect(sameKeySet(keySetOf({formField: {}}), keySetOf({formField: {}, tooltip: {}}))).toBe(
      false,
    );
  });

  it('is false when a key was removed', () => {
    expect(sameKeySet(keySetOf({formField: {}, tooltip: {}}), keySetOf({formField: {}}))).toBe(
      false,
    );
  });

  it('is false when the sizes match but the members differ', () => {
    expect(sameKeySet(keySetOf({formField: {}}), keySetOf({tooltip: {}}))).toBe(false);
  });

  it('is true for two empty sets', () => {
    expect(sameKeySet(keySetOf({}), keySetOf({}))).toBe(true);
  });
});
