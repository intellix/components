import {describe, it, expect} from 'vitest';
import {MatSnackBarLabel, MatSnackBarActions, MatSnackBarAction} from './mat-snack-bar-content';

describe('MatSnackBarLabel', () => {
  it('is a callable component$', () => {
    expect(typeof MatSnackBarLabel).toBe('function');
  });
});

describe('MatSnackBarActions', () => {
  it('is a callable component$', () => {
    expect(typeof MatSnackBarActions).toBe('function');
  });
});

describe('MatSnackBarAction', () => {
  it('is a callable component$', () => {
    expect(typeof MatSnackBarAction).toBe('function');
  });
});
