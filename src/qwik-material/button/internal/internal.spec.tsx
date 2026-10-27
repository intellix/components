import {describe, it, expect} from 'vitest';
import {PersistentRipple} from './persistent-ripple';
import {FocusIndicator} from './focus-indicator';
import {TouchTarget} from './touch-target';
import {RIPPLE_UNINITIALIZED_ATTR, rippleLoaderHostAttrs, useRippleLoader} from './ripple-loader';

describe('button internal helpers (module-import smoke)', () => {
  it('PersistentRipple, FocusIndicator, TouchTarget are all defined', () => {
    expect(PersistentRipple).toBeDefined();
    expect(FocusIndicator).toBeDefined();
    expect(TouchTarget).toBeDefined();
  });

  it('useRippleLoader is a function', () => {
    expect(typeof useRippleLoader).toBe('function');
  });

  it('RIPPLE_UNINITIALIZED_ATTR is the upstream attribute name', () => {
    expect(RIPPLE_UNINITIALIZED_ATTR).toBe('mat-ripple-loader-uninitialized');
  });
});

describe('rippleLoaderHostAttrs — mirrors MatRippleLoader.configureRipple()', () => {
  it('always sets the class-name attr', () => {
    expect(rippleLoaderHostAttrs({className: 'mat-mdc-button-ripple'})).toEqual({
      'mat-ripple-loader-class-name': 'mat-mdc-button-ripple',
    });
  });

  it('never includes the uninitialized attr — callers render it as their own literal JSX attribute (see ripple-loader.ts doc comment: a spread prop whose value becomes `undefined` on resume does not reliably remove the DOM attribute)', () => {
    const attrs = rippleLoaderHostAttrs({className: 'mat-mdc-button-ripple'});
    expect(RIPPLE_UNINITIALIZED_ATTR in attrs).toBe(false);
  });

  it('adds mat-ripple-loader-centered only when centered is requested (MatIconButton)', () => {
    const attrs = rippleLoaderHostAttrs({className: 'mat-mdc-button-ripple', centered: true});
    expect(attrs['mat-ripple-loader-centered']).toBe('');
  });

  it('omits mat-ripple-loader-centered for plain buttons/FABs', () => {
    const attrs = rippleLoaderHostAttrs({className: 'mat-mdc-button-ripple'});
    expect(attrs['mat-ripple-loader-centered']).toBeUndefined();
  });

  it('adds mat-ripple-loader-disabled only when disabled (disableRipple || disabled)', () => {
    const attrs = rippleLoaderHostAttrs({className: 'mat-mdc-button-ripple', disabled: true});
    expect(attrs['mat-ripple-loader-disabled']).toBe('');
  });

  it('omits mat-ripple-loader-disabled when not disabled', () => {
    const attrs = rippleLoaderHostAttrs({className: 'mat-mdc-button-ripple', disabled: false});
    expect(attrs['mat-ripple-loader-disabled']).toBeUndefined();
  });
});
