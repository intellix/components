import {describe, it, expect} from 'vitest';
import {PersistentRipple} from './persistent-ripple';
import {FocusIndicator} from './focus-indicator';
import {TouchTarget} from './touch-target';
import {rippleLoaderHostAttrs, useRippleLoader} from './ripple-loader';

describe('button internal helpers (module-import smoke)', () => {
  it('PersistentRipple, FocusIndicator, TouchTarget are all defined', () => {
    expect(PersistentRipple).toBeDefined();
    expect(FocusIndicator).toBeDefined();
    expect(TouchTarget).toBeDefined();
  });

  it('useRippleLoader is a function', () => {
    expect(typeof useRippleLoader).toBe('function');
  });
});

describe('rippleLoaderHostAttrs — mirrors MatRippleLoader.configureRipple()', () => {
  it('always sets the uninitialized + class-name attrs', () => {
    expect(rippleLoaderHostAttrs({className: 'mat-mdc-button-ripple'})).toEqual({
      'mat-ripple-loader-uninitialized': '',
      'mat-ripple-loader-class-name': 'mat-mdc-button-ripple',
    });
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
