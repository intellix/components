/**
 * Qwik port of `src/cdk/a11y/key-manager/focus-key-manager.ts`. Wraps
 * `createListKeyManager` so that `setActiveItem` — and everything that
 * calls it internally (arrow-key navigation, Home/End, typeahead selection)
 * — also calls `.focus(origin)` on the newly-active item, mirroring
 * upstream's `FocusKeyManager<T>`.
 *
 * Implementation note: this works by reassigning the returned manager's own
 * `setActiveItem` property (shadowing the inherited one) rather than
 * returning a separate wrapper object. That matters because
 * `ListKeyManager`'s *internal* call sites (`setNextItemActive`, the
 * typeahead `onSelect` callback installed by `withTypeAhead()`, …) all
 * invoke `this.setActiveItem(...)` with `this` bound to the manager
 * instance itself — a wrapper object with a *different* identity would
 * never see those calls. Own-property shadowing means every such call,
 * including ones from a closure created by a *later* `.withTypeAhead()`
 * chain call, resolves to the focus-aware version automatically.
 */
import {
  createListKeyManager,
  type ListKeyManager,
  type ListKeyManagerOption,
} from './list-key-manager';
import type {FocusOrigin} from '../focus-monitor/focus-monitor';

/**
 * Interface for focusable items (used by the FocusKeyManager). Each item
 * must know how to focus itself, whether it's disabled, and (for typeahead)
 * be able to supply its label.
 */
export interface FocusableOption extends ListKeyManagerOption {
  /** Focuses the `FocusableOption`. */
  focus(origin?: FocusOrigin): void;
}

export interface FocusKeyManager<T extends FocusableOption> extends ListKeyManager<T> {
  /** Sets the focus origin passed to items' `focus()` for subsequent activations. */
  setFocusOrigin(origin: FocusOrigin): FocusKeyManager<T>;
}

/**
 * Creates a `FocusKeyManager` for the given items — a `ListKeyManager` whose
 * `setActiveItem` additionally calls `.focus(origin)` on the newly-active
 * item, using whichever origin was last set via `setFocusOrigin()` (default
 * `'program'`, matching upstream).
 */
export function createFocusKeyManager<T extends FocusableOption>(
  items: readonly T[] = [],
): FocusKeyManager<T> {
  const base = createListKeyManager<T>(items) as ListKeyManager<T> & {
    setFocusOrigin?(origin: FocusOrigin): FocusKeyManager<T>;
  };
  let origin: FocusOrigin = 'program';
  const originalSetActiveItem = base.setActiveItem.bind(base);

  base.setActiveItem = (item: number | T) => {
    originalSetActiveItem(item);
    base.activeItem?.focus(origin);
  };

  base.setFocusOrigin = (nextOrigin: FocusOrigin) => {
    origin = nextOrigin;
    return base as FocusKeyManager<T>;
  };

  return base as FocusKeyManager<T>;
}
