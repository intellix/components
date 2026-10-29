import {describe, it, expect} from 'vitest';
import {rippleLoaderHostAttrs, RIPPLE_UNINITIALIZED_ATTR} from './ripple-loader';

describe('rippleLoaderHostAttrs', () => {
  it('always sets the class-name attr from config.className', () => {
    expect(rippleLoaderHostAttrs({className: 'mat-mdc-chip-ripple'})).toEqual({
      'mat-ripple-loader-class-name': 'mat-mdc-chip-ripple',
    });
  });

  it('omits the centered attr when not requested', () => {
    const attrs = rippleLoaderHostAttrs({className: 'x'});
    expect(attrs['mat-ripple-loader-centered']).toBeUndefined();
  });

  it('sets an empty-string centered attr when requested', () => {
    const attrs = rippleLoaderHostAttrs({className: 'x', centered: true});
    expect(attrs['mat-ripple-loader-centered']).toBe('');
  });

  it('never includes the uninitialized attr (callers render it separately, reactively)', () => {
    const attrs = rippleLoaderHostAttrs({className: 'x', centered: true});
    expect(attrs[RIPPLE_UNINITIALIZED_ATTR]).toBeUndefined();
  });
});
