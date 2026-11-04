/**
 * MatIcon scenario port from src/material/icon/icon.spec.ts.
 *
 * Upstream has ~50 `it()` blocks — the majority exercise the MatIconRegistry
 * (XHR, addSvgIcon*, getNamedSvgIcon, icon-sets, DomSanitizer). Restructured:
 *
 *   - Live sanity tests: typeof + type unions + MAT_ICON_CONFIG.id +
 *     provider extension smoke + the new registry/svgIcon exports.
 *   - describe.skip DOM-rendered (14): host classes/attrs + font/svg mode +
 *     aria-hidden default + inline + color propagation. Deferred to
 *     Playwright (`specs/material-icon/*.spec.ts`).
 *   - describe.skip Angular-only (now a much shorter list — see below):
 *     the SVG icon registry ADDED 2026-11-03 (`icon-registry.ts`) covers
 *     addSvgIcon (and namespace/literal/set variants), addSvgIconResolver,
 *     getNamedSvgIcon, getSvgIconFromUrl, font-aliasing — real logic tests for all of that
 *     live in `icon-registry.spec.ts` and `icon-set-extract.spec.ts`, not
 *     here (this file stays props/types-only, same constraint as before —
 *     `createDOM()`-based rendering isn't attempted in this vitest
 *     environment, see button's identical file-header note). What's left
 *     skipped below is genuinely Angular-DI-only (HttpClient/DomSanitizer/
 *     RxJS/ErrorHandler-injection/MAT_ICON_LOCATION's Safari workaround) —
 *     see icon/SYNC.md's deviations list for the registry's own,
 *     non-DI-shaped replacements for each.
 *
 * Real DOM assertions live in
 * src/qwik-cdk-parity-tests/specs/material-icon/*.spec.ts.
 */
