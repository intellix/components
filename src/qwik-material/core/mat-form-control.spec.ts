import {describe, expect, it} from 'vitest';
import {
  matControlHasError,
  matControlHasValidator,
  matControlInvalid,
  matControlValid,
  matEmailValidator,
  matRequiredValidator,
  matValidationErrors,
} from './mat-form-control';

// `useMatFormControl()` itself is a thin `useStore()` wrapper that can only
// be exercised inside a real Qwik component render — this project's vitest
// environment hangs on `createDOM()` (see button/mat-button-scenarios.spec.tsx's
// own comment for the same constraint) — so its behavior is covered by the
// `error-state` Angular parity scenario + any Qwik-only Playwright specs
// instead. The VALIDATION LOGIC below is all plain, synchronous, pure
// functions with no Qwik dependency at all (deliberately — see
// mat-form-control.ts's module doc comment for why), so it is fully
// unit-tested here.

describe('matRequiredValidator', () => {
  it('fails on empty string', () => {
    expect(matRequiredValidator('')).toEqual({required: true});
  });

  it('fails on null/undefined', () => {
    expect(matRequiredValidator(null as unknown as string)).toEqual({required: true});
    expect(matRequiredValidator(undefined as unknown as string)).toEqual({required: true});
  });

  it('passes on any non-empty string', () => {
    expect(matRequiredValidator('a')).toBeNull();
    expect(matRequiredValidator('0')).toBeNull();
    expect(matRequiredValidator(' ')).toBeNull();
  });
});

describe('matEmailValidator', () => {
  it('passes on empty string (required is a separate validator)', () => {
    expect(matEmailValidator('')).toBeNull();
  });

  it('fails on a non-email string', () => {
    expect(matEmailValidator('abc')).toEqual({email: true});
  });

  it('passes on a well-formed email', () => {
    expect(matEmailValidator('pat@example.com')).toBeNull();
  });
});

describe('matValidationErrors', () => {
  it('returns null when every validator passes', () => {
    expect(
      matValidationErrors('pat@example.com', [matRequiredValidator, matEmailValidator]),
    ).toBeNull();
  });

  it('returns the merged errors of every failing validator', () => {
    expect(matValidationErrors('', [matRequiredValidator, matEmailValidator])).toEqual({
      required: true,
    });
  });

  it('merges multiple simultaneous failures into one object', () => {
    // A custom validator alongside email, both failing on the same value —
    // confirms the merge (not "first failure wins") behavior.
    const alwaysFails = () => ({custom: true}) as const;
    expect(matValidationErrors('abc', [matEmailValidator, alwaysFails])).toEqual({
      email: true,
      custom: true,
    });
  });

  it('returns null for an empty validators list', () => {
    expect(matValidationErrors('anything', [])).toBeNull();
  });
});

describe('matControlValid / matControlInvalid', () => {
  it('reflects the composed validators against the control value', () => {
    const emptyRequired = {value: ''};
    const filledRequired = {value: 'Jane Doe'};
    expect(matControlValid(emptyRequired, [matRequiredValidator])).toBe(false);
    expect(matControlInvalid(emptyRequired, [matRequiredValidator])).toBe(true);
    expect(matControlValid(filledRequired, [matRequiredValidator])).toBe(true);
    expect(matControlInvalid(filledRequired, [matRequiredValidator])).toBe(false);
  });
});

describe('matControlHasError', () => {
  it('finds a specific error key', () => {
    const control = {value: 'abc'};
    const validators = [matRequiredValidator, matEmailValidator];
    expect(matControlHasError(control, validators, 'email')).toBe(true);
    expect(matControlHasError(control, validators, 'required')).toBe(false);
  });

  it('is false when the control is valid', () => {
    const control = {value: 'pat@example.com'};
    const validators = [matRequiredValidator, matEmailValidator];
    expect(matControlHasError(control, validators, 'required')).toBe(false);
    expect(matControlHasError(control, validators, 'email')).toBe(false);
  });
});

describe('matControlHasValidator', () => {
  it('checks reference identity against the validators list', () => {
    expect(matControlHasValidator([matRequiredValidator], matRequiredValidator)).toBe(true);
    expect(matControlHasValidator([matRequiredValidator], matEmailValidator)).toBe(false);
  });
});
