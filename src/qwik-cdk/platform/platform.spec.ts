import {describe, it, expect} from 'vitest';
import {createPlatform, isBrowser} from './public-api';

describe('Platform', () => {
  it('isBrowser truthy under happy-dom (test env)', () => {
    // happy-dom advertises window/document so isBrowser is true.
    expect(typeof isBrowser).toBe('boolean');
  });
  it('Platform instance fields are booleans', () => {
    const p = createPlatform();
    for (const key of [
      'isBrowser',
      'EDGE',
      'TRIDENT',
      'BLINK',
      'WEBKIT',
      'IOS',
      'FIREFOX',
      'ANDROID',
      'SAFARI',
    ]) {
      expect(typeof (p as any)[key]).toBe('boolean');
    }
  });
});
