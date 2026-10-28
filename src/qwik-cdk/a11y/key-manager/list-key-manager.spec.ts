import {describe, it, expect, vi} from 'vitest';
import {createListKeyManager, type ListKeyManagerItem} from './list-key-manager';
import {DOWN_ARROW, END, HOME, TAB, UP_ARROW} from '../../keycodes';

interface Item extends ListKeyManagerItem {
  label: string;
}

function item(label: string, disabled = false): Item {
  return {label, disabled, getLabel: () => label};
}

function keyEvent(keyCode: number, key = ''): KeyboardEvent {
  return {
    keyCode,
    key,
    altKey: false,
    ctrlKey: false,
    metaKey: false,
    shiftKey: false,
    preventDefault: vi.fn(),
  } as unknown as KeyboardEvent;
}

describe('createListKeyManager', () => {
  it('starts with no active item', () => {
    const manager = createListKeyManager([item('a'), item('b')]);
    expect(manager.activeItemIndex).toBeNull();
    expect(manager.activeItem).toBeNull();
  });

  it('setFirstItemActive / setLastItemActive skip disabled items', () => {
    const items = [item('a', true), item('b'), item('c', true), item('d')];
    const manager = createListKeyManager(items);
    manager.setFirstItemActive();
    expect(manager.activeItemIndex).toBe(1); // 'b', since 'a' is disabled
    manager.setLastItemActive();
    expect(manager.activeItemIndex).toBe(3); // 'd', since 'c' is disabled
  });

  it('ArrowDown/ArrowUp move the active item, skipping disabled ones', () => {
    const items = [item('a'), item('b'), item('c', true), item('d')];
    const manager = createListKeyManager(items).withVerticalOrientation();
    manager.onKeydown(keyEvent(DOWN_ARROW));
    expect(manager.activeItemIndex).toBe(0);
    manager.onKeydown(keyEvent(DOWN_ARROW));
    expect(manager.activeItemIndex).toBe(1);
    manager.onKeydown(keyEvent(DOWN_ARROW)); // skips disabled 'c'
    expect(manager.activeItemIndex).toBe(3);
    manager.onKeydown(keyEvent(UP_ARROW));
    expect(manager.activeItemIndex).toBe(1); // back over disabled 'c'
  });

  it('Home/End jump to the first/last enabled item when enabled', () => {
    const items = [item('a'), item('b'), item('c')];
    const manager = createListKeyManager(items).withHomeAndEnd();
    manager.setActiveItem(1);
    manager.onKeydown(keyEvent(HOME));
    expect(manager.activeItemIndex).toBe(0);
    manager.onKeydown(keyEvent(END));
    expect(manager.activeItemIndex).toBe(2);
  });

  it('Home/End are no-ops when not enabled', () => {
    const items = [item('a'), item('b'), item('c')];
    const manager = createListKeyManager(items);
    manager.setActiveItem(1);
    manager.onKeydown(keyEvent(HOME));
    expect(manager.activeItemIndex).toBe(1);
  });

  it('Tab calls onTabOut and does not change the active item', () => {
    const items = [item('a'), item('b')];
    const manager = createListKeyManager(items);
    manager.setActiveItem(0);
    const onTabOut = vi.fn();
    manager.onTabOut = onTabOut;
    manager.onKeydown(keyEvent(TAB));
    expect(onTabOut).toHaveBeenCalledTimes(1);
    expect(manager.activeItemIndex).toBe(0);
  });

  it('skipPredicate overrides the default disabled-skip behavior', () => {
    const items = [item('a'), item('b'), item('c')];
    const manager = createListKeyManager(items).skipPredicate(it => it.label === 'b');
    manager.onKeydown(keyEvent(DOWN_ARROW));
    expect(manager.activeItemIndex).toBe(0);
    manager.onKeydown(keyEvent(DOWN_ARROW));
    expect(manager.activeItemIndex).toBe(2); // skips 'b' per the custom predicate
  });

  it('onChange fires only when the active item actually changes', () => {
    const items = [item('a'), item('b')];
    const manager = createListKeyManager(items);
    const onChange = vi.fn();
    manager.onChange = onChange;
    manager.setActiveItem(0);
    expect(onChange).toHaveBeenCalledTimes(1);
    manager.setActiveItem(0);
    expect(onChange).toHaveBeenCalledTimes(1); // unchanged — no second call
    manager.setActiveItem(1);
    expect(onChange).toHaveBeenCalledTimes(2);
  });

  it('typeahead selects the first item whose label starts with the typed letters, after a debounce', async () => {
    vi.useFakeTimers();
    const items = [item('Apple'), item('Banana'), item('Cherry')];
    const manager = createListKeyManager(items).withTypeAhead(200);
    manager.onKeydown(keyEvent(66, 'b')); // 'b' -> Banana
    expect(manager.activeItemIndex).toBeNull(); // not yet — still debouncing
    vi.advanceTimersByTime(200);
    expect(manager.activeItemIndex).toBe(1);
    vi.useRealTimers();
  });

  it('isTyping reflects whether a typeahead sequence is in progress', () => {
    vi.useFakeTimers();
    const items = [item('Apple'), item('Banana')];
    const manager = createListKeyManager(items).withTypeAhead(200);
    expect(manager.isTyping()).toBe(false);
    manager.onKeydown(keyEvent(65, 'a'));
    expect(manager.isTyping()).toBe(true);
    vi.advanceTimersByTime(200);
    expect(manager.isTyping()).toBe(false);
    vi.useRealTimers();
  });

  it('createActiveDescendantKeyManager behaves identically (documented alias)', async () => {
    const {createActiveDescendantKeyManager} = await import('./list-key-manager');
    const manager = createActiveDescendantKeyManager([item('a'), item('b')]);
    manager.setActiveItem(1);
    expect(manager.activeItemIndex).toBe(1);
  });
});
