/**
 * Port of `src/cdk/collections/selection-model.ts`'s `SelectionModel<T>`.
 * See `SYNC.md` for the full list of deviations — in short: a plain
 * `createSelectionModel()` factory (object literal + closures, same
 * convention as `createFocusTrap`/`createFocusKeyManager` elsewhere in this
 * package) instead of a `class`, and `changed` (an RxJS `Subject`) replaced
 * by `onChange(cb)` callback registration (same convention as
 * `ListKeyManager`'s `onChange`/`onTabOut`).
 */

/** Event reported to `onChange()` listeners when the selection changes. */
export interface SelectionChange<T> {
  /** Model that dispatched the event. */
  source: SelectionModel<T>;
  /** Values that were added to the model. */
  added: T[];
  /** Values that were removed from the model. */
  removed: T[];
}

/**
 * Returns an error that reports that multiple values are passed into a selection model
 * with a single value.
 */
export function getMultipleValuesInSingleSelectionError(): Error {
  return Error('Cannot pass multiple values into SelectionModel with single-value mode.');
}

/**
 * A `SelectionModel<T>` — see this file's doc comment for why this is an
 * interface backing a factory function, not a `class`.
 */
export interface SelectionModel<T> {
  /** Selected values. Recomputed lazily; cached until the next mutation. */
  readonly selected: T[];
  /** Mirrors the constructor's `compareWith` argument; mutable, like upstream's public field. */
  compareWith?: (o1: T, o2: T) => boolean;
  /**
   * Selects a value or an array of values.
   * @return Whether the selection changed as a result of this call
   */
  select(...values: T[]): boolean;
  /**
   * Deselects a value or an array of values.
   * @return Whether the selection changed as a result of this call
   */
  deselect(...values: T[]): boolean;
  /**
   * Sets the selected values.
   * @return Whether the selection changed as a result of this call
   */
  setSelection(...values: T[]): boolean;
  /**
   * Toggles a value between selected and deselected.
   * @return Whether the selection changed as a result of this call
   */
  toggle(value: T): boolean;
  /**
   * Clears all of the selected values.
   * @param flushEvent Whether to flush the changes in an event. If false, the changes to the
   *   selection will be flushed along with the next event.
   * @return Whether the selection changed as a result of this call
   */
  clear(flushEvent?: boolean): boolean;
  /** Determines whether a value is selected. */
  isSelected(value: T): boolean;
  /** Determines whether the model does not have a value. */
  isEmpty(): boolean;
  /** Determines whether the model has a value. */
  hasValue(): boolean;
  /** Sorts the selected values in place, based on a predicate function. Multi-select only. */
  sort(predicate?: (a: T, b: T) => number): void;
  /** Gets whether multiple values can be selected. */
  isMultipleSelection(): boolean;
  /**
   * Registers a listener for `changed` events (upstream's `changed.subscribe(cb)`).
   * @return a function that removes the listener.
   */
  onChange(listener: (change: SelectionChange<T>) => void): () => void;
}

/**
 * Creates a `SelectionModel<T>` for powering single/multi selection UI (checkbox lists, radio
 * groups, table row selection, …). Mirrors upstream's `new SelectionModel(multiple,
 * initiallySelectedValues, emitChanges, compareWith)` constructor signature exactly.
 */
export function createSelectionModel<T>(
  multiple = false,
  initiallySelectedValues?: T[],
  emitChanges = true,
  compareWith?: (o1: T, o2: T) => boolean,
): SelectionModel<T> {
  const selection = new Set<T>();
  let deselectedToEmit: T[] = [];
  let selectedToEmit: T[] = [];
  let selectedCache: T[] | null = null;
  const listeners: Array<(change: SelectionChange<T>) => void> = [];

  function getConcreteValue(inputValue: T, selectionSet?: Set<T>): T {
    if (!model.compareWith) {
      return inputValue;
    }
    const set = selectionSet ?? selection;
    for (const selectedValue of set) {
      if (model.compareWith(inputValue, selectedValue)) {
        return selectedValue;
      }
    }
    return inputValue;
  }

  function hasQueuedChanges(): boolean {
    return !!(deselectedToEmit.length || selectedToEmit.length);
  }

  function emitChangeEvent(): void {
    selectedCache = null;
    if (selectedToEmit.length || deselectedToEmit.length) {
      const change: SelectionChange<T> = {
        source: model,
        added: selectedToEmit,
        removed: deselectedToEmit,
      };
      deselectedToEmit = [];
      selectedToEmit = [];
      for (const listener of listeners.slice()) listener(change);
    }
  }

  function unmarkSelected(value: T): void {
    value = getConcreteValue(value);
    if (model.isSelected(value)) {
      selection.delete(value);
      if (emitChanges) deselectedToEmit.push(value);
    }
  }

  function unmarkAll(): void {
    if (!model.isEmpty()) {
      selection.forEach(value => unmarkSelected(value));
    }
  }

  function markSelected(value: T): void {
    value = getConcreteValue(value);
    if (!model.isSelected(value)) {
      if (!multiple) unmarkAll();
      if (!model.isSelected(value)) selection.add(value);
      if (emitChanges) selectedToEmit.push(value);
    }
  }

  function verifyValueAssignment(values: T[]): void {
    if (values.length > 1 && !multiple) {
      throw getMultipleValuesInSingleSelectionError();
    }
  }

  const model: SelectionModel<T> = {
    get selected() {
      if (!selectedCache) selectedCache = Array.from(selection.values());
      return selectedCache;
    },
    compareWith,

    select(...values) {
      verifyValueAssignment(values);
      values.forEach(markSelected);
      const changed = hasQueuedChanges();
      emitChangeEvent();
      return changed;
    },

    deselect(...values) {
      verifyValueAssignment(values);
      values.forEach(unmarkSelected);
      const changed = hasQueuedChanges();
      emitChangeEvent();
      return changed;
    },

    setSelection(...values) {
      verifyValueAssignment(values);
      const oldValues = model.selected;
      const newSelectedSet = new Set(values.map(value => getConcreteValue(value)));
      values.forEach(markSelected);
      oldValues
        .filter(value => !newSelectedSet.has(getConcreteValue(value, newSelectedSet)))
        .forEach(unmarkSelected);
      const changed = hasQueuedChanges();
      emitChangeEvent();
      return changed;
    },

    toggle(value) {
      return model.isSelected(value) ? model.deselect(value) : model.select(value);
    },

    clear(flushEvent = true) {
      unmarkAll();
      const changed = hasQueuedChanges();
      if (flushEvent) emitChangeEvent();
      return changed;
    },

    isSelected(value) {
      return selection.has(getConcreteValue(value));
    },

    isEmpty() {
      return selection.size === 0;
    },

    hasValue() {
      return !model.isEmpty();
    },

    sort(predicate) {
      if (multiple && model.selected) {
        selectedCache!.sort(predicate);
      }
    },

    isMultipleSelection() {
      return multiple;
    },

    onChange(listener) {
      listeners.push(listener);
      return () => {
        const i = listeners.indexOf(listener);
        if (i > -1) listeners.splice(i, 1);
      };
    },
  };

  if (initiallySelectedValues && initiallySelectedValues.length) {
    if (multiple) {
      initiallySelectedValues.forEach(markSelected);
    } else {
      markSelected(initiallySelectedValues[0]);
    }
    // Clear the array in order to avoid firing the change event for preselected values.
    selectedToEmit = [];
  }

  return model;
}
