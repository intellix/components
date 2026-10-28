import {describe, expect, it} from 'vitest';
import {getRowDefsForData, type RowDefLike} from './row-defs';

describe('getRowDefsForData', () => {
  it('uses the single row def unconditionally, even with a non-matching `when`', () => {
    const lone: RowDefLike<number> = {when: () => false};
    expect(getRowDefsForData(1, 0, [lone], false)).toEqual([lone]);
  });

  it('single-template mode: first matching `when` wins', () => {
    const a: RowDefLike<number> = {when: (_, d) => d > 10};
    const b: RowDefLike<number> = {when: (_, d) => d > 0};
    const fallback: RowDefLike<number> = {};
    expect(getRowDefsForData(5, 0, [a, b, fallback], false)).toEqual([b]);
  });

  it('single-template mode: falls back to the no-`when` default when nothing matches', () => {
    const a: RowDefLike<number> = {when: () => false};
    const fallback: RowDefLike<number> = {};
    expect(getRowDefsForData(5, 0, [a, fallback], false)).toEqual([fallback]);
  });

  it('single-template mode: returns empty when nothing matches and there is no default', () => {
    const a: RowDefLike<number> = {when: () => false};
    const b: RowDefLike<number> = {when: () => false};
    expect(getRowDefsForData(5, 0, [a, b], false)).toEqual([]);
  });

  it('multiTemplateDataRows: every matching (or `when`-less) def is used', () => {
    const a: RowDefLike<number> = {when: (_, d) => d > 0};
    const b: RowDefLike<number> = {when: (_, d) => d > 100};
    const always: RowDefLike<number> = {};
    expect(getRowDefsForData(5, 0, [a, b, always], true)).toEqual([a, always]);
  });

  it('passes index and data through to the `when` predicate', () => {
    const seen: Array<[number, number]> = [];
    const def: RowDefLike<number> = {
      when: (index, data) => {
        seen.push([index, data]);
        return true;
      },
    };
    const fallback: RowDefLike<number> = {};
    getRowDefsForData(42, 7, [def, fallback], false);
    expect(seen).toEqual([[7, 42]]);
  });
});
