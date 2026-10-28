/**
 * Qwik-native port of upstream `ListKeyManager`
 * (`src/cdk/a11y/key-manager/list-key-manager.ts`) + `Typeahead`
 * (`./typeahead.ts`) + `ActiveDescendantKeyManager`
 * (`./activedescendant-key-manager.ts`), merged into one small factory.
 *
 * ## Why one factory instead of three RxJS/Angular classes
 *
 * Upstream's `ListKeyManager` is an Angular-DI-free plain class already, but
 * it leans on RxJS (`Subject` for `tabOut`/`change`, `debounceTime` for
 * typeahead) and Angular `signal()`s for its internal active-item state.
 * This project has no RxJS dependency and — per the design doc's house style
 * (see `qwik-material/tabs/tab-group-keyboard.ts`,
 * `qwik-material/slider/slider-math.ts`,
 * `qwik-material/expansion/accordion-keyboard.ts`,
 * `qwik-cdk/stepper/stepper-keyboard.ts`) — keyboard-navigation logic in
 * this port is modeled as small, plain, synchronously-testable state rather
 * than as a port of an RxJS-flavored class. `createListKeyManager()` keeps
 * upstream's fluent `.withX()` builder API and method names (so the call
 * site in `mat-select.tsx` reads almost identically to
 * `MatSelect._initKeyManager()`), but:
 *
 * - `tabOut`/`change` are plain, directly-assignable callback fields
 *   (`manager.onTabOut = () => {...}`), not `Subject`s — no consumer here
 *   needs multiple subscribers or unsubscription semantics.
 * - The active item/index are plain mutable fields read via getters, not
 *   Angular `signal()`s — the CALLER (`MatSelect`, a Qwik `component$`) owns
 *   the actual reactive `useSignal<number>()` that drives rendering; it
 *   writes that signal from inside `onChange`, so re-render scheduling is
 *   entirely the caller's concern, matching how every other
 *   `create*()`-style qwik-cdk engine (`createOverlayRef`,
 *   `createLiveAnnouncer`, `createFocusMonitor`) hands reactivity back to
 *   its caller instead of trying to own it itself.
 * - Typeahead debouncing uses a plain `setTimeout`, not `debounceTime` — see
 *   `createTypeahead()` below.
 * - No `QueryList`/Angular `Signal<T[]>` constructor overloads — items are
 *   always a plain array, updated via `setItems()`.
 *
 * ## Why this subsumes `ActiveDescendantKeyManager` (no separate export)
 *
 * Upstream's `ActiveDescendantKeyManager` is a two-line subclass of
 * `ListKeyManager` that calls `item.setActiveStyles()`/`setInactiveStyles()`
 * imperatively around `setActiveItem()` — needed because Angular's items
 * are long-lived component instances whose "active" CSS class is applied
 * imperatively via `ChangeDetectorRef.markForCheck()`. This port's
 * `MatOption` (`qwik-material/core/mat-option.tsx`) is a plain, fully
 * props-controlled presentational component: "active" is just
 * `index === activeItemIndex`, derived and re-rendered declaratively by
 * whichever `useSignal()` the caller updates in `onChange`. There is no
 * imperative style-setting step left to port, so
 * {@link createActiveDescendantKeyManager} is a documented alias of
 * {@link createListKeyManager} — exported under upstream's name purely so a
 * reader familiar with `MatSelect._initKeyManager()` finds the expected
 * symbol, and so a future `FocusKeyManager` port (if one turns out to need
 * real imperative focus calls) has an obvious sibling to diverge from.
 */

import {
  A,
  DOWN_ARROW,
  END,
  HOME,
  LEFT_ARROW,
  NINE,
  PAGE_DOWN,
  PAGE_UP,
  RIGHT_ARROW,
  TAB,
  UP_ARROW,
  Z,
  ZERO,
  hasModifierKey,
} from '../../keycodes';

/** Mirrors upstream `ListKeyManagerOption`. */
export interface ListKeyManagerItem {
  disabled?: boolean;
  getLabel?(): string;
}

/** Mirrors upstream `ListKeyManagerModifierKey`. */
export type ListKeyManagerModifierKey = 'altKey' | 'ctrlKey' | 'metaKey' | 'shiftKey';

const DEFAULT_TYPEAHEAD_DEBOUNCE_INTERVAL_MS = 200;

/**
 * Plain-`setTimeout` port of upstream `Typeahead` (`./typeahead.ts`).
 * Accumulates letter keys and, after `debounceInterval` ms of silence,
 * calls `onMatch` with the index of the first item (starting just after
 * `currentIndex`, wrapping) whose label starts with the accumulated string
 * — identical search semantics to upstream, minus the RxJS plumbing.
 */
