import {describe, it, expect} from 'vitest';
import {
  resolveAutocompleteOptions,
  type MatAutocompleteEntryDef,
} from './autocomplete-option-resolver';

function idGen() {
  let n = 0;
  return {getId: (prefix: string) => `${prefix}${n++}`};
}

describe('resolveAutocompleteOptions', () => {
  it('flattens plain options in document order with generated ids', () => {
    const cache = new Map<string, string>();
    const gen = idGen();
    const options: MatAutocompleteEntryDef[] = [
      {value: 'apple', label: 'Apple', id: 'x'},
      {value: 'banana', label: 'Banana'},
      {value: 'cherry', label: 'Cherry', disabled: true},
    ];
    const resolved = resolveAutocompleteOptions(options, cache, gen);
    expect(resolved.flat.map(o => o.label)).toEqual(['Apple', 'Banana', 'Cherry']);
    expect(resolved.flat.map(o => o.value)).toEqual(['apple', 'banana', 'cherry']);
    expect(resolved.flat[0].id).toBe('x'); // explicit id wins
    expect(resolved.flat[1].id).toBe('mat-option-0'); // generated
    expect(resolved.flat[2].disabled).toBe(true);
    expect(resolved.tree).toHaveLength(3);
    expect(resolved.flat[0].content).toBe('Apple');
  });

  it('flattens options nested inside groups and ORs in group disabled', () => {
    const cache = new Map<string, string>();
    const gen = idGen();
    const options: MatAutocompleteEntryDef[] = [
      {
        label: 'Fruits',
        options: [
          {value: 'apple', label: 'Apple'},
          {value: 'banana', label: 'Banana'},
        ],
      },
      {
        label: 'Vegetables',
        disabled: true,
        options: [{value: 'carrot', label: 'Carrot'}],
      },
    ];
    const resolved = resolveAutocompleteOptions(options, cache, gen);
    expect(resolved.tree.map(n => (n.kind === 'group' ? n.group.label : null))).toEqual([
      'Fruits',
      'Vegetables',
    ]);
    expect(resolved.flat.map(o => o.label)).toEqual(['Apple', 'Banana', 'Carrot']);
    // "Carrot" has no own disabled but its group is disabled.
    expect(resolved.flat[2].disabled).toBe(true);
  });

  it('KEEPS the same id for a value across a refilter that still includes it — the core reason this file exists (see its own doc comment)', () => {
    const cache = new Map<string, string>();
    const gen = idGen();
    const full: MatAutocompleteEntryDef[] = [
      {value: 'Apple', label: 'Apple'},
      {value: 'Banana', label: 'Banana'},
      {value: 'Cherry', label: 'Cherry'},
      {value: 'Date', label: 'Date'},
    ];
    const firstPass = resolveAutocompleteOptions(full, cache, gen);
    const appleId = firstPass.flat[0].id;
    const bananaId = firstPass.flat[1].id;
    const dateId = firstPass.flat[3].id;

    // Simulate typing "a" — Cherry drops out, the rest survive (mirrors
    // basic-filter's own refilter step).
    const filtered = full.filter(o => (o as {label: string}).label.toLowerCase().includes('a'));
    const secondPass = resolveAutocompleteOptions(filtered, cache, gen);

    expect(secondPass.flat.map(o => o.label)).toEqual(['Apple', 'Banana', 'Date']);
    expect(secondPass.flat[0].id).toBe(appleId);
    expect(secondPass.flat[1].id).toBe(bananaId);
    expect(secondPass.flat[2].id).toBe(dateId);
  });

  it('mints a genuinely new id for a value never seen before, without disturbing already-cached ones', () => {
    const cache = new Map<string, string>();
    const gen = idGen();
    const first = resolveAutocompleteOptions([{value: 'Apple', label: 'Apple'}], cache, gen);
    const appleId = first.flat[0].id;

    const second = resolveAutocompleteOptions(
      [
        {value: 'Apple', label: 'Apple'},
        {value: 'Banana', label: 'Banana'},
      ],
      cache,
      gen,
    );
    expect(second.flat[0].id).toBe(appleId);
    expect(second.flat[1].id).not.toBe(appleId);
  });

  it("uses an object value's label as the stability key when value has no useful string form", () => {
    const cache = new Map<string, string>();
    const gen = idGen();
    const mary = {name: 'Mary'};
    const first = resolveAutocompleteOptions([{value: mary, label: 'Mary'}], cache, gen);
    const maryId = first.flat[0].id;

    // A DIFFERENT object reference, same label — still resolves to the
    // cached id (mirrors a fresh array produced by `.filter()`/`.map()`
    // every keystroke, which never preserves the exact object identity
    // Angular's own `MatOption` instance-reuse relies on at the framework
    // level — this port's cache is keyed by LABEL instead, deliberately).
    const second = resolveAutocompleteOptions([{value: {name: 'Mary'}, label: 'Mary'}], cache, gen);
    expect(second.flat[0].id).toBe(maryId);
  });

  it('groups are ALSO id-stable across a refilter', () => {
    const cache = new Map<string, string>();
    const gen = idGen();
    const first = resolveAutocompleteOptions(
      [{label: 'Vegetables', options: [{value: 'Carrot', label: 'Carrot'}]}],
      cache,
      gen,
    );
    const groupId = first.tree[0].kind === 'group' ? first.tree[0].group.id : undefined;

    const second = resolveAutocompleteOptions(
      [
        {
          label: 'Vegetables',
          options: [
            {value: 'Carrot', label: 'Carrot'},
            {value: 'Celery', label: 'Celery'},
          ],
        },
      ],
      cache,
      gen,
    );
    const secondGroupId = second.tree[0].kind === 'group' ? second.tree[0].group.id : undefined;
    expect(secondGroupId).toBe(groupId);
  });

  it('defaults to an empty array when options is undefined', () => {
    const resolved = resolveAutocompleteOptions(undefined, new Map(), idGen());
    expect(resolved.flat).toEqual([]);
    expect(resolved.tree).toEqual([]);
  });
});
