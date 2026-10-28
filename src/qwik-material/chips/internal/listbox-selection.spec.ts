import {describe, it, expect} from 'vitest';
import {MAT_CHIP_LISTBOX_SELECTION, type MatChipListboxSelectionState} from './listbox-selection';

describe('MAT_CHIP_LISTBOX_SELECTION', () => {
  it('has the expected context id string', () => {
    expect(MAT_CHIP_LISTBOX_SELECTION.id).toBe('qwik-material/chip-listbox-selection');
  });

  it('MatChipListboxSelectionState accepts a single-select shape', () => {
    const state: MatChipListboxSelectionState = {multiple: false, value: 'a', values: []};
    expect(state.multiple).toBe(false);
    expect(state.value).toBe('a');
    expect(state.values).toEqual([]);
  });

  it('MatChipListboxSelectionState accepts a multi-select shape', () => {
    const state: MatChipListboxSelectionState = {
      multiple: true,
      value: undefined,
      values: ['a', 'b'],
    };
    expect(state.multiple).toBe(true);
    expect(state.value).toBeUndefined();
    expect(state.values).toEqual(['a', 'b']);
  });
});
