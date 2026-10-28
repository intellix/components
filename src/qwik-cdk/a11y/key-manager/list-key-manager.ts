/**
 * Qwik port of `src/cdk/a11y/key-manager/list-key-manager.ts`.
 *
 * Deviations from upstream:
 * - A factory function (`createListKeyManager`) returning a plain object,
 *   not a class — matches this package's existing convention
 *   (`createFocusMonitor`, `createOverlayService`, …).
 * - `tabOut`/`change` are plain callback-subscription lists (`onTabOut`/
 *   `onChange`, each returning an unsubscribe function), not RxJS `Subject`s
 *   — qwik-cdk has no RxJS dependency.
 * - `items` is always a plain array snapshot (`setItems()` to update it) —
 *   no `QueryList`/Angular `Signal` support, since there's no Qwik
 *   equivalent of a live content query. A caller that needs reactivity
 *   re-renders the manager against fresh items itself (see
 *   `qwik-material/menu`'s `MenuPanel` for the pattern: items are static for
 *   the lifetime of one open menu instance).
 * - No `EffectRef`/`Injector` plumbing (follows from the point above).
 *
 * Otherwise the keyboard-handling and active-item algorithms
 * (`setActiveItem`, `setNextItemActive`, wrap mode, skip-disabled, Home/End,
 * Page Up/Down, typeahead) are faithful ports.
 */
import {
  DOWN_ARROW,
  END,
  HOME,
  LEFT_ARROW,
  PAGE_DOWN,
  PAGE_UP,
  RIGHT_ARROW,
  TAB,
  UP_ARROW,
  hasModifierKey,
} from '../../keycodes';
import {createTypeahead, type Typeahead} from './typeahead';

/** This interface is for items that can be passed to a ListKeyManager. */
export interface ListKeyManagerOption {
  /** Whether the option is disabled. */
  disabled?: boolean;
  /** Gets the label for this option. */
  getLabel?(): string;
}

/** Modifier keys handled by the ListKeyManager. */
export type ListKeyManagerModifierKey = 'altKey' | 'ctrlKey' | 'metaKey' | 'shiftKey';

export interface ListKeyManager<T extends ListKeyManagerOption> {
  /** Configures wrapping mode (active item wraps to the other end of the list). */
  withWrap(shouldWrap?: boolean): ListKeyManager<T>;
  /** Configures whether the active item can move vertically (arrow up/down). */
  withVerticalOrientation(enabled?: boolean): ListKeyManager<T>;
  /** Configures whether/which direction the active item can move horizontally. */
  withHorizontalOrientation(direction: 'ltr' | 'rtl' | null): ListKeyManager<T>;
  /** Modifier keys allowed to be held down while pressing an arrow key. */
  withAllowedModifierKeys(keys: ListKeyManagerModifierKey[]): ListKeyManager<T>;
  /** Turns on typeahead mode (set the active item by typing). */
  withTypeAhead(debounceInterval?: number): ListKeyManager<T>;
  /** Configures Home/End to jump to the first/last item. */
  withHomeAndEnd(enabled?: boolean): ListKeyManager<T>;
  /** Configures Page Up/Page Down to jump by `delta` items. */
  withPageUpDown(enabled?: boolean, delta?: number): ListKeyManager<T>;
  /** Sets the predicate determining which items are skipped (default: `item.disabled`). */
  skipPredicate(predicate: (item: T) => boolean): ListKeyManager<T>;
  /** Replaces the managed items (e.g. after a re-render). Active item is re-resolved by reference. */
  setItems(items: readonly T[]): void;
  /** Sets the active item by index or reference, firing `onChange` if it changed. */
  setActiveItem(indexOrItem: number | T): void;
  /** Like `setActiveItem`, but never fires `onChange`. */
  updateActiveItem(indexOrItem: number | T): void;
  /** Handles a keydown event, moving/activating the appropriate item. */
  onKeydown(event: KeyboardEvent): void;
  /** Index of the currently active item, or `null`/`-1` if none. */
  readonly activeItemIndex: number | null;
  /** The currently active item, or `null`. */
  readonly activeItem: T | null;
  /** Whether the typeahead buffer currently has pending letters. */
  isTyping(): boolean;
  /** Cancels the current typeahead sequence. */
  cancelTypeahead(): ListKeyManager<T>;
  /** Activates the first non-skipped item. */
  setFirstItemActive(): void;
  /** Activates the last non-skipped item. */
  setLastItemActive(): void;
  /** Activates the next non-skipped item. */
  setNextItemActive(): void;
  /** Activates the previous non-skipped item. */
  setPreviousItemActive(): void;
  /** Subscribes to TAB keydowns; returns an unsubscribe function. */
  onTabOut(callback: () => void): () => void;
  /** Subscribes to active-item changes; returns an unsubscribe function. */
  onChange(callback: (index: number) => void): () => void;
  /** Releases internal timers/subscriptions. */
  destroy(): void;
}

