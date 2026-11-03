/**
 * MatProgressBar scenario port from src/material/progress-bar/progress-bar.spec.ts.
 *
 * Upstream has ~30 `it()` blocks — mostly host classes/attrs + value clamping +
 * Angular DI (EventEmitter.subscribe, MAT_PROGRESS_BAR_LOCATION, NgZone,
 * MAT_PROGRESS_BAR_DEFAULT_OPTIONS injection). Restructured:
 *
 *   - Live sanity tests (7): typeof + type unions + MAT_PROGRESS_BAR_CONFIG.id +
 *     props-shape smoke.
 *   - describe.skip DOM-rendered (15): host classes/attrs + mode reflection +
 *     value clamping + primary transform + buffer flex-basis + buffer-dots
 *     conditional + aria-* forwarding + onAnimationEnd$ callback firing.
 *     Deferred to Playwright Task 10.
 *   - describe.skip Angular-only (10): NgZone/Renderer2/ChangeDetectorRef,
 *     MAT_PROGRESS_BAR_LOCATION, _getAnimationsState, EventEmitter.subscribe,
 *     numberAttribute transform, DI-injected defaults, providedIn:'root'
 *     factory. Deferred forever per design spec §6 deviations.
 *
 * Real DOM assertions live in
 * src/qwik-cdk-parity-tests/specs/material-progress-bar/*.spec.ts.
 */
import {describe, it, expect} from 'vitest';
import {
  MAT_PROGRESS_BAR_CONFIG,
  MatProgressBar,
  type MatProgressBarColor,
  type MatProgressBarConfig,
  type MatProgressBarMode,
  type MatProgressBarProps,
} from './public-api';

describe('MatProgressBar — sanity', () => {
  it('MatProgressBar is exported', () => {
    expect(MatProgressBar).toBeDefined();
    expect(typeof MatProgressBar).toBe('function');
  });

  it('MAT_PROGRESS_BAR_CONFIG carries the expected context id', () => {
    expect(MAT_PROGRESS_BAR_CONFIG.id).toBe('qwik-material/progress-bar-config');
  });

  it('MatProgressBarColor accepts the three documented values', () => {
    const values: MatProgressBarColor[] = ['primary', 'accent', 'warn'];
    expect(values).toEqual(['primary', 'accent', 'warn']);
  });

  it('MatProgressBarMode accepts all four documented values', () => {
    const values: MatProgressBarMode[] = ['determinate', 'indeterminate', 'buffer', 'query'];
    expect(values).toHaveLength(4);
  });

  it('MatProgressBarConfig accepts an empty config', () => {
    const cfg: MatProgressBarConfig = {};
    expect(cfg).toBeDefined();
  });

  it('MatProgressBarProps accepts numeric + mode + color surface', () => {
    const p: MatProgressBarProps = {
      value: 50,
      bufferValue: 75,
      color: 'accent',
      mode: 'buffer',
    };
    expect(p.value).toBe(50);
  });

  it('MatProgressBarProps accepts aria + onAnimationEnd surface', () => {
    const p: MatProgressBarProps = {
      'aria-label': 'Uploading',
      'aria-labelledby': 'upload-heading',
      'aria-describedby': 'upload-tips',
    };
    expect(p['aria-label']).toBe('Uploading');
  });

  // Task 2 (open-ended `color`): upstream types `color`'s setter
  // `string | null | undefined` (src/material/progress-bar/progress-bar.ts:156),
  // not the narrower ThemePalette the config default-options token uses — any
  // app-defined palette name is valid. Compile-time assertion for the widened
  // `OpenString<MatProgressBarColor>` type (see core/open-string.ts).
  it('MatProgressBarProps.color accepts a custom palette name', () => {
    const p: MatProgressBarProps = {color: 'accent-outline'};
    expect(p.color).toBe('accent-outline');
  });
});

describe.skip('MatProgressBar DOM-rendered scenarios — deferred to Playwright Task 10', () => {
  it('should apply .mat-mdc-progress-bar and .mdc-linear-progress classes', () => {});
  it('should apply .mat-<color> class per color prop', () => {});
  it('should apply ._mat-animation-noopable when matAnimationsDisabled is true', () => {});
  it('should apply .mdc-linear-progress--animation-ready when animations enabled', () => {});
  it('should apply .mdc-linear-progress--indeterminate in indeterminate/query modes', () => {});
  it('should reflect mode via the `mode` attribute', () => {});
  it('should emit role="progressbar" + tabindex="-1"', () => {});
  it('should omit aria-valuenow in indeterminate/query modes', () => {});
  it('should emit aria-valuenow in determinate/buffer modes', () => {});
  it('should clamp value to 0-100', () => {});
  it('should apply transform: scaleX(value/100) to primary bar in determinate/buffer', () => {});
  it('should apply flex-basis to buffer bar per bufferValue in buffer mode', () => {});
  it('should render buffer-dots div only when mode === "buffer"', () => {});
  it('should forward aria-label / aria-labelledby / aria-describedby', () => {});
  it('should fire onAnimationEnd$ on primary-bar transitionend in determinate/buffer', () => {});
});

describe.skip('MatProgressBar — Angular-only tests', () => {
  it('should inject NgZone.runOutsideAngular for transitionend listener', () => {
    // Qwik uses useVisibleTask$ — §6 deviation #6.
  });
  it('should use Renderer2.listen for transitionend', () => {
    // Qwik uses direct addEventListener inside useVisibleTask$ — §6 deviation #6.
  });
  it('should trigger ChangeDetectorRef.markForCheck on setter mutation', () => {
    // Qwik's reactivity handles this natively — §6 deviation #6.
  });
  it('should detect MAT_PROGRESS_BAR_LOCATION via DI factory', () => {
    // MAT_PROGRESS_BAR_LOCATION omitted — §6 deviation #5.
  });
  it('should read _getAnimationsState() di-disabled', () => {
    // Replaced by MAT_ANIMATIONS_DISABLED context — §6 deviation #3.
  });
  it('should apply .mat-progress-bar-reduced-motion class via matchMedia', () => {
    // SCSS @media handles it — §6 deviation #4.
  });
  it('should notify animationEnd subscribers via EventEmitter', () => {
    // EventEmitter → onAnimationEnd$ QRL prop — §6 deviation #2.
  });
  it('should transform value via numberAttribute decorator', () => {
    // Port accepts JSX number and clamps — §6 deviation #9.
  });
  it('should apply MAT_PROGRESS_BAR_DEFAULT_OPTIONS via DI', () => {
    // Provider flow verified in Task 7 + Task 10 dev-app.
  });
  it('should register MAT_PROGRESS_BAR_LOCATION via providedIn: "root"', () => {
    // Angular DI-specific — no equivalent needed.
  });
});
