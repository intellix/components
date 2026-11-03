import {describe, it, expect} from 'vitest';
import {
  MAT_ERROR_STATE_MATCHER,
  MAT_ERROR_STATE_MATCHER_DEFAULT,
  resolveErrorStateSync,
  type MatErrorStateSnapshot,
} from './error-state-matcher';

const base: MatErrorStateSnapshot = {
  invalid: false,
  touched: false,
  dirty: false,
  submitted: false,
};

describe('MAT_ERROR_STATE_MATCHER context id + default', () => {
  it('carries the expected, stable context id', () => {
    expect(MAT_ERROR_STATE_MATCHER.id).toBe('qwik-material/error-state-matcher');
  });

  it('defaults to upstream ErrorStateMatcher (not ShowOnDirtyErrorStateMatcher)', () => {
    expect(MAT_ERROR_STATE_MATCHER_DEFAULT).toBe('touched');
  });
});

describe("resolveErrorStateSync — 'touched' mode (upstream default ErrorStateMatcher)", () => {
  it('is false when valid, regardless of touched/dirty/submitted', () => {
    expect(resolveErrorStateSync({...base, touched: true, dirty: true, submitted: true}, 'touched')).toBe(
      false,
    );
  });

  it('is false when invalid but neither touched nor submitted (pristine, untouched)', () => {
    expect(resolveErrorStateSync({...base, invalid: true}, 'touched')).toBe(false);
  });

  it('is true when invalid and touched, even if not dirty', () => {
    expect(resolveErrorStateSync({...base, invalid: true, touched: true}, 'touched')).toBe(true);
  });

  it('is true when invalid and submitted, even if untouched', () => {
    expect(resolveErrorStateSync({...base, invalid: true, submitted: true}, 'touched')).toBe(true);
  });

  it('is false when invalid and merely dirty (not touched, not submitted) — the whole point of the "dirty" mode existing separately', () => {
    expect(resolveErrorStateSync({...base, invalid: true, dirty: true}, 'touched')).toBe(false);
  });
});

describe("resolveErrorStateSync — 'dirty' mode (upstream ShowOnDirtyErrorStateMatcher)", () => {
  it('is false when valid, regardless of touched/dirty/submitted', () => {
    expect(resolveErrorStateSync({...base, touched: true, dirty: true, submitted: true}, 'dirty')).toBe(
      false,
    );
  });

  it('is true when invalid and dirty, even if never touched', () => {
    expect(resolveErrorStateSync({...base, invalid: true, dirty: true}, 'dirty')).toBe(true);
  });

  it('is true when invalid and submitted, even if never dirty', () => {
    expect(resolveErrorStateSync({...base, invalid: true, submitted: true}, 'dirty')).toBe(true);
  });

  it('is false when invalid and merely touched (not dirty, not submitted)', () => {
    expect(resolveErrorStateSync({...base, invalid: true, touched: true}, 'dirty')).toBe(false);
  });
});