import {describe, it, expect} from 'vitest';
import {
  MAT_ICON_CONFIG,
  MAT_ICON_REGISTRY,
  MatIcon,
  useMatIconRegistryProvider,
  trustIconHtml,
  trustIconResourceUrl,
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

  // Task 2 (open-ended `color`): upstream types `color`'s setter
  // `string | null | undefined` (src/material/icon/icon.ts:168) — any
  // app-defined palette name is valid. Compile-time assertion for the
  // widened `OpenString<MatIconColor>` type (see core/open-string.ts). A
  // real DOM assertion lives in specs/material-icon/color-custom.spec.ts.
  it('MatIconProps.color accepts a custom palette name', () => {
    const p: MatIconProps = {color: 'brand-highlight'};
    expect(p.color).toBe('brand-highlight');
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

  // SVG icon registry (2026-11-03) — real logic coverage lives in
  // icon-registry.spec.ts / icon-set-extract.spec.ts; these are just the
  // public-api export-shape checks this file's sanity section does for
  // everything else.
  it('MatIconProps accepts the new svgIcon prop', () => {
    const p: MatIconProps = {svgIcon: 'social:cake'};
    expect(p.svgIcon).toBe('social:cake');
  });

  it('MAT_ICON_REGISTRY context id is defined and stable', () => {
    expect(MAT_ICON_REGISTRY).toBeDefined();
    // createContextId kebab-cases the id string at runtime (confirmed live,
    // same as MAT_ICON_CONFIG's 'qwikMaterial/iconConfig' source literal
    // above becoming 'qwik-material/icon-config') — assert the ACTUAL
    // runtime id, not the source literal.
    expect(MAT_ICON_REGISTRY.id).toBe('qwik-material/icon-registry');
  });

  it('useMatIconRegistryProvider is exported and is a function', () => {
    expect(useMatIconRegistryProvider).toBeDefined();
    expect(typeof useMatIconRegistryProvider).toBe('function');
  });

  it('trustIconResourceUrl / trustIconHtml wrap a string into a branded trusted value', () => {
    const url = trustIconResourceUrl('https://cdn.example/home.svg');
    const html = trustIconHtml('<svg></svg>');
    expect(url.url).toBe('https://cdn.example/home.svg');
    expect(html.html).toBe('<svg></svg>');
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
  // The following upstream scenarios are now REAL, PASSING coverage — not
  // skipped here, just relocated (real-DOM/async behavior needs more than a
  // props-shape check, which is all this particular file does — see its
  // header comment):
  //   - "should register an SVG icon via addSvgIcon()"               → icon-registry.spec.ts
  //   - "should register an SVG icon in a namespace"                 → icon-registry.spec.ts ("namespaced lookup")
  //   - "should register an SVG icon literal"                        → icon-registry.spec.ts ("no fetch involved")
  //   - "should register an icon set"                                → icon-registry.spec.ts ("icon sets")
  //   - "should register an icon resolver"                           → icon-registry.spec.ts ("addSvgIconResolver")
  //   - "should fetch a named SVG icon via HttpClient" (via `fetch()`
  //     instead — see icon-fetch.ts)                                 → icon-registry.spec.ts
  //   - "should cache in-flight SVG requests"                        → icon-registry.spec.ts ("deduplicates concurrent fetches")
  //   - "should register a font-set class alias"                    → icon-registry.spec.ts ("font aliasing")
  //   - "should look up a font-set alias via classNameForFontAlias" → icon-registry.spec.ts ("font aliasing")
  //   - "should set the default font-set class via setDefaultFontSetClass"
  //     → icon-registry.spec.ts ("font aliasing"); NOTE this registry method
  //     is API-surface-complete but NOT consulted by <MatIcon>'s rendering —
  //     see MatIconRegistryStore.defaultFontSetClass's doc comment. The
  //     rendering EFFECT upstream's method has is still the separate,
  //     pre-existing MatIconConfig.fontSet mechanism (SYNC.md deviation #7),
  //     covered by the Playwright parity specs as before.
  //   - "should throw on invalid svgIcon 'a:b:c' name"               → icon-registry.spec.ts ("splitIconName")
  //
  // Genuinely still N/A (real Angular-DI-only, or SSR-hostile browser
  // workarounds with no Qwik equivalent — see icon/SYNC.md):
  it('should error if HttpClient is missing', () => {
    // No HttpClient dependency — icon-fetch.ts calls the platform `fetch()` directly.
  });
  it('should sanitize URLs through DomSanitizer', () => {
    // DomSanitizer omitted — replaced by the explicit trustIconResourceUrl()/
    // trustIconHtml() opt-in wrappers (icon-trusted.ts), which don't sanitize
    // either (upstream's bypass functions don't sanitize, they BYPASS the
    // sanitizer) but do force the same "you must explicitly mark this
    // trusted" step.
  });
  it('should sanitize literals through DomSanitizer', () => {
    // DomSanitizer omitted — see above.
  });
  it('should handle SVG fetch errors via ErrorHandler', () => {
    // ErrorHandler DI token omitted — mat-icon.tsx logs via console.error
    // directly, matching Angular's own DEFAULT ErrorHandler implementation
    // when no custom one is provided.
  });
  it('should update FuncIRI references on path change', () => {
    // MAT_ICON_LOCATION + ngAfterViewChecked omitted — Safari base-tag
    // workaround; SSR-hostile, unrelated to the registry addition.
  });
  it('should unsubscribe from in-flight fetches on destroy', () => {
    // RxJS Subscription omitted — Qwik's useComputed$ handles its own
    // cleanup/abort when the component unmounts or recomputes.
  });
  it('should reset previous font-set class on fontSet change', () => {
    // Upstream mutates classList on setter — port applies at render time.
  });
  it('should set aria-hidden via constructor setAttribute', () => {
    // Port applies via prop merge — §6 deviation #12.
  });
  it('should apply MAT_ICON_DEFAULT_OPTIONS via DI', () => {
    // Provider flow verified in the dev-app + Playwright parity specs.
  });
});