function createTypeahead<T extends ListKeyManagerItem>(
  items: readonly T[],
  options: {debounceInterval: number; skipPredicate?: (item: T) => boolean},
) {
  let _items = items;
  let currentIndex = -1;
  let pressedLetters: string[] = [];
  let timer: ReturnType<typeof setTimeout> | undefined;

  return {
    setItems(next: readonly T[]) {
      _items = next;
    },
    setCurrentIndex(index: number) {
      currentIndex = index;
    },
    isTyping(): boolean {
      return pressedLetters.length > 0;
    },
    reset() {
      pressedLetters = [];
      if (timer != null) clearTimeout(timer);
      timer = undefined;
    },
    destroy() {
      this.reset();
    },
    /** Returns the matched index, or `null` if nothing (yet) matched. */
    handleKey(event: KeyboardEvent, onMatch: (index: number) => void): void {
      const keyCode = event.keyCode;
      if (event.key && event.key.length === 1) {
        pressedLetters.push(event.key.toLocaleUpperCase());
      } else if ((keyCode >= A && keyCode <= Z) || (keyCode >= ZERO && keyCode <= NINE)) {
        pressedLetters.push(String.fromCharCode(keyCode));
      } else {
        return;
      }

      if (timer != null) clearTimeout(timer);
      timer = setTimeout(() => {
        timer = undefined;
        if (!pressedLetters.length) return;
        const inputString = pressedLetters.join('').toLocaleUpperCase();

        for (let i = 1; i < _items.length + 1; i++) {
          const index = (currentIndex + i) % _items.length;
          const item = _items[index];
          if (
            !options.skipPredicate?.(item) &&
            item.getLabel?.().toLocaleUpperCase().trim().indexOf(inputString) === 0
          ) {
            onMatch(index);
            break;
          }
        }

        pressedLetters = [];
      }, options.debounceInterval);
    },
  };
}

/** Public surface of {@link createListKeyManager}. Mirrors upstream `ListKeyManager`'s API. */
export interface ListKeyManager<T extends ListKeyManagerItem> {
  withWrap(shouldWrap?: boolean): this;
  withVerticalOrientation(enabled?: boolean): this;
  withHorizontalOrientation(direction: 'ltr' | 'rtl' | null): this;
  withAllowedModifierKeys(keys: ListKeyManagerModifierKey[]): this;
  withTypeAhead(debounceInterval?: number): this;
  withHomeAndEnd(enabled?: boolean): this;
  withPageUpDown(enabled?: boolean, delta?: number): this;
  skipPredicate(predicate: (item: T) => boolean): this;
  /** Replaces the managed item list in place (preserves active index/typeahead state). */
  setItems(items: readonly T[]): void;
  setActiveItem(indexOrItem: number | T): void;
  updateActiveItem(indexOrItem: number | T): void;
  setFirstItemActive(): void;
  setLastItemActive(): void;
  setNextItemActive(): void;
  setPreviousItemActive(): void;
  /** Mirrors `ListKeyManager.onKeydown` — returns `true` if the event was handled
   *  (navigational key recognized; caller should usually preventDefault, which
   *  this does NOT do itself — mirrors upstream exactly: only navigational keys
   *  call `event.preventDefault()`, done here internally). */
  onKeydown(event: KeyboardEvent): void;
  cancelTypeahead(): void;
  isTyping(): boolean;
  readonly activeItemIndex: number | null;
  readonly activeItem: T | null;
  /** Mirrors `tabOut` — called when Tab is pressed. */
  onTabOut?: () => void;
  /** Mirrors `change` — called whenever the active item changes (via any method, incl. setActiveItem). */
  onChange?: (index: number) => void;
  destroy(): void;
}

/**
 * Qwik-native port of upstream `ListKeyManager`. See the module doc comment
 * for the full rationale. Fluent `.withX()` calls mutate and return the same
 * instance (matching upstream's chaining API).
 */
