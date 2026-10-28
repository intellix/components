import {describe, it, expect} from 'vitest';
import {resolveSelectOptions, type MatSelectEntryDef} from './select-option-resolver';

function idGen() {
  let n = 0;
  return {getId: (prefix: string) => `${prefix}${n++}`};
}

describe('resolveSelectOptions', () => {
  it('flattens plain options in document order with generated ids', () => {
    const options: MatSelectEntryDef[] = [
      {value: 'apple', label: 'Apple', id: 'x'},
      {value: 'banana', label: 'Banana'},
      {value: 'cherry', label: 'Cherry', disabled: true},
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
    // Default content mirrors the label as plain text.
    expect(resolved.flat[0].content).toBe('Apple');
  });

  it('flattens options nested inside groups and ORs in group disabled', () => {
    const options: MatSelectEntryDef[] = [
      {
        label: 'Grass',
        options: [
          {value: 'bulbasaur', label: 'Bulbasaur'},
          {value: 'oddish', label: 'Oddish'},
        ],
      },
      {
        label: 'Fire',
        disabled: true,
        options: [{value: 'charmander', label: 'Charmander'}],
      },
    ];
    const resolved = resolveSelectOptions(options, idGen());
    expect(resolved.groups.map(g => g.label)).toEqual(['Grass', 'Fire']);
    expect(resolved.groups[1].disabled).toBe(true);
    expect(resolved.flat.map(o => o.label)).toEqual(['Bulbasaur', 'Oddish', 'Charmander']);
    expect(resolved.flat[0].groupIndex).toBe(0);
    expect(resolved.flat[2].groupIndex).toBe(1);
    // "Charmander" has no own disabled but its group is disabled.
    expect(resolved.flat[2].ownDisabled).toBe(false);
    expect(resolved.flat[2].disabled).toBe(true);
    expect(resolved.tree).toHaveLength(2);
    expect(resolved.tree[0]).toMatchObject({kind: 'group'});
  });

  it('indexes flat options continuously across mixed bare options and groups', () => {
    const options: MatSelectEntryDef[] = [
      {value: 'a', label: 'A'},
      {label: 'G', options: [{value: 'b', label: 'B'}]},
      {value: 'c', label: 'C'},
    ];
    const resolved = resolveSelectOptions(options, idGen());
    expect(resolved.flat.map(o => o.index)).toEqual([0, 1, 2]);
    expect(resolved.flat.map(o => o.value)).toEqual(['a', 'b', 'c']);
  });

  it('prefers explicit content over the plain-text label', () => {
    const options: MatSelectEntryDef[] = [{value: 'a', label: 'A', content: 'Custom'}];
    const resolved = resolveSelectOptions(options, idGen());
    expect(resolved.flat[0].content).toBe('Custom');
    expect(resolved.flat[0].label).toBe('A');
  });

  it('defaults to an empty array when options is undefined', () => {
    const resolved = resolveSelectOptions(undefined, idGen());
    expect(resolved.flat).toEqual([]);
    expect(resolved.tree).toEqual([]);
    expect(resolved.groups).toEqual([]);
  });
});
