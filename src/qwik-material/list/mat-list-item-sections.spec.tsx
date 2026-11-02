import {describe, it, expect} from 'vitest';
import {
  MatListItemAvatar,
  MatListItemIcon,
  MatListItemTitle,
  MatListItemLine,
  MatListItemMeta,
} from './mat-list-item-sections';

describe('MatListItem slot components (smoke)', () => {
  it('MatListItemAvatar is exported and is a function-shaped component', () => {
    expect(MatListItemAvatar).toBeDefined();
    expect(typeof MatListItemAvatar).toBe('function');
  });

  it('MatListItemIcon is exported and is a function-shaped component', () => {
    expect(MatListItemIcon).toBeDefined();
    expect(typeof MatListItemIcon).toBe('function');
  });

  it('MatListItemTitle is exported and is a function-shaped component', () => {
    expect(MatListItemTitle).toBeDefined();
    expect(typeof MatListItemTitle).toBe('function');
  });

  it('MatListItemLine is exported and is a function-shaped component', () => {
    expect(MatListItemLine).toBeDefined();
    expect(typeof MatListItemLine).toBe('function');
  });

  it('MatListItemMeta is exported and is a function-shaped component', () => {
    expect(MatListItemMeta).toBeDefined();
    expect(typeof MatListItemMeta).toBe('function');
  });
});
