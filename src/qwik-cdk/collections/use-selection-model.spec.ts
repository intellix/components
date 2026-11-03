/**
 * `useSelectionModel()` itself calls `useSignal()`, which throws outside of a component's
 * render (`createDOM()` isn't reliable in this package's vitest environment — see
 * `qwik-cdk/accordion/accordion-hooks.spec.ts`'s identical note), so it only gets a
 * shape/export sanity check here. The mutator functions below (`selectValue`, etc.) are
 * PLAIN functions — no Qwik hooks involved — so they're fully unit-testable against a fake
 * `Signal`-shaped object (`{value: T[]}`, exactly what every consumer's real `Signal` is at
 * the `.value` read/write contract this code actually relies on).
 */
import {describe, expect, it} from 'vitest';
import type {Signal} from '@qwik.dev/core';
import {
  clearSelection,
  deselectValue,
  selectValue,
  setSelectionValues,
  toggleSelectionValue,
  useSelectionModel,
} from './use-selection-model';

function fakeSignal<T>(initial: T): Signal<T> {
  return {value: initial} as Signal<T>;
}

describe('qwik-cdk/collections hook surface — sanity', () => {
  it('useSelectionModel is exported and function-shaped', () => {
    expect(typeof useSelectionModel).toBe('function');
  });
});

describe('selectValue', () => {
  it('selects into an empty single-selection signal', () => {
    const selected = fakeSignal<number[]>([]);
    const changed = selectValue(selected, {}, 1);
    expect(changed).toBe(true);
    expect(selected.value).toEqual([1]);
  });

  it('replaces the previous value in single-selection mode', () => {
    const selected = fakeSignal<number[]>([1]);
    selectValue(selected, {}, 2);
    expect(selected.value).toEqual([2]);
  });

  it('accumulates in multiple-selection mode', () => {
    const selected = fakeSignal<number[]>([1]);
    selectValue(selected, {multiple: true}, 2);
    expect(selected.value).toEqual([1, 2]);
  });
});

describe('deselectValue', () => {
  it('removes a selected value', () => {
    const selected = fakeSignal<number[]>([1, 2]);
    const changed = deselectValue(selected, {multiple: true}, 1);
    expect(changed).toBe(true);
    expect(selected.value).toEqual([2]);
  });

  it('is a no-op (returns false) for a value that is not selected', () => {
    const selected = fakeSignal<number[]>([1]);
    const changed = deselectValue(selected, {}, 2);
    expect(changed).toBe(false);
    expect(selected.value).toEqual([1]);
  });
});

describe('toggleSelectionValue', () => {
  it('selects when not selected, deselects when selected', () => {
    const selected = fakeSignal<number[]>([]);
    toggleSelectionValue(selected, 1);
    expect(selected.value).toEqual([1]);
    toggleSelectionValue(selected, 1);
    expect(selected.value).toEqual([]);
  });
});

describe('setSelectionValues', () => {
  it('replaces the whole selection', () => {
    const selected = fakeSignal<number[]>([1, 2]);
    setSelectionValues(selected, {multiple: true}, 3, 4);
    expect(selected.value).toEqual([3, 4]);
  });

  it('respects compareWith when replacing', () => {
    type Item = {id: number};
    const selected = fakeSignal<Item[]>([{id: 1}]);
    const compareWith = (a: Item, b: Item) => a.id === b.id;
    setSelectionValues(selected, {compareWith}, {id: 1});
    expect(selected.value).toEqual([{id: 1}]);
  });
});

describe('clearSelection', () => {
  it('empties the selection and reports whether anything changed', () => {
    const selected = fakeSignal<number[]>([1, 2]);
    expect(clearSelection(selected, {multiple: true})).toBe(true);
    expect(selected.value).toEqual([]);
    expect(clearSelection(selected, {multiple: true})).toBe(false);
  });
});
