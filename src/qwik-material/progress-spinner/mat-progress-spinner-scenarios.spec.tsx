/**
 * MatProgressSpinner scenario port from
 * src/material/progress-spinner/progress-spinner.spec.ts.
 *
 * Upstream has ~25 `it()` blocks — mostly host classes/attrs + geometry
 * computation + Angular DI (MAT_PROGRESS_SPINNER_DEFAULT_OPTIONS injection,
 * _getAnimationsState, numberAttribute transforms). Restructured:
 *
 *   - Live sanity tests (8): typeof both components + type unions +
 *     MAT_PROGRESS_SPINNER_CONFIG.id + props-shape smoke.
 *   - describe.skip DOM-rendered (15): host classes/attrs/inline-style +
 *     viewBox/stroke-dasharray/stroke-dashoffset computation + 4 SVG copies +
 *     mat-spinner tag emission + default mode per component + aria-*
 *     forwarding + value clamping + explicit mode override. Deferred to
 *     Playwright Task 10.
 *   - describe.skip Angular-only (10): NgTemplateOutlet, ViewChild,
 *     MAT_PROGRESS_SPINNER_DEFAULT_OPTIONS DI factory, _getAnimationsState,
 *     _forceAnimations, numberAttribute, ThemePalette full union,
 *     _defaultColor mutation, providedIn:'root' factory, const-alias
 *     MatSpinner = MatProgressSpinner pattern. Deferred forever per design
 *     spec §6 deviations.
 *
 * Real DOM assertions live in
 * src/qwik-cdk-parity-tests/specs/material-progress-spinner/*.spec.ts.
 */
import {describe, it, expect} from 'vitest';
import {
  MAT_PROGRESS_SPINNER_CONFIG,
  MatProgressSpinner,
  MatSpinner,
  type MatProgressSpinnerColor,
  type MatProgressSpinnerConfig,
  type MatProgressSpinnerMode,
  type MatProgressSpinnerProps,
  type MatSpinnerProps,
} from './public-api';

describe('MatProgressSpinner / MatSpinner — sanity', () => {
  it('MatProgressSpinner is exported', () => {
    expect(MatProgressSpinner).toBeDefined();
    expect(typeof MatProgressSpinner).toBe('function');
  });

  it('MatSpinner is exported', () => {
    expect(MatSpinner).toBeDefined();
    expect(typeof MatSpinner).toBe('function');
  });

  it('MAT_PROGRESS_SPINNER_CONFIG carries the expected context id', () => {
    expect(MAT_PROGRESS_SPINNER_CONFIG.id).toBe('qwik-material/progress-spinner-config');
  });

  it('MatProgressSpinnerColor accepts the three documented values', () => {
    const values: MatProgressSpinnerColor[] = ['primary', 'accent', 'warn'];
    expect(values).toEqual(['primary', 'accent', 'warn']);
  });

  it('MatProgressSpinnerMode accepts both documented values', () => {
    const values: MatProgressSpinnerMode[] = ['determinate', 'indeterminate'];
    expect(values).toHaveLength(2);
  });

  it('MatProgressSpinnerConfig accepts an empty config + every documented field', () => {
    const empty: MatProgressSpinnerConfig = {};
    const full: MatProgressSpinnerConfig = {color: 'accent', diameter: 40, strokeWidth: 3};
    expect(empty).toBeDefined();
    expect(full.diameter).toBe(40);
  });

  it('MatProgressSpinnerProps accepts the numeric + geometry + color surface', () => {
    const p: MatProgressSpinnerProps = {
      value: 50,
      diameter: 40,
      strokeWidth: 3,
      color: 'accent',
      mode: 'determinate',
      'aria-label': 'Loading',
    };
    expect(p.value).toBe(50);
  });

  it('MatSpinnerProps is structurally identical to MatProgressSpinnerProps', () => {
    const p: MatSpinnerProps = {value: 25, diameter: 24};
    // Type-level: MatSpinnerProps === MatProgressSpinnerProps. Cross-assign both ways.
    const q: MatProgressSpinnerProps = p;
    const r: MatSpinnerProps = q;
    expect(r.diameter).toBe(24);
  });
});

describe.skip('MatProgressSpinner DOM-rendered scenarios — deferred to Playwright Task 10', () => {
  it('should apply .mat-mdc-progress-spinner and .mdc-circular-progress classes', () => {});
  it('should apply .mat-<color> class per color prop', () => {});
  it('should apply ._mat-animation-noopable when matAnimationsDisabled is true', () => {});
  it('should apply .mdc-circular-progress--indeterminate in indeterminate mode', () => {});
  it('should emit role="progressbar" + tabindex="-1"', () => {});
  it('should omit aria-valuenow in indeterminate mode', () => {});
  it('should emit aria-valuenow in determinate mode', () => {});
  it('should reflect mode via the `mode` attribute', () => {});
  it('should emit inline width/height/CSS-custom-property style for diameter', () => {});
  it('should compute viewBox / stroke-dasharray / stroke-dashoffset / stroke-width% from diameter+strokeWidth+value', () => {});
  it('should render 4 SVG copies (1 determinate + 3 indeterminate clippers)', () => {});
  it('should render both containers regardless of mode', () => {});
  it('should render <mat-spinner> tag when using MatSpinner', () => {});
  it('should render <mat-progress-spinner> tag when using MatProgressSpinner', () => {});
  it('should forward aria-label / aria-labelledby / aria-describedby', () => {});
});

describe.skip('MatProgressSpinner — Angular-only tests', () => {
  it('should reuse the same <ng-template #circle> across 4 render sites', () => {
    // NgTemplateOutlet omitted — §6 deviation #6 (replaced by SpinnerCircle helper).
  });
  it('should expose the determinate spinner via @ViewChild', () => {
    // ViewChild omitted — §6 deviation #7.
  });
  it('should inject MAT_PROGRESS_SPINNER_DEFAULT_OPTIONS via DI factory', () => {
    // Config folded into QwikMaterialProvider — §6 deviation #9.
  });
  it('should read _getAnimationsState() di-disabled', () => {
    // Replaced by MAT_ANIMATIONS_DISABLED context — §6 deviation #3.
  });
  it('should apply .mat-progress-spinner-reduced-motion class via matchMedia', () => {
    // SCSS @media handles it — §6 deviation #4.
  });
  it('should honor the _forceAnimations DI toggle', () => {
    // Omitted — §6 deviation #5.
  });
  it('should transform value/diameter/strokeWidth via numberAttribute decorator', () => {
    // Port accepts JSX number — §6 deviation #8.
  });
  it('should accept arbitrary ThemePalette strings', () => {
    // Narrowed to 3-value union — §6 deviation #11.
  });
  it('should expose MatSpinner as a const alias of MatProgressSpinner', () => {
    // Port ships MatSpinner as a real distinct component — §6 deviation #12.
  });
  it('should register MAT_PROGRESS_SPINNER_DEFAULT_OPTIONS via providedIn: "root"', () => {
    // Angular DI-specific — no equivalent needed.
  });
});
