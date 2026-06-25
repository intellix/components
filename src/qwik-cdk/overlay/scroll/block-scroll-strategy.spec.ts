import {describe, it, expect, beforeEach, afterEach} from 'vitest';
import {BlockScrollStrategy} from '../public-api';

describe('BlockScrollStrategy', () => {
  let s: BlockScrollStrategy;
  beforeEach(() => {
    s = new BlockScrollStrategy();
    s.attach({} as any);
  });
  afterEach(() => {
    s.disable();
  });
  it('sets position:fixed on <html> when enabled', () => {
    s.enable();
    expect(document.documentElement.classList.contains('cdk-global-scrollblock')).toBe(true);
  });
});
