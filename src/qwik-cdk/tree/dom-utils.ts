/**
 * Moves real DOM focus to the `index`-th rendered `role="treeitem"`
 * element within `treeRoot`, in document order. Used by `qwik-material/
 * tree`'s `MatTree` for keyboard-navigation focus moves (ArrowUp/Down/
 * Left/Right/Home/End) — these must move REAL focus, not just flip a
 * `tabindex` attribute, since a scenario's later steps dispatch
 * subsequent key presses to whatever element the browser currently
 * considers focused.
 *
 * Deliberately index-based rather than a `[data-*]` attribute-value
 * lookup: this port renders NO element identifying attribute beyond
 * upstream's own real contract (`role`, `aria-*`, classes) — adding one
 * would itself be a DOM-parity diff against the Angular reference (no
 * such attribute exists there). The caller is responsible for computing
 * `index` as this key's position within the SAME ordering `treeRoot`'s
 * children are rendered in — for the `'flat'` variant, that's the
 * ancestor-expansion-filtered `visible` list (DOM order matches exactly,
 * one `role="treeitem"` per visible node); for `'nested'`, that's the
 * UNFILTERED `all` list (every node is always in the DOM, in the same
 * recursive pre-order `querySelectorAll` returns them in).
 */
export function focusTreeNodeAtIndex(treeRoot: Element, index: number): void {
  if (index < 0) return;
  const items = treeRoot.querySelectorAll<HTMLElement>('[role="treeitem"]');
  items[index]?.focus();
}
