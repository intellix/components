/**
 * MatIcon scenario port from src/material/icon/icon.spec.ts.
 *
 * Upstream has ~50 `it()` blocks — the majority exercise the MatIconRegistry
 * (XHR, addSvgIcon*, getNamedSvgIcon, icon-sets, DomSanitizer) which this
 * port omits entirely. Restructured:
 *
 *   - Live sanity tests (7): typeof + type unions + MAT_ICON_CONFIG.id +
 *     provider extension smoke.
 *   - describe.skip DOM-rendered (14): host classes/attrs + font/svg mode +
 *     aria-hidden default + inline + color propagation. Deferred to
 *     Playwright Task 9.
 *   - describe.skip Angular-only (20): registry, XHR, sanitizer, RxJS,
 *     ErrorHandler, MAT_ICON_LOCATION, ngAfterViewChecked. Deferred forever
 *     per design spec §6 deviations.
 *
 * Real DOM assertions live in
 * src/qwik-cdk-parity-tests/specs/material-icon/*.spec.ts.
 */
import {describe, it, expect} from 'vitest';
import {
  MAT_ICON_CONFIG,
  MatIcon,
  type MatIconColor,
  type MatIconConfig,
  type MatIconProps,
} from './public-api';

describe('MatIcon — sanity', () => {
  it('MatIcon is exported', () => {
    expect(MatIcon).toBeDefined();
    expect(typeof MatIcon).toBe('function');
  });

  it('MAT_ICON_CONFIG carries the expected context id', () => {
    expect(MAT_ICON_CONFIG.id).toBe('qwik-material/icon-config');
  });

  it('MatIconColor accepts the documented values', () => {
    const a: MatIconColor = 'primary';
    const b: MatIconColor = 'accent';
    const c: MatIconColor = 'warn';
    expect([a, b, c]).toEqual(['primary', 'accent', 'warn']);
  });

  it('MatIconConfig accepts an empty config', () => {
    const cfg: MatIconConfig = {};
    expect(cfg).toBeDefined();
  });

  it('MatIconConfig accepts every documented field', () => {
    const cfg: MatIconConfig = {
      color: 'accent',
      fontSet: 'material-symbols-outlined',
    };
    expect(cfg.color).toBe('accent');
  });

  it('MatIconProps accepts font-mode props', () => {
    const p: MatIconProps = {
      fontIcon: 'home',
      fontSet: 'fa',
      inline: true,
      color: 'primary',
    };
    expect(p.fontIcon).toBe('home');
  });

  it('MatIconProps accepts svg-mode props', () => {
    const p: MatIconProps = {
      svgLiteral: '<svg />',
      svgName: 'home',
      svgNamespace: 'social',
      'aria-hidden': false,
    };
    expect(p.svgLiteral).toBe('<svg />');
    expect(p['aria-hidden']).toBe(false);
  });
});

describe.skip('MatIcon DOM-rendered scenarios — deferred to Playwright Task 9', () => {
  it('should render a font ligature via slot content', () => {});
  it('should emit fontIcon attribute when fontIcon prop is set', () => {});
  it('should apply fontSet class in font mode only', () => {});
  it('should render inline SVG via svgLiteral (dangerouslySetInnerHTML)', () => {});
  it('should emit data-mat-icon-name and data-mat-icon-namespace in svg mode', () => {});
  it('should apply .mat-<color> class when color prop is set', () => {});
  it('should apply .mat-icon-no-color class when color prop is unset', () => {});
  it('should apply .mat-icon-inline class when inline prop is true', () => {});
  it('should default aria-hidden to "true" when consumer does not set it', () => {});
  it('should let consumer override aria-hidden by passing aria-hidden={false}', () => {});
  it('should always emit role="img"', () => {});
  it('should always emit data-mat-icon-type based on mode', () => {});
  it('should apply _cleanupFontValue trim+first-token to fontIcon/fontSet', () => {});
  it('should resolve color/fontSet from MAT_ICON_CONFIG when props are absent', () => {});
});

describe.skip('MatIcon — Angular-only tests', () => {
  it('should register an SVG icon via addSvgIcon()', () => {
    // MatIconRegistry omitted — §6 deviation #2.
  });
  it('should register an SVG icon in a namespace', () => {
    // MatIconRegistry omitted.
  });
  it('should register an SVG icon literal', () => {
    // MatIconRegistry omitted.
  });
  it('should register an icon set', () => {
    // Icon-sets omitted — §6 deviation #2.
  });
  it('should register an icon resolver', () => {
    // addSvgIconResolver omitted.
  });
  it('should fetch a named SVG icon via HttpClient', () => {
    // XHR omitted — §6 deviation #2.
  });
  it('should error if HttpClient is missing', () => {
    // No HttpClient dependency.
  });
  it('should sanitize URLs through DomSanitizer', () => {
    // DomSanitizer omitted — §6 deviation #4.
  });
  it('should sanitize literals through DomSanitizer', () => {
    // DomSanitizer omitted.
  });
  it('should cache in-flight SVG requests', () => {
    // No async fetching.
  });
  it('should handle SVG fetch errors via ErrorHandler', () => {
    // ErrorHandler injection omitted — §6 deviation #6.
  });
  it('should update FuncIRI references on path change', () => {
    // MAT_ICON_LOCATION + ngAfterViewChecked omitted — §6 deviation #5.
  });
  it('should register a font-set class alias', () => {
    // registerFontClassAlias omitted — §6 deviation #7.
  });
  it('should set the default font-set class via setDefaultFontSetClass', () => {
    // setDefaultFontSetClass omitted — §6 deviation #7.
  });
  it('should look up a font-set alias via classNameForFontAlias', () => {
    // classNameForFontAlias omitted — §6 deviation #7.
  });
  it('should unsubscribe from in-flight fetches on destroy', () => {
    // RxJS Subscription omitted — §6 deviation #8.
  });
  it('should throw on invalid svgIcon "a:b:c" name', () => {
    // svgIcon prop dropped — §6 deviation #3.
  });
  it('should reset previous font-set class on fontSet change', () => {
    // Upstream mutates classList on setter — port applies at render time.
  });
  it('should set aria-hidden via constructor setAttribute', () => {
    // Port applies via prop merge — §6 deviation #12.
  });
  it('should apply MAT_ICON_DEFAULT_OPTIONS via DI', () => {
    // Provider flow verified in Task 6 + Task 9 dev-app.
  });
});
