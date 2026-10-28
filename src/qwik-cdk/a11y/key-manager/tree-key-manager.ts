/**
 * Qwik port of `src/cdk/a11y/key-manager/tree-key-manager.ts`'s decision
 * algorithm (`TreeKeyManager.onKeydown` and its private helpers).
 *
 * Deviations from upstream:
 * - A pure function (`resolveTreeKeydown`), not a stateful class. Upstream's
 *   `TreeKeyManager` is a long-lived object wrapping a `QueryList`/
 *   `Observable` of `TreeKeyManagerItem`s (each with imperative `.focus()`/
 *   `.expand()`/etc. methods) and an RxJS `change` `Subject`. This port's
 *   only consumer (`qwik-material/tree`'s `MatTree`) already recomputes its
 *   full flattened node list as a plain array on every render (see
 *   `qwik-cdk/tree/flatten-tree.ts`) and owns its own reactive state
 *   (`expanded` store, `activeKey` signal) directly — there is no
 *   "subscribe to items changing" concern (Qwik's own re-render IS that
 *   subscription) and no need for an object to hold item-list state between
 *   calls. `resolveTreeKeydown` takes the CURRENT flattened list + active
 *   key + pressed key and returns a plain description of what should
 *   happen; the caller applies it to its own store/signal. This keeps the
 *   algorithm itself (the genuinely-interesting, genuinely-unit-testable
 *   part — see `tree-key-manager.spec.ts`) completely free of Qwik/DOM
 *   concerns.
 * - No typeahead support. Upstream's `TreeKeyManager` optionally wires a
 *   `Typeahead` (letter-key search) — no `angular-parity.spec.ts` scenario
 *   for `mat-tree` exercises it, and adding it would require this function
 *   to become stateful (a debounce buffer) for zero covered behavior.
 *   `qwik-cdk/a11y/key-manager/typeahead.ts` exists and could be wired in
 *   by a future caller that needs it; `resolveTreeKeydown` simply returns
 *   `{type: 'none'}` for an unrecognized key (including any letter), the
 *   same "not handled, don't preventDefault" outcome upstream's `default:`
 *   branch produces before it hands off to its typeahead instance.
 * - `shouldActivationFollowFocus` not ported — no scenario uses it (CDK's
 *   own option for having every focus move also activate the item).
 * - Initial-focus selection (upstream's `_initializeFocus`/`makeFocusable`,
 *   "focus the first non-skipped item without moving real browser focus")
 *   is NOT part of this function — it's a one-time computation the caller
 *   does directly from its already-flattened, already-filtered node list
 *   (`list.find(e => !e.isDisabled)`), since Qwik's SSR has no notion of
 *   "live items changed over time" to react to.
 */

/** Minimal per-node shape this algorithm needs — structurally satisfied by
 *  `qwik-cdk/tree`'s `FlatTreeEntry<T>` without either package importing
 *  the other (mirrors upstream's own module boundary: `TreeKeyManager`
 *  lives in `@angular/cdk/a11y`, `CdkTree` lives in `@angular/cdk/tree` and
 *  imports IT, never the reverse). */
export interface TreeKeyManagerItem<T = unknown> {
  key: string;
  /** `null` for a root item; a parent key otherwise. */
  parentKey: string | null;
  /** Whether this item is expandable at all (`[isExpandable]`). */
  isExpandable: boolean;
  /** Whether this item is disabled (skipped by navigation). */
  isDisabled: boolean;
  /** Whether Enter/Space on this item should toggle expansion instead of
   *  activating (mirrors `matTreeNodeToggle` being applied to the node
   *  element itself — see `qwik-cdk/tree`'s `CdkTreeNodeInput.nodeToggle`). */
  nodeToggle: boolean;
  /** Carried through to the `'activate'` result so the caller doesn't need
   *  a separate by-key lookup for the common case. */
  data: T;
}

export type TreeKeydownAction<T = unknown> =
  | {type: 'focus'; key: string}
  | {type: 'expand'; key: string}
  | {type: 'collapse'; key: string}
  | {type: 'toggle'; key: string}
  | {type: 'activate'; key: string; data: T}
  | {type: 'expand-many'; keys: string[]}
  | {type: 'none'};

export interface ResolveTreeKeydownOptions {
  /** Mirrors `TreeKeyManagerOptions.horizontalOrientation` — in `rtl`, Left
   *  and Right swap their expand/collapse meaning. Default `'ltr'`. */
  horizontalOrientation?: 'ltr' | 'rtl';
}

