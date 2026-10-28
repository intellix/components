import {describe, expect, it} from 'vitest';
import {cdkColumnClass, cssClassFriendlyName, matColumnClass} from './column-css';

describe('cssClassFriendlyName', () => {
  it('leaves an already-safe name untouched', () => {
    expect(cssClassFriendlyName('position')).toBe('position');
  });

  it('replaces each disallowed character with its own literal dash (no collapsing)', () => {
    // Upstream's own table.spec.ts assertion (src/cdk/table/table.spec.ts).
    expect(cssClassFriendlyName('crazy-column-NAME-1!@#$%^-_&*()2')).toBe(
      'crazy-column-NAME-1-------_----2',
    );
  });

  it('is case-insensitive for the allowed-character check', () => {
    expect(cssClassFriendlyName('ABCxyz_0-9')).toBe('ABCxyz_0-9');
  });

  it('survives hyphenated names verbatim', () => {
    expect(cssClassFriendlyName('basic-info')).toBe('basic-info');
  });
});

describe('cdkColumnClass / matColumnClass', () => {
  it('prefixes the friendly name', () => {
    expect(cdkColumnClass('position')).toBe('cdk-column-position');
    expect(matColumnClass('position')).toBe('mat-column-position');
  });

  it('prefixes a hyphenated column name verbatim', () => {
    expect(cdkColumnClass('basic-info')).toBe('cdk-column-basic-info');
    expect(matColumnClass('measurement-info')).toBe('mat-column-measurement-info');
  });
});