class ListKeyManagerImpl<T extends ListKeyManagerOption> implements ListKeyManager<T> {
  private _items: readonly T[];
  private _activeItemIndex = -1;
  private _activeItem: T | null = null;
  private _wrap = false;
  private _vertical = true;
  private _horizontal: 'ltr' | 'rtl' | null = null;
  private _allowedModifierKeys: ListKeyManagerModifierKey[] = [];
  private _homeAndEnd = false;
  private _pageUpAndDown = {enabled: false, delta: 10};
  private _typeahead?: Typeahead<T>;
  private _skipPredicateFn: (item: T) => boolean = item => !!item.disabled;
  private _tabOutListeners = new Set<() => void>();
  private _changeListeners = new Set<(index: number) => void>();

  constructor(items: readonly T[]) {
    this._items = items;
  }

  setItems(items: readonly T[]): void {
    this._items = items;
    this._typeahead?.setItems(items);
    if (this._activeItem) {
      const newIndex = items.indexOf(this._activeItem);
      if (newIndex > -1 && newIndex !== this._activeItemIndex) {
        this._activeItemIndex = newIndex;
        this._typeahead?.setCurrentSelectedItemIndex(newIndex);
      }
    }
  }

  skipPredicate(predicate: (item: T) => boolean): this {
    this._skipPredicateFn = predicate;
    return this;
  }

  withWrap(shouldWrap = true): this {
    this._wrap = shouldWrap;
    return this;
  }

  withVerticalOrientation(enabled = true): this {
    this._vertical = enabled;
    return this;
  }

  withHorizontalOrientation(direction: 'ltr' | 'rtl' | null): this {
    this._horizontal = direction;
    return this;
  }

  withAllowedModifierKeys(keys: ListKeyManagerModifierKey[]): this {
    this._allowedModifierKeys = keys;
    return this;
  }

  withTypeAhead(debounceInterval?: number): this {
    this._typeahead?.destroy();
    this._typeahead = createTypeahead(this._items, {
      debounceInterval,
      skipPredicate: item => this._skipPredicateFn(item),
      onSelect: item => this.setActiveItem(item),
    });
    return this;
  }

  cancelTypeahead(): this {
    this._typeahead?.reset();
    return this;
  }

  withHomeAndEnd(enabled = true): this {
    this._homeAndEnd = enabled;
    return this;
  }

  withPageUpDown(enabled = true, delta = 10): this {
    this._pageUpAndDown = {enabled, delta};
    return this;
  }

  setActiveItem(item: number | T): void {
    const previousActiveItem = this._activeItem;
    this.updateActiveItem(item);
    if (this._activeItem !== previousActiveItem) {
      for (const cb of this._changeListeners) cb(this._activeItemIndex);
    }
  }

  updateActiveItem(item: number | T): void {
    const index = typeof item === 'number' ? item : this._items.indexOf(item);
    const activeItem = this._items[index];
    this._activeItem = activeItem == null ? null : activeItem;
    this._activeItemIndex = index;
    this._typeahead?.setCurrentSelectedItemIndex(index);
  }

