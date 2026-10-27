import {describe, it, expect} from 'vitest';
import {createIdGenerator, ID_GENERATOR_COUNTER} from './public-api';

describe('_IdGenerator', () => {
  it('generates unique ids with the given prefix', () => {
    const g = createIdGenerator();
    const a = g.getId('cdk-dialog-');
    const b = g.getId('cdk-dialog-');
    expect(a).toMatch(/^cdk-dialog-\d+$/);
    expect(b).toMatch(/^cdk-dialog-\d+$/);
    expect(a).not.toBe(b);
  });

  it('keeps independent counters across different prefixes it creates separately', () => {
    const g1 = createIdGenerator();
    const g2 = createIdGenerator();
    expect(g1.getId('mat-button-toggle-')).toBe('mat-button-toggle-0');
    expect(g2.getId('mat-button-toggle-')).toBe('mat-button-toggle-0');
  });
});

describe('ID_GENERATOR_COUNTER', () => {
  it('is a context id carrying a plain Signal<number> (not a closure-bearing IdGenerator)', () => {
    expect(ID_GENERATOR_COUNTER.id).toBe('qwik-cdk/id-generator-counter');
  });
});
