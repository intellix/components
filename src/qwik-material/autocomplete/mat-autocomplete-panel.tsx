import {component$, type Signal} from '@qwik.dev/core';
import {MatOption} from '../core/mat-option';
import {MatOptgroup} from '../core/mat-optgroup';
import {cloneJsxForReuse} from '../core/jsx-reuse';
import type {
  ResolvedAutocompleteNode,
  ResolvedAutocompleteOption,
} from './autocomplete-option-resolver';

/**
 * The content `MatAutocomplete` attaches to its overlay — the literal
 * `.mat-mdc-autocomplete-panel` listbox div (`autocomplete.html`'s
 * `<ng-template>` content), rendered by `qwik-cdk/overlay`'s `OverlayHost`
 * as the sole child of `.cdk-overlay-pane`.
 *
 * Created once per `open()` session (same "fresh overlay per open"
 * simplification `qwik-material/select`'s `MatSelectPanel` already
 * establishes). `tree`/`value`/`activeIndex` are passed as the ACTUAL
 * `Signal` objects `MatAutocomplete` owns (never `.value`) — this is what
 * keeps this component's own renders live across the whole open session
 * (refiltering, arrow-key navigation, selection) despite living in a
 * completely separate component tree from `MatAutocomplete` itself; see
 * `core/mat-form-field-control.ts`'s doc comment and
 * `qwik-material/select/mat-select-panel.tsx`'s own doc comment for the
 * same, already-proven pattern. `tree` specifically needs to be a Signal
 * (unlike `MatSelectPanel`, whose `tree` is a plain, once-only value) —
 * see `autocomplete-runtime.ts`'s doc comment for why: this port's
 * `options` prop is deliberately reactive (refiltering happens live, while
 * the SAME overlay session stays open).
 *
 * `onOptionSelect` is a plain (non-`$()`) callback — safe here because the
 * whole overlay subsystem is created and consumed client-side, within the
 * same execution context, never crossing an SSR→resume boundary (mirrors
 * `MatSelectPanel`'s own `onOptionSelect` prop).
 */
export interface MatAutocompletePanelProps {
  id: string;
  tree: Signal<readonly ResolvedAutocompleteNode[]>;
  value: Signal<unknown>;
  activeIndex: Signal<number>;
  hideSingleSelectionIndicator: boolean;
  /** Consumer-supplied `[class]` on `<mat-autocomplete>` — merged onto the
   *  panel div verbatim (upstream's `_classList`, see autocomplete.ts). */
  panelClass: readonly string[];
  color: 'primary' | 'accent' | 'warn' | undefined;
  ariaLabel: string | undefined;
  ariaLabelledby: string | null;
  animationsDisabled: boolean;
  panelRef: Signal<Element | undefined>;
  onOptionSelect: (option: ResolvedAutocompleteOption) => void;
}

export const MatAutocompletePanel = component$<MatAutocompletePanelProps>(props => {
  const tree = props.tree.value;
  // Mirrors `MatAutocomplete.showPanel = !!this.options?.length` — flat
  // count, not tree-node count (an empty group still contributes 0 flat
  // options). Computed from `tree` directly (cheaper than threading a
  // separate `flat` signal just for this one boolean).
  const flatCount = tree.reduce(
    (count, node) => count + (node.kind === 'option' ? 1 : node.options.length),
    0,
  );
  const showPanel = flatCount > 0;

  const classes = [
    'mat-mdc-autocomplete-panel',
    'mdc-menu-surface',
    'mdc-menu-surface--open',
    ...props.panelClass,
    showPanel && 'mat-mdc-autocomplete-visible',
    !showPanel && 'mat-mdc-autocomplete-hidden',
    !props.animationsDisabled && 'mat-autocomplete-panel-animations-enabled',
    props.color === 'primary' && 'mat-primary',
    props.color === 'accent' && 'mat-accent',
    props.color === 'warn' && 'mat-warn',
  ].filter(Boolean) as string[];

  const renderOption = (option: ResolvedAutocompleteOption) => (
    <MatOption
      key={option.id}
      id={option.id}
      value={option.value}
      echoValueAttr={option.echoValueAttr}
      disabled={option.disabled}
      selected={props.value.value === option.value}
      active={props.activeIndex.value === option.index}
      hideSingleSelectionIndicator={props.hideSingleSelectionIndicator}
      onSelectInteraction$={() => props.onOptionSelect(option)}
    >
      {/* `cloneJsxForReuse`, not `option.content` directly — this component re-renders itself
          every time `props.tree.value` changes (live refiltering, the whole point of `tree`
          being a Signal here — see this file's own doc comment), re-interpolating whichever
          resolved options are still present. A real Qwik v2 regression, confirmed for the
          identical pattern in `qwik-material/menu`'s `MenuPanel` (see `core/jsx-reuse.ts`'s doc
          comment), applied here preemptively — see `mat-select-panel.tsx`'s matching comment for
          the full rationale (no current scenario exercises non-string `content`; a no-op for
          the common plain-string case). */}
      {cloneJsxForReuse(option.content)}
    </MatOption>
  );

  return (
    <div
      ref={props.panelRef}
      role="listbox"
      id={props.id}
      class={classes}
      aria-label={props.ariaLabel || undefined}
      aria-labelledby={props.ariaLabelledby || undefined}
    >
      {tree.map(node =>
        node.kind === 'option' ? (
          renderOption(node.option)
        ) : (
          <MatOptgroup
            key={node.group.id}
            label={node.group.label}
            disabled={node.group.disabled}
            labelId={node.group.id}
          >
            {node.options.map(option => renderOption(option))}
          </MatOptgroup>
        ),
      )}
    </div>
  );
});
