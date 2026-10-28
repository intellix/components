import {describe, expect, it, vi} from 'vitest';
import {createListKeyManager, type ListKeyManagerOption} from './list-key-manager';
import {createFocusKeyManager, type FocusableOption} from './focus-key-manager';

interface Item extends ListKeyManagerOption {
  label: string;
  disabled?: boolean;
  getLabel?(): string;
}

function item(label: string, disabled = false): Item {
  return {label, disabled, getLabel: () => label};
}

function press(key: string, extra: Partial<KeyboardEventInit> = {}): KeyboardEvent {
  return new KeyboardEvent('keydown', {key, cancelable: true, ...extra});
}

describe('ListKeyManager', () => {
  it('moves the active item on ArrowDown/ArrowUp, skipping disabled items', () => {
    const items = [item('a'), item('b', true), item('c')];
    const manager = createListKeyManager(items);

    manager.onKeydown(press('ArrowDown'));
    expect(manager.activeItemIndex).toBe(0);

    manager.onKeydown(press('ArrowDown'));
    expect(manager.activeItemIndex).toBe(2); // skips disabled 'b'
  });

  it('does not wrap past the last item by default', () => {
    const items = [item('a'), item('b')];
    const manager = createListKeyManager(items);
    manager.setActiveItem(1);
    manager.onKeydown(press('ArrowDown'));
    expect(manager.activeItemIndex).toBe(1);
  });

  it('wraps around when withWrap() is enabled', () => {
    const items = [item('a'), item('b')];
    const manager = createListKeyManager(items).withWrap();
    manager.setActiveItem(1);
    manager.onKeydown(press('ArrowDown'));
    expect(manager.activeItemIndex).toBe(0);
  });

  it('Home/End jump to the first/last item when enabled', () => {
    const items = [item('a'), item('b'), item('c')];
    const manager = createListKeyManager(items).withHomeAndEnd();
    manager.onKeydown(press('End'));
    expect(manager.activeItemIndex).toBe(2);
    manager.onKeydown(press('Home'));
    expect(manager.activeItemIndex).toBe(0);
  });

  it('fires onChange only when the active item actually changes', () => {
    const items = [item('a'), item('b')];
    const manager = createListKeyManager(items);
    const changes: number[] = [];
    manager.onChange(i => changes.push(i));

    manager.setActiveItem(0);
    manager.setActiveItem(0); // no-op, same item
    manager.setActiveItem(1);

    expect(changes).toEqual([0, 1]);
  });

  it('fires onTabOut on Tab', () => {
    const manager = createListKeyManager([item('a')]);
    const tabOut = vi.fn();
    manager.onTabOut(tabOut);
    manager.onKeydown(press('Tab'));
    expect(tabOut).toHaveBeenCalledTimes(1);
  });

  it('selects an item via typeahead after the debounce interval', async () => {
    vi.useFakeTimers();
    try {
      const items = [item('Apple'), item('Banana'), item('Cherry')];
      const manager = createListKeyManager(items).withTypeAhead(50);

      manager.onKeydown(press('B', {keyCode: 66}));
      expect(manager.activeItemIndex).toBe(-1); // not yet, still debouncing

      vi.advanceTimersByTime(60);
      expect(manager.activeItemIndex).toBe(1); // 'Banana'
    } finally {
      vi.useRealTimers();
    }
  });
});

describe('FocusKeyManager', () => {
  function focusableItem(label: string, disabled = false): Item & FocusableOption {
    return {
      label,
      disabled,
      getLabel: () => label,
      focus: vi.fn(),
    };
  }

  it('calls .focus(origin) on the newly active item', () => {
    const items = [focusableItem('a'), focusableItem('b')];
    const manager = createFocusKeyManager(items).setFocusOrigin('keyboard');

    manager.setActiveItem(1);

    expect(items[1].focus).toHaveBeenCalledWith('keyboard');
  });

  it('calls .focus() for arrow-key-driven activation too', () => {
    const items = [focusableItem('a'), focusableItem('b')];
    const manager = createFocusKeyManager(items).withWrap().setFocusOrigin('mouse');

    manager.onKeydown(press('ArrowDown'));

    expect(items[0].focus).toHaveBeenCalledWith('mouse');
  });

  it('focuses the item selected via typeahead', async () => {
    vi.useFakeTimers();
    try {
      const items = [focusableItem('Apple'), focusableItem('Banana')];
      const manager = createFocusKeyManager(items).withTypeAhead(10).setFocusOrigin('program');

      manager.onKeydown(press('B', {keyCode: 66}));
      vi.advanceTimersByTime(20);

      expect(items[1].focus).toHaveBeenCalledWith('program');
    } finally {
      vi.useRealTimers();
    }
  });
});
