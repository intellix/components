/**
 * @fileoverview MatButton scenario port from src/material/button/button.spec.ts
 *
 * Port strategy (Task 12)
 * ────────────────────────
 * The upstream spec (561 LOC, 30 `it` blocks) uses Angular TestBed + DOM
 * rendering. In a Qwik-vitest environment, `createDOM(<Component$/>)` hangs
 * the worker indefinitely, so NO DOM-render tests are attempted here.
 *
 * This file instead:
 *  1. Runs 5 live sanity tests that confirm every public export is importable.
 *  2. Records ~25 upstream test intents as named `it()` stubs inside four
 *     `describe.skip` blocks — one per deferral category — so the vitest
 *     output clearly documents port coverage state.
 *
 * Categories:
 *  • DOM-rendered scenarios  (~22 stubs) → deferred to Playwright Task 15
 *  • Angular-only            (~5 stubs)  → TestBed / Renderer2 / ApplicationRef
 *  • Ripple JS animation     (~3 stubs)  → static ripple-loader contract (attrs
 *    + lazily-inserted `.mat-ripple` span) ported, see `internal/ripple-loader.ts`
 *    and `specs/material-button/angular-parity.spec.ts`; the click *animation*
 *    itself (a first-class qwik-cdk MatRipple primitive) is still deferred.
 *  • FocusMonitor            (~1 stub)   → ported via `qwik-cdk/a11y`'s
 *    `useFocusMonitor(hostRef, {checkChildren})` hook, called directly from
 *    mat-button.tsx and friends; origin-discrimination is exercised by the
 *    angular-parity "keyboard focus" scenario, not here (DOM-render tests
 *    hang this vitest worker — see file header).
 *
 * Real DOM assertions live in the Task 15 Playwright specs once the dev-app
 * button route is wired up.
 */

import {describe, it, expect} from 'vitest';
import {
  MatButton,
  MatIconButton,
  MatFabButton,
  MatMiniFabButton,
  MAT_BUTTON_CONFIG,
} from './public-api';

// ─────────────────────────────────────────────────────────────────────────────
// Live sanity — confirms every public symbol is importable
// ─────────────────────────────────────────────────────────────────────────────

describe('MatButton public-api exports — sanity', () => {
  it('MatButton is defined and is a function', () => {
    expect(MatButton).toBeDefined();
    expect(typeof MatButton).toBe('function');
  });

  it('MatIconButton is defined and is a function', () => {
    expect(MatIconButton).toBeDefined();
    expect(typeof MatIconButton).toBe('function');
  });

  it('MatFabButton is defined and is a function', () => {
    expect(MatFabButton).toBeDefined();
    expect(typeof MatFabButton).toBe('function');
  });

  it('MatMiniFabButton is defined and is a function', () => {
    expect(MatMiniFabButton).toBeDefined();
    expect(typeof MatMiniFabButton).toBe('function');
  });

  it('MAT_BUTTON_CONFIG context id is defined', () => {
    expect(MAT_BUTTON_CONFIG).toBeDefined();
    expect(MAT_BUTTON_CONFIG.id).toBe('qwik-material/button-config');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Deferred: DOM-rendered scenarios → Playwright Task 15
// ─────────────────────────────────────────────────────────────────────────────

describe.skip('MatButton DOM-rendered scenarios — deferred to Playwright (Task 15)', () => {
  // General MatButton behaviour
  it('should apply class based on color attribute');
  it('should apply class based on the disabled state');
  it('should not clear previous defined classes');
  it('should be able to change the button appearance dynamically');

  // button[mat-button]
  it('should handle a click on the button');
  it('should not increment if disabled');
  it('should disable the native button element');
  it('should show progress indicator when showProgress is true (button)');

  // a[mat-button]
  it('should not redirect if disabled');
  it('should remove tabindex if disabled');
  it('should add aria-disabled attribute if disabled');
  it('should not add aria-disabled attribute if disabled is false');
  it('should be able to set a custom tabindex');
  it('should not set a default tabindex on enabled links');
  it('should show progress indicator when showProgress is true (anchor)');

  // button[mat-fab]
  it('should have accent palette by default (mat-fab)');
  it('should show progress indicator when showProgress is true (mat-fab)');

  // button[mat-fab] extended
  it('should be extended (mat-fab extended)');

  // button[mat-mini-fab]
  it('should have accent palette by default (mat-mini-fab)');
  it('should show progress indicator when showProgress is true (mat-mini-fab)');

  // interactive disabled buttons
  it('should set a class when allowing disabled interactivity');
  it('should set aria-disabled when allowing disabled interactivity');
  it('should not set the disabled attribute when allowing disabled interactivity');
  it('should set aria-disabled on anchor when disabledInteractive is enabled');
});

// ─────────────────────────────────────────────────────────────────────────────
// Deferred: Angular-only — TestBed / Renderer2 / NgZone / ApplicationRef
// ─────────────────────────────────────────────────────────────────────────────

describe.skip('Angular-only — TestBed / Renderer2 / NgZone / ApplicationRef', () => {
  // Requires TestBed.configureTestingModule + provider injection
  it('should be able to configure the default button appearance (MAT_BUTTON_CONFIG provider)');
  it('should be able to configure the default color of buttons (MAT_BUTTON_CONFIG provider)');

  // Requires ApplicationRef.tick + spyOn
  it(
    'should not run change detection for disabled anchor but should prevent the default behavior and stop event propagation',
  );

  // Requires MAT_FAB_DEFAULT_OPTIONS provider via TestBed
  it('MatFabDefaultOptions — should override default color in component (mat-primary)');
  it('MatFabDefaultOptions — should default to accent if config does not specify color');
});

// ─────────────────────────────────────────────────────────────────────────────
// Deferred: Ripple JS animation — future qwik-cdk MatRipple primitive
// ─────────────────────────────────────────────────────────────────────────────

describe.skip('Ripple JS animation — deferred to future qwik-cdk MatRipple primitive', () => {
  // These tests exist in the Angular source but are implicit in the MatButton
  // implementation via the MatRipple directive; no explicit ripple `it` blocks
  // appear in button.spec.ts. They are stubbed here as forward references for
  // when the qwik-cdk MatRipple primitive is ported.
  it('should add mat-mdc-button-ripple element inside button');
  it('should apply disableRipple class when disableRipple prop is true');
  it('should remove ripple element when disableRipple transitions from false to true');
});

// ─────────────────────────────────────────────────────────────────────────────
// Deferred: FocusMonitor origin discrimination
// ─────────────────────────────────────────────────────────────────────────────

describe.skip('FocusMonitor origin discrimination — deferred to future CDK FocusMonitor port', () => {
  // Requires @angular/cdk/a11y FocusMonitor which has no qwik-cdk equivalent yet.
  it('should have a focus indicator (.mat-focus-indicator element present on all buttons/anchors)');
});
