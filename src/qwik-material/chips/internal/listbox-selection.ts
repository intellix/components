import {createContextId, type Signal} from '@qwik.dev/core';

/**
 * Context `<MatChipListbox>` provides so each descendant `<MatChipOption>` can read the
 * CURRENT selection reactively, instead of relying on its own `selected` prop.
 *
 * ## Why this exists — a real Qwik reactivity gap, found live
 *
 * `<MatChipListbox options={[...]}>` renders each `<MatChipOption selected={def.selected}
 * .../>` from a `.map()` over its `options` prop (see `mat-chip-set.tsx`'s module doc comment
 * for why containers take a data array at all). When the CONSUMER's own state changes and the
 * array is rebuilt with THE SAME length and THE SAME keys, but a DIFFERENT `selected` value
 * for one entry, `<MatChipListbox>` itself correctly re-renders (confirmed live via logging:
 * its own render body re-runs with the new value) — but the SPECIFIC `<MatChipOption>` child
 * at that array position does NOT get re-invoked, and its DOM is never patched, even though
 * its prop literally changed. This is NOT the SAME issue as `mat-chip.tsx`'s
 * `rippleDisabledInitial` one (there, the render DID re-run, just the dash-named attribute
 * patch didn't apply) — here the child's render genuinely never runs a second time at all.
 * Reproduced consistently; a stable `key` does not help, and forcing a DIFFERENT key per
 * selection state does force a remount (confirmed it then updates) but that is the wrong
 * fix — it would reset the option's identity (id, any internal state) on every selection
 * change, and upstream never destroys/recreates the chip on selection.
 *
 * The one thing proven to reliably reach a descendant reactively in this port, elsewhere too
 * (`MatButtonToggleGroup`/`MatButtonToggle`, `MatFormField`/`MAT_FORM_FIELD_CONTROL_STATE`), is
 * a CONTEXT-PROVIDED SIGNAL: the provider reassigns `.value` on every one of ITS OWN renders,
 * and the CONSUMER reads `.value` directly during its OWN render — a fundamentally different
 * Qwik subscription path than "did my own prop literal change", and the one this file uses
 * instead. `<MatChipOption>` prefers this context's answer over its own `selected` prop
 * whenever it's present (i.e. whenever actually nested in a `<MatChipListbox>`); the
 * `selected` prop remains correct for the very first SSR render (needed before any context
 * write happens) and for standalone usage with no owning listbox.
 */
export interface MatChipListboxSelectionState {
  multiple: boolean;
  /** Single-select mode: the one currently-selected value, or `undefined`. */
  value: unknown;
  /** Multi-select mode: every currently-selected value, in DOM order. */
  values: readonly unknown[];
}

export const MAT_CHIP_LISTBOX_SELECTION = createContextId<Signal<MatChipListboxSelectionState>>(
  'qwikMaterial/chipListboxSelection',
);
