import {describe, expect, it} from 'vitest';
import {createDefaultHeaderText, defaultTextColumnDataAccessor} from './text-column-defaults';

describe('createDefaultHeaderText', () => {
  it('uppercases only the first character', () => {
    // Upstream text-column.spec.ts: 'propertyA' -> 'PropertyA'.
    expect(createDefaultHeaderText('propertyA')).toBe('PropertyA');
  });

  it('leaves an already-capitalized name alone', () => {
    expect(createDefaultHeaderText('Position')).toBe('Position');
  });

  it('capitalizes a lowercase single-word name', () => {
    expect(createDefaultHeaderText('position')).toBe('Position');
    expect(createDefaultHeaderText('weight')).toBe('Weight');
  });
});

describe('defaultTextColumnDataAccessor', () => {
  it('reads the named property off the data object', () => {
    expect(defaultTextColumnDataAccessor({position: 1, name: 'Hydrogen'}, 'position')).toBe(1);
    expect(defaultTextColumnDataAccessor({position: 1, name: 'Hydrogen'}, 'name')).toBe('Hydrogen');
  });
});