/**
 * Decides what a keydown on the currently-active tree item should do,
 * given the full list of currently reachable (expansion-aware flattened)
 * items. Faithful port of `TreeKeyManager.onKeydown`'s `switch` + its
 * `_focusNextItem`/`_focusPreviousItem`/`_focusFirstItem`/`_focusLastItem`/
 * `_expandCurrentItem`/`_collapseCurrentItem`/
 * `_expandAllItemsAtCurrentItemLevel` helpers, minus typeahead (see header
 * comment). Returns `{type: 'none'}` for Tab, an unhandled key, or when
 * `activeKey` isn't found in `entries` — the caller should NOT call
 * `event.preventDefault()` in that case (matches upstream returning early
 * without it).
 */
export function resolveTreeKeydown<T>(
  activeKey: string,
  eventKey: string,
  entries: readonly TreeKeyManagerItem<T>[],
  isExpanded: (key: string) => boolean,
  options: ResolveTreeKeydownOptions = {},
): TreeKeydownAction<T> {
  const index = entries.findIndex(e => e.key === activeKey);
  if (index < 0) {
    return {type: 'none'};
  }
  const entry = entries[index];
  const horizontal = options.horizontalOrientation ?? 'ltr';

  switch (eventKey) {
    case 'ArrowDown':
      return focusByDelta(entries, index, 1);
    case 'ArrowUp':
      return focusByDelta(entries, index, -1);
    case 'ArrowRight':
      return horizontal === 'rtl'
        ? collapseOrFocusParent(entries, entry, isExpanded)
        : expandOrFocusChild(entries, entry, isExpanded);
    case 'ArrowLeft':
      return horizontal === 'rtl'
        ? expandOrFocusChild(entries, entry, isExpanded)
        : collapseOrFocusParent(entries, entry, isExpanded);
    case 'Home':
      return focusEdge(entries, 1);
    case 'End':
      return focusEdge(entries, -1);
    case 'Enter':
    case ' ':
      return entry.isExpandable && entry.nodeToggle
        ? {type: 'toggle', key: entry.key}
        : {type: 'activate', key: entry.key, data: entry.data};
    case '*':
      return expandSiblings(entries, entry);
    default:
      return {type: 'none'};
  }
}

function focusByDelta<T>(
  entries: readonly TreeKeyManagerItem<T>[],
  from: number,
  delta: 1 | -1,
): TreeKeydownAction<T> {
  for (let i = from + delta; i >= 0 && i < entries.length; i += delta) {
    if (!entries[i].isDisabled) {
      return {type: 'focus', key: entries[i].key};
    }
  }
  return {type: 'none'};
}

function focusEdge<T>(
  entries: readonly TreeKeyManagerItem<T>[],
  direction: 1 | -1,
): TreeKeydownAction<T> {
  const start = direction === 1 ? 0 : entries.length - 1;
  for (let i = start; i >= 0 && i < entries.length; i += direction) {
    if (!entries[i].isDisabled) {
      return {type: 'focus', key: entries[i].key};
    }
  }
  return {type: 'none'};
}

function expandOrFocusChild<T>(
  entries: readonly TreeKeyManagerItem<T>[],
  entry: TreeKeyManagerItem<T>,
  isExpanded: (key: string) => boolean,
): TreeKeydownAction<T> {
  if (!entry.isExpandable) {
    return {type: 'none'};
  }
  if (!isExpanded(entry.key)) {
    return {type: 'expand', key: entry.key};
  }
  const child = entries.find(e => e.parentKey === entry.key && !e.isDisabled);
  return child ? {type: 'focus', key: child.key} : {type: 'none'};
}

function collapseOrFocusParent<T>(
  entries: readonly TreeKeyManagerItem<T>[],
  entry: TreeKeyManagerItem<T>,
  isExpanded: (key: string) => boolean,
): TreeKeydownAction<T> {
  if (entry.isExpandable && isExpanded(entry.key)) {
    return {type: 'collapse', key: entry.key};
  }
  if (entry.parentKey == null) {
    return {type: 'none'};
  }
  const parent = entries.find(e => e.key === entry.parentKey);
  if (!parent || parent.isDisabled) {
    return {type: 'none'};
  }
  return {type: 'focus', key: parent.key};
}

function expandSiblings<T>(
  entries: readonly TreeKeyManagerItem<T>[],
  entry: TreeKeyManagerItem<T>,
): TreeKeydownAction<T> {
  const siblingKeys = entries
    .filter(e => e.parentKey === entry.parentKey && e.isExpandable)
    .map(e => e.key);
  return siblingKeys.length ? {type: 'expand-many', keys: siblingKeys} : {type: 'none'};
}
