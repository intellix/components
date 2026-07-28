/**
 * MatBadge scenario port from src/material/badge/badge.spec.ts.
 *
 * Upstream has 20 `it()` blocks — 12 DOM-rendered (→ Playwright Task 9) +
 * 8 Angular-only (skipped forever per design spec §8 deviations 2, 5, 9).
 *
 * Real DOM assertions live in
 * src/qwik-cdk-parity-tests/specs/material-badge/*.spec.ts.
 */
import {describe, it, expect} from 'vitest';
import {
  MAT_BADGE_CONFIG,
  MatBadge,
  type MatBadgeColor,
  type MatBadgePosition,
  type MatBadgeSize,
  type MatBadgeConfig,
} from './public-api';

describe('MatBadge — sanity', () => {
  it('MatBadge is exported', () => {
    expect(MatBadge).toBeDefined();
    expect(typeof MatBadge).toBe('function');
  });

  it('MAT_BADGE_CONFIG carries the expected context id', () => {
    expect(MAT_BADGE_CONFIG.id).toBe('qwik-material/badge-config');
  });

  it('MatBadgeColor accepts the documented values', () => {
    const a: MatBadgeColor = 'primary';
    const b: MatBadgeColor = 'accent';
    const c: MatBadgeColor = 'warn';
    expect([a, b, c]).toEqual(['primary', 'accent', 'warn']);
  });

  it('MatBadgePosition accepts all 8 documented values', () => {
    const values: MatBadgePosition[] = [
      'above after',
      'above before',
      'below before',
      'below after',
      'before',
      'after',
      'above',
      'below',
    ];
    expect(values).toHaveLength(8);
  });

  it('MatBadgeSize accepts the documented values', () => {
    const a: MatBadgeSize = 'small';
    const b: MatBadgeSize = 'medium';
    const c: MatBadgeSize = 'large';
    expect([a, b, c]).toEqual(['small', 'medium', 'large']);
  });

  it('MatBadgeConfig accepts an empty config', () => {
    const cfg: MatBadgeConfig = {};
    expect(cfg).toBeDefined();
  });

  it('MatBadgeConfig accepts every documented field', () => {
    const cfg: MatBadgeConfig = {
      position: 'below before',
      size: 'large',
      color: 'accent',
      overlap: false,
    };
    expect(cfg.overlap).toBe(false);
  });
});

describe.skip('MatBadge DOM-rendered scenarios — deferred to Playwright Task 9', () => {
  it('should update the badge based on attribute', () => {});
  it('should be able to pass in falsy values to the badge content', () => {});
  it('should treat null and undefined as empty strings in the badge content', () => {});
  it('should apply class based on color attribute', () => {});
  it('should update the badge position on direction change (RTL)', () => {});
  it('should change visibility to hidden', () => {});
  it('should change badge sizes', () => {});
  it('should change badge overlap', () => {});
  it('should toggle visibility based on whether the badge has content', () => {});
  it('should toggle a class depending on the badge disabled state', () => {});
  it('should apply view encapsulation on create badge content', () => {});
  it('should not insert an inline description', () => {});
});

describe.skip('MatBadge — Angular-only tests', () => {
  it("should toggle 'aria-describedby' depending on whether the badge has a description", () => {
    // CDK AriaDescriber flow — skipped per design spec §8 deviation #2.
  });
  it('should clear any pre-existing badges', () => {
    // SSR cleanup — skipped per design spec §8 deviation #5.
  });
  it('should not clear badge content from child elements', () => {
    // SSR cleanup — skipped per design spec §8 deviation #5.
  });
  it('should throw if badge is not attached to an element node', () => {
    // Dev-mode error — skipped per design spec §8 deviation #9.
  });
  it('should insert the description inline after the host', () => {
    // InteractivityChecker — replaced by always-inline span in §8 deviation #2.
  });
  it('should not apply aria-describedby for non-interactive hosts', () => {
    // InteractivityChecker — replaced by always-inline span in §8 deviation #2.
  });
  it('should be able to specify default values through DI', () => {
    // Provider flow verified in Task 9 dev-app + Task 9 Playwright.
  });
  it('should expose the badge element via getBadgeElement()', () => {
    // Imperative Angular API — no Qwik equivalent, omitted.
  });
});