export function createListKeyManager<T extends ListKeyManagerItem>(
  items: readonly T[] = [],
): ListKeyManager<T> {
  let _items: readonly T[] = items;
  let activeIndex = -1;
  let wrap = false;
  let vertical = true;
  let horizontal: 'ltr' | 'rtl' | null = null;
  let allowedModifierKeys: ListKeyManagerModifierKey[] = [];
  let homeAndEnd = false;
  let pageUpDown = {enabled: false, delta: 10};
  let skipPredicateFn: (item: T) => boolean = item => !!item.disabled;
  let typeahead: ReturnType<typeof createTypeahead<T>> | undefined;

  function getItemsArray(): readonly T[] {
    return _items;
  }

  function resolveIndex(indexOrItem: number | T): number {
    return typeof indexOrItem === 'number' ? indexOrItem : getItemsArray().indexOf(indexOrItem);
  }

  function setActiveByIndex(index: number, fallbackDelta: -1 | 1): void {
    const arr = getItemsArray();
    if (!arr[index]) return;
    while (skipPredicateFn(arr[index])) {
      index += fallbackDelta;
      if (!arr[index]) return;
    }
    manager.setActiveItem(index);
  }

  function setActiveByDelta(delta: -1 | 1): void {
    if (wrap) {
      const arr = getItemsArray();
      for (let i = 1; i <= arr.length; i++) {
        const index = (activeIndex + delta * i + arr.length) % arr.length;
        if (!skipPredicateFn(arr[index])) {
          manager.setActiveItem(index);
          return;
        }
      }
    } else {
      setActiveByIndex(activeIndex + delta, delta);
    }
  }

  const manager: ListKeyManager<T> = {
    withWrap(shouldWrap = true) {
      wrap = shouldWrap;
      return this;
    },
    withVerticalOrientation(enabled = true) {
      vertical = enabled;
      return this;
    },
    withHorizontalOrientation(direction) {
      horizontal = direction;
      return this;
    },
    withAllowedModifierKeys(keys) {
      allowedModifierKeys = keys;
      return this;
    },
    withTypeAhead(debounceInterval = DEFAULT_TYPEAHEAD_DEBOUNCE_INTERVAL_MS) {
      typeahead?.destroy();
      typeahead = createTypeahead(getItemsArray(), {
        debounceInterval,
        skipPredicate: skipPredicateFn,
      });
      typeahead.setCurrentIndex(activeIndex);
      return this;
    },
    withHomeAndEnd(enabled = true) {
      homeAndEnd = enabled;
      return this;
    },
    withPageUpDown(enabled = true, delta = 10) {
      pageUpDown = {enabled, delta};
      return this;
    },
    skipPredicate(predicate) {
      skipPredicateFn = predicate;
      return this;
    },
    setItems(next) {
      _items = next;
      typeahead?.setItems(next);
    },
    setActiveItem(indexOrItem) {
      const previous = activeIndex;
      manager.updateActiveItem(indexOrItem);
      if (activeIndex !== previous) {
        manager.onChange?.(activeIndex);
      }
    },
    updateActiveItem(indexOrItem) {
      const arr = getItemsArray();
      const index = resolveIndex(indexOrItem);
      activeIndex = arr[index] != null ? index : -1;
      typeahead?.setCurrentIndex(activeIndex);
    },
    setFirstItemActive() {
      setActiveByIndex(0, 1);
    },
    setLastItemActive() {
      setActiveByIndex(getItemsArray().length - 1, -1);
    },
    setNextItemActive() {
      activeIndex < 0 ? manager.setFirstItemActive() : setActiveByDelta(1);
    },
    setPreviousItemActive() {
      activeIndex < 0 && wrap ? manager.setLastItemActive() : setActiveByDelta(-1);
    },
    onKeydown(event) {
      const keyCode = event.keyCode;
      const modifiers: ListKeyManagerModifierKey[] = ['altKey', 'ctrlKey', 'metaKey', 'shiftKey'];
      const isModifierAllowed = modifiers.every(
        modifier => !event[modifier] || allowedModifierKeys.indexOf(modifier) > -1,
      );

      switch (keyCode) {
        case TAB:
          manager.onTabOut?.();
          return;

        case DOWN_ARROW:
          if (vertical && isModifierAllowed) {
            manager.setNextItemActive();
            break;
          } else {
            return;
          }

        case UP_ARROW:
          if (vertical && isModifierAllowed) {
            manager.setPreviousItemActive();
            break;
          } else {
            return;
          }

        case RIGHT_ARROW:
          if (horizontal && isModifierAllowed) {
            horizontal === 'rtl' ? manager.setPreviousItemActive() : manager.setNextItemActive();
            break;
          } else {
            return;
          }

        case LEFT_ARROW:
          if (horizontal && isModifierAllowed) {
            horizontal === 'rtl' ? manager.setNextItemActive() : manager.setPreviousItemActive();
            break;
          } else {
            return;
          }

        case HOME:
          if (homeAndEnd && isModifierAllowed) {
            manager.setFirstItemActive();
            break;
          } else {
            return;
          }

        case END:
          if (homeAndEnd && isModifierAllowed) {
            manager.setLastItemActive();
            break;
          } else {
            return;
          }

        case PAGE_UP:
          if (pageUpDown.enabled && isModifierAllowed) {
            const target = activeIndex - pageUpDown.delta;
            setActiveByIndex(target > 0 ? target : 0, 1);
            break;
          } else {
            return;
          }

        case PAGE_DOWN:
          if (pageUpDown.enabled && isModifierAllowed) {
            const target = activeIndex + pageUpDown.delta;
            const len = getItemsArray().length;
            setActiveByIndex(target < len ? target : len - 1, -1);
            break;
          } else {
            return;
          }

        default:
          if (isModifierAllowed || hasModifierKey(event, 'shiftKey')) {
            typeahead?.handleKey(event, index => manager.setActiveItem(index));
          }
          return;
      }

      typeahead?.reset();
      event.preventDefault();
    },
    cancelTypeahead() {
      typeahead?.reset();
    },
    isTyping() {
      return !!typeahead?.isTyping();
    },
    get activeItemIndex() {
      return activeIndex < 0 ? null : activeIndex;
    },
    get activeItem() {
      return activeIndex < 0 ? null : getItemsArray()[activeIndex] ?? null;
    },
    destroy() {
      typeahead?.destroy();
    },
  };

  return manager;
}

/**
 * Documented alias of {@link createListKeyManager} — see the module doc
 * comment's "Why this subsumes ActiveDescendantKeyManager" section for why
 * no separate imperative setActiveStyles/setInactiveStyles step is needed
 * in this port's declarative rendering model.
 */
export const createActiveDescendantKeyManager = createListKeyManager;