  onKeydown(event: KeyboardEvent): void {
    const modifiers: ListKeyManagerModifierKey[] = ['altKey', 'ctrlKey', 'metaKey', 'shiftKey'];
    const isModifierAllowed = modifiers.every(modifier => {
      return !event[modifier] || this._allowedModifierKeys.indexOf(modifier) > -1;
    });

    switch (event.key) {
      case 'Tab':
        for (const cb of this._tabOutListeners) cb();
        return;

      case 'ArrowDown':
        if (this._vertical && isModifierAllowed) {
          this.setNextItemActive();
          break;
        } else {
          return;
        }

      case 'ArrowUp':
        if (this._vertical && isModifierAllowed) {
          this.setPreviousItemActive();
          break;
        } else {
          return;
        }

      case 'ArrowRight':
        if (this._horizontal && isModifierAllowed) {
          this._horizontal === 'rtl' ? this.setPreviousItemActive() : this.setNextItemActive();
          break;
        } else {
          return;
        }

      case 'ArrowLeft':
        if (this._horizontal && isModifierAllowed) {
          this._horizontal === 'rtl' ? this.setNextItemActive() : this.setPreviousItemActive();
          break;
        } else {
          return;
        }

      case 'Home':
        if (this._homeAndEnd && isModifierAllowed) {
          this.setFirstItemActive();
          break;
        } else {
          return;
        }

      case 'End':
        if (this._homeAndEnd && isModifierAllowed) {
          this.setLastItemActive();
          break;
        } else {
          return;
        }

      case 'PageUp':
        if (this._pageUpAndDown.enabled && isModifierAllowed) {
          const targetIndex = this._activeItemIndex - this._pageUpAndDown.delta;
          this._setActiveItemByIndex(targetIndex > 0 ? targetIndex : 0, 1);
          break;
        } else {
          return;
        }

      case 'PageDown':
        if (this._pageUpAndDown.enabled && isModifierAllowed) {
          const targetIndex = this._activeItemIndex + this._pageUpAndDown.delta;
          const itemsLength = this._items.length;
          this._setActiveItemByIndex(targetIndex < itemsLength ? targetIndex : itemsLength - 1, -1);
          break;
        } else {
          return;
        }

      default:
        if (isModifierAllowed || hasModifierKey(event, 'shiftKey')) {
          this._typeahead?.handleKey(event);
        }
        // Avoid preventing the default action of non-navigational keys.
        return;
    }

    this._typeahead?.reset();
    event.preventDefault();
  }

  get activeItemIndex(): number | null {
    return this._activeItemIndex;
  }

  get activeItem(): T | null {
    return this._activeItem;
  }

  isTyping(): boolean {
    return !!this._typeahead && this._typeahead.isTyping();
  }

  setFirstItemActive(): void {
    this._setActiveItemByIndex(0, 1);
  }

  setLastItemActive(): void {
    this._setActiveItemByIndex(this._items.length - 1, -1);
  }

  setNextItemActive(): void {
    this._activeItemIndex < 0 ? this.setFirstItemActive() : this._setActiveItemByDelta(1);
  }

  setPreviousItemActive(): void {
    this._activeItemIndex < 0 && this._wrap
      ? this.setLastItemActive()
      : this._setActiveItemByDelta(-1);
  }

  onTabOut(callback: () => void): () => void {
    this._tabOutListeners.add(callback);
    return () => this._tabOutListeners.delete(callback);
  }

  onChange(callback: (index: number) => void): () => void {
    this._changeListeners.add(callback);
    return () => this._changeListeners.delete(callback);
  }

  destroy(): void {
    this._typeahead?.destroy();
    this._tabOutListeners.clear();
    this._changeListeners.clear();
  }

  private _setActiveItemByDelta(delta: -1 | 1): void {
    this._wrap ? this._setActiveInWrapMode(delta) : this._setActiveInDefaultMode(delta);
  }

  private _setActiveInWrapMode(delta: -1 | 1): void {
    const items = this._items;
    for (let i = 1; i <= items.length; i++) {
      const index = (this._activeItemIndex + delta * i + items.length) % items.length;
      const item = items[index];
      if (!this._skipPredicateFn(item)) {
        this.setActiveItem(index);
        return;
      }
    }
  }

  private _setActiveInDefaultMode(delta: -1 | 1): void {
    this._setActiveItemByIndex(this._activeItemIndex + delta, delta);
  }

  private _setActiveItemByIndex(index: number, fallbackDelta: -1 | 1): void {
    const items = this._items;
    if (!items[index]) {
      return;
    }
    while (this._skipPredicateFn(items[index])) {
      index += fallbackDelta;
      if (!items[index]) {
        return;
      }
    }
    this.setActiveItem(index);
  }
}

/**
 * Creates a `ListKeyManager` for the given items. If you pass it a new
 * array (`setItems()`) whenever the set of items changes, it will keep the
 * active item in sync and set the correct active item on arrow key events.
 */
export function createListKeyManager<T extends ListKeyManagerOption>(
  items: readonly T[] = [],
): ListKeyManager<T> {
  return new ListKeyManagerImpl(items);
}
