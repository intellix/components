import {describe, it, expect} from 'vitest';
import {MatOption} from '../core/mat-option';
import {MatOptgroup} from '../core/mat-optgroup';
import {resolveSelectOptions, extractOptionText} from './select-option-resolver';

function idGen() {
  let n = 0;
  return {getId: (prefix: string) => `${prefix}${n++}`};
}

describe('extractOptionText', () => {
  it('reads a plain string child', () => {
    expect(extractOptionText('Apple')).toBe('Apple');
  });
  it('reads a numeric child', () => {
    expect(extractOptionText(42)).toBe('42');
  });
  it('joins an array of strings', () => {
    expect(extractOptionText(['Hello ', 'World'])).toBe('Hello World');
  });
  it('returns empty for null/undefined/boolean', () => {
    expect(extractOptionText(null)).toBe('');
    expect(extractOptionText(undefined)).toBe('');
    expect(extractOptionText(true)).toBe('');
  });
});

describe('resolveSelectOptions', () => {
  it('flattens plain options in document order with generated ids', () => {
    const options = [
      <MatOption value="apple" id="x">
        Apple
      </MatOption>,
      <MatOption value="banana">Banana</MatOption>,
      <MatOption value="cherry" disabled>
        Cherry
      </MatOption>,
    ];
    const resolved = resolveSelectOptions(options, idGen());
    expect(resolved.flat.map(o => o.label)).toEqual(['Apple', 'Banana', 'Cherry']);
    expect(resolved.flat.map(o => o.value)).toEqual(['apple', 'banana', 'cherry']);
    expect(resolved.flat[0].id).toBe('x'); // explicit id wins
    expect(resolved.flat[1].id).toBe('mat-option-0'); // generated, skipping the explicit one
    expect(resolved.flat[2].disabled).toBe(true);
    expect(resolved.flat[2].ownDisabled).toBe(true);
    expect(resolved.tree).toHaveLength(3);
    expect(resolved.groups).toHaveLength(0);
  });

  it('flattens options nested inside optgroups and ORs in group disabled', () => {
    const options = [
      <MatOptgroup label="Grass">
        {[<MatOption value="bulbasaur">Bulbasaur</MatOption>, <MatOption value="oddish">Oddish</MatOption>]}
      </MatOptgroup>,
      <MatOptgroup label="Fire" disabled>
        {[<MatOption value="charmander">Charmander</MatOption>]}
      </MatOptgroup>,
    ];
    const resolved = resolveSelectOptions(options, idGen());
    expect(resolved.groups.map(g => g.label)).toEqual(['Grass', 'Fire']);
    expect(resolved.groups[1].disabled).toBe(true);
    expect(resolved.flat.map(o => o.label)).toEqual(['Bulbasaur', 'Oddish', 'Charmander']);
    expect(resolved.flat[0].groupIndex).toBe(0);
    expect(resolved.flat[2].groupIndex).toBe(1);
    // "Charmander" has no own [disabled] but its group is disabled.
    expect(resolved.flat[2].ownDisabled).toBe(false);
    expect(resolved.flat[2].disabled).toBe(true);
    expect(resolved.tree).toHaveLength(2);
    expect(resolved.tree[0]).toMatchObject({kind: 'group'});
  });

  it('indexes flat options continuously across mixed bare options and groups', () => {
    const options = [
      <MatOption value="a">A</MatOption>,
      <MatOptgroup label="G">{[<MatOption value="b">B</MatOption>]}</MatOptgroup>,
      <MatOption value="c">C</MatOption>,
    ];
    const resolved = resolveSelectOptions(options, idGen());
    expect(resolved.flat.map(o => o.index)).toEqual([0, 1, 2]);
    expect(resolved.flat.map(o => o.value)).toEqual(['a', 'b', 'c']);
  });
});
