/**
 * MatDivider scenario port from src/material/divider/divider.spec.ts.
 *
 * Upstream has ~11 `it()` blocks — mostly host classes/attrs + BooleanInput
 * coercion. Restructured:
 *
 *   - Live sanity tests (5): typeof + MAT_DIVIDER_CONFIG.id + empty config +
 *     props shape.
 *   - describe.skip DOM-rendered (8): host classes/attrs + aria-* forwarding.
 *     Deferred to Playwright Task 8.
 *   - describe.skip Angular-only (3): BooleanInput coercion, NgModule
 *     declaration, @Input field-shape. Deferred forever per design spec §6
 *     deviations.
 *
 * Real DOM assertions live in
 * src/qwik-cdk-parity-tests/specs/material-divider/*.spec.ts.
 */
import {describe, it, expect} from 'vitest';
import {
  MAT_DIVIDER_CONFIG,
  MatDivider,
  type MatDividerConfig,
  type MatDividerProps,
} from './public-api';

describe('MatDivider — sanity', () => {
  it('MatDivider is exported', () => {
    expect(MatDivider).toBeDefined();
    expect(typeof MatDivider).toBe('function');
  });

  it('MAT_DIVIDER_CONFIG carries the expected context id', () => {
    expect(MAT_DIVIDER_CONFIG.id).toBe('qwik-material/divider-config');
  });

  it('MatDividerConfig accepts an empty object', () => {
    const cfg: MatDividerConfig = {};
    expect(cfg).toBeDefined();
  });

  it('MatDividerProps accepts the boolean surface', () => {
    const p: MatDividerProps = {vertical: true, inset: true};
    expect(p.vertical).toBe(true);
    expect(p.inset).toBe(true);
  });

  it('MatDividerProps accepts aria + class + id surface', () => {
    const p: MatDividerProps = {
      'aria-label': 'End of comments',
      'aria-labelledby': 'section-heading',
      'aria-describedby': 'section-desc',
      class: 'my-custom-divider',
      id: 'section-divider',
    };
    expect(p['aria-label']).toBe('End of comments');
  });
});

describe.skip('MatDivider DOM-rendered scenarios — deferred to Playwright Task 8', () => {
  it('should apply .mat-divider class', () => {});
  it('should apply .mat-divider-horizontal class when vertical is false (default)', () => {});
  it('should apply .mat-divider-vertical class when vertical is true', () => {});
  it('should apply .mat-divider-inset class when inset is true', () => {});
  it('should emit role="separator"', () => {});
  it('should emit aria-orientation="horizontal" (default)', () => {});
  it('should emit aria-orientation="vertical" when vertical is true', () => {});
  it('should forward aria-label / aria-labelledby / aria-describedby', () => {});
});

describe.skip('MatDivider — Angular-only tests', () => {
  it('should coerce BooleanInput attribute values via coerceBooleanProperty', () => {
    // Omitted — Qwik JSX passes booleans directly (§6 deviation #2).
  });
  it('should be declared in MatDividerModule', () => {
    // NgModule concept omitted (§6 deviation #8's NgModule removal).
  });
  it('should expose vertical/inset as Angular @Input() fields', () => {
    // Ports as regular props on MatDividerProps interface.
  });
});
