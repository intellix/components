import {useSignal, type Signal} from '@qwik.dev/core';
import {createSelectionModel} from './selection-model';

/**
 * Qwik-component-safe binding for `createSelectionModel()`. `createSelectionModel()`'s own
 * return value has methods (closures) — fine for standalone/non-reactive use, but NOT safe to
 * store inside a `useSignal`/`useStore` (see `data-source.ts`'s doc comment on the same
 * pitfall): a `useSignal(() => createSelectionModel(...))` would try to serialize that
 * closure-bearing object the moment SSR finishes rendering.
 *
 * This hook instead keeps ONLY the plain, serializable selected-values array in a `Signal`
 * (reactive, SSR-correct from the first render) and re-derives an ephemeral
 * `createSelectionModel()` instance on demand — inside the mutator functions below, never
 * stored anywhere — to reuse its exact selection algorithm instead of duplicating it. Mirrors
 * this package's "keep data in stores, logic in module functions" convention.
 *
 * ```tsx
 * const sel = useSelectionModel<number>({multiple: true});
 * return (
 *   <ul>
 *     {rows.map(row => (
 *       <li key={row.id} onClick$={() => toggleSelectionValue(sel.selected, row.id, sel)}>
 *         {sel.isSelected(row.id) ? '☑' : '☐'} {row.label}
 *       </li>
 *     ))}
 *   </ul>
 * );
 * ```
 */
export interface UseSelectionModelOptions<T> {
  /** Whether multiple values can be selected at once. Default `false`. */
  multiple?: boolean;
  /** Initially-selected value(s). Only the first is used when `multiple` is `false`. */
  initialValues?: readonly T[];
  /** Mirrors upstream's `compareWith` — NOT safe to call from inside a *different* `$()`
   *  closure than the one that reads `options` fresh (see this package's README for the
   *  general "don't capture a plain closure across a QRL boundary" rule); fine when called
   *  synchronously in the same render, which is how `isSelected`/the mutators below use it. */
  compareWith?: (o1: T, o2: T) => boolean;
}

export interface SelectionModelHook<T> {
  /** The current selected values. Read this reactively in JSX. */
  selected: Signal<readonly T[]>;
  readonly multiple: boolean;
  readonly compareWith?: (o1: T, o2: T) => boolean;
  isSelected(value: T): boolean;
  isEmpty(): boolean;
  hasValue(): boolean;
}

export function useSelectionModel<T>(
  options: UseSelectionModelOptions<T> = {},
): SelectionModelHook<T> {
  const multiple = options.multiple ?? false;
  const compareWith = options.compareWith;
  const selected = useSignal<readonly T[]>(() => {
    if (!options.initialValues?.length) return [];
    const model = createSelectionModel(multiple, options.initialValues.slice(), true, compareWith);
    return model.selected;
  });

  return {
    selected,
    multiple,
    compareWith,
    isSelected(value) {
      const model = createSelectionModel(multiple, selected.value.slice(), true, compareWith);
      return model.isSelected(value);
    },
    isEmpty() {
      return selected.value.length === 0;
    },
    hasValue() {
      return selected.value.length > 0;
    },
  };
}

/** Shared config read by every mutator below — call these directly from a `$()` handler body. */
export interface SelectionMutatorConfig<T> {
  multiple?: boolean;
  compareWith?: (o1: T, o2: T) => boolean;
}

function withModel<T, R>(
  selected: Signal<readonly T[]>,
  config: SelectionMutatorConfig<T>,
  fn: (model: ReturnType<typeof createSelectionModel<T>>) => R,
): R {
  const model = createSelectionModel(
    config.multiple ?? false,
    selected.value.slice(),
    true,
    config.compareWith,
  );
  const result = fn(model);
  selected.value = model.selected;
  return result;
}

/** Selects `value` (or values), writing the result back into `selected`. */
export function selectValue<T>(
  selected: Signal<readonly T[]>,
  config: SelectionMutatorConfig<T>,
  ...values: T[]
): boolean {
  return withModel(selected, config, model => model.select(...values));
}

/** Deselects `value` (or values), writing the result back into `selected`. */
export function deselectValue<T>(
  selected: Signal<readonly T[]>,
  config: SelectionMutatorConfig<T>,
  ...values: T[]
): boolean {
  return withModel(selected, config, model => model.deselect(...values));
}

/** Toggles `value`'s selection, writing the result back into `selected`. */
export function toggleSelectionValue<T>(
  selected: Signal<readonly T[]>,
  value: T,
  config: SelectionMutatorConfig<T> = {},
): boolean {
  return withModel(selected, config, model => model.toggle(value));
}

/** Replaces the selection with exactly `values`, writing the result back into `selected`. */
export function setSelectionValues<T>(
  selected: Signal<readonly T[]>,
  config: SelectionMutatorConfig<T>,
  ...values: T[]
): boolean {
  return withModel(selected, config, model => model.setSelection(...values));
}

/** Clears the selection, writing the result back into `selected`. */
export function clearSelection<T>(
  selected: Signal<readonly T[]>,
  config: SelectionMutatorConfig<T> = {},
): boolean {
  return withModel(selected, config, model => model.clear());
}
