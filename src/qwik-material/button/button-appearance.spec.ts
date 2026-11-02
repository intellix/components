import {describe, it, expect} from 'vitest';
import {
  APPEARANCE_CLASSES,
  type MatButtonAppearance,
  type MatButtonColor,
} from './button-appearance';

describe('button-appearance', () => {
  it('APPEARANCE_CLASSES covers every documented MatButtonAppearance', () => {
    const keys: MatButtonAppearance[] = ['text', 'filled', 'elevated', 'outlined', 'tonal'];
    for (const k of keys) {
      expect(APPEARANCE_CLASSES[k]).toBeDefined();
      expect(APPEARANCE_CLASSES[k].length).toBeGreaterThan(0);
    }
  });

  it('text appearance emits mat-mdc-button', () => {
    expect(APPEARANCE_CLASSES.text).toEqual(['mat-mdc-button']);
  });

  it('filled appearance emits mdc-button--unelevated + mat-mdc-unelevated-button', () => {
    expect(APPEARANCE_CLASSES.filled).toEqual([
      'mdc-button--unelevated',
      'mat-mdc-unelevated-button',
    ]);
  });

  it('elevated appearance emits mdc-button--raised + mat-mdc-raised-button', () => {
    expect(APPEARANCE_CLASSES.elevated).toEqual(['mdc-button--raised', 'mat-mdc-raised-button']);
  });

  it('outlined appearance emits mdc-button--outlined + mat-mdc-outlined-button', () => {
    expect(APPEARANCE_CLASSES.outlined).toEqual([
      'mdc-button--outlined',
      'mat-mdc-outlined-button',
    ]);
  });

  it('tonal appearance emits mat-tonal-button (Mat-specific, no MDC counterpart)', () => {
    expect(APPEARANCE_CLASSES.tonal).toEqual(['mat-tonal-button']);
  });

  it('MatButtonColor accepts the three documented palette values', () => {
    const colors: MatButtonColor[] = ['primary', 'accent', 'warn'];
    expect(colors).toHaveLength(3);
  });
});
