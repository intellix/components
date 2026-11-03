import {component$, type Signal} from '@qwik.dev/core';
import {MatOption} from '../core/mat-option';
import {MatOptgroup} from '../core/mat-optgroup';
import {cloneJsxForReuse} from '../core/jsx-reuse';
import type {ResolvedSelectNode, ResolvedSelectOption} from './select-option-resolver';

/**
 * The content `MatSelect` attaches to its overlay — the literal
 * `.mat-mdc-select-panel` listbox div (`select.html`'s `<ng-template
 * cdk-connected-overlay>` content), rendered by `qwik-cdk/overlay`'s
 * `OverlayHost` as the sole child of `.cdk-overlay-pane`.
 *
 * Created once per `open()` session (see `select-runtime.ts`'s
 * `openSelectPanel` — same "fresh overlay per open" simplification
 * `qwik-material/tooltip` already established). `value`/`activeIndex`/
 * `exiting` are passed as the ACTUAL `Signal` objects `MatSelect` owns
 * (never `.value`) — this is what keeps this component's own renders live
 * across the whole open session (arrow-key navigation, multi-select
 * toggling, the exit-animation class) despite living in a completely
 * separate component tree from `MatSelect` itself; see
 * `core/mat-form-field-control.ts`'s doc comment and `tooltip-runtime.ts`'s
 * own `TooltipPanel` wiring for the same, already-proven pattern.
 * `onOptionSelect` is a plain (non-`$()`) callback — safe here because the
 * whole overlay subsystem is created and consumed client-side, within the
 * same execution context, never crossing an SSR→resume boundary (mirrors
 * `showTooltip`'s `triggerElement: trigger` passing a raw `HTMLElement` the
 * same way).
 */
export interface MatSelectPanelProps {
  id: string;
  tree: readonly ResolvedSelectNode[];
  multiple: boolean;
  value: Signal<unknown>;
  activeIndex: Signal<number>;
  /** See `SelectRuntimeSignals.activeOptionHidden`'s own doc comment
   *  (select-runtime.ts). */
  activeOptionHidden: Signal<boolean>;
  exiting: Signal<boolean>;
  hideSingleSelectionIndicator: boolean;
  panelClass: readonly string[];
  color: 'primary' | 'accent' | 'warn' | undefined;
  ariaLabel: string | undefined;
  ariaLabelledby: string | null;
  animationsDisabled: boolean;
  panelRef: Signal<Element | undefined>;
  onOptionSelect: (option: ResolvedSelectOption) => void;
  /** Mirrors upstream `MatSelect.compareWith` — a PLAIN, already-resolved comparator (never a
   *  QRL): `select-runtime.ts`'s `openSelectPanel` resolves `SelectRuntimeConfig.compareWith$`
   *  exactly once per open session before creating this component, since `MatSelectPanel` is
   *  created and consumed entirely client-side via `overlay.create()` — the same "plain function
   *  prop is safe here" precedent `onOptionSelect` above already establishes. `undefined` ⇒
   *  strict `===` (upstream's own default). */
  compareFn?: (o1: unknown, o2: unknown) => boolean;
}

function isSelected(
  value: unknown,
  option: ResolvedSelectOption,
  multiple: boolean,
  compareFn: (o1: unknown, o2: unknown) => boolean = (o1, o2) => o1 === o2,
): boolean {
  if (multiple) {
    return Array.isArray(value) && value.some(v => compareFn(option.value, v));
  }
  return compareFn(option.value, value);
}

export const MatSelectPanel = component$<MatSelectPanelProps>(props => {
  const classes = [
    'mat-mdc-select-panel',
    'mdc-menu-surface',
    'mdc-menu-surface--open',
    ...props.panelClass,
    !props.animationsDisabled && 'mat-select-panel-animations-enabled',
    props.color === 'primary' && 'mat-primary',
    props.color === 'accent' && 'mat-accent',
    props.color === 'warn' && 'mat-warn',
    !props.color && 'mat-undefined',
    props.exiting.value && 'mat-select-panel-exit',
  ].filter(Boolean) as string[];

  const renderOption = (option: ResolvedSelectOption, groupInertLabel?: string) => (
    <MatOption
      key={option.id}
      id={option.id}
      value={option.value}
      echoValueAttr={option.echoValueAttr}
      disabled={option.disabled}
      selected={isSelected(props.value.value, option, props.multiple, props.compareFn)}
      active={!props.activeOptionHidden.value && props.activeIndex.value === option.index}
      multiple={props.multiple}
      hideSingleSelectionIndicator={props.hideSingleSelectionIndicator}
      groupInertLabel={groupInertLabel}
      onSelectInteraction$={() => props.onOptionSelect(option)}
    >
      {/* `cloneJsxForReuse`, not `option.content` directly — this component re-renders
          itself (`props.exiting.value`'s `classes` dependency above, also `activeIndex`/
          `activeOptionHidden`) more than once per open while `option.content` (when an option
          uses rich, non-plain-text content) stays the SAME object across those re-renders.
          Confirmed as a real Qwik v2 regression for the identical pattern in
          `qwik-material/menu`'s `MenuPanel` (see `core/jsx-reuse.ts`'s doc comment) — applied
          here preemptively, since no current scenario exercises non-string `content`, but the
          failure mode (a `<Slot/>`-projected custom option body silently going empty) is
          identical and confirmed to need this. A no-op for the common case (`content` is a
          plain string — the vast majority of options — which `cloneJsxForReuse` returns
          unchanged). */}
      {cloneJsxForReuse(option.content)}
    </MatOption>
  );

  return (
    <div
      ref={props.panelRef}
      role="listbox"
      tabIndex={-1}
      id={props.id}
      class={classes}
      aria-multiselectable={props.multiple ? 'true' : 'false'}
      aria-label={props.ariaLabel || undefined}
      aria-labelledby={props.ariaLabelledby || undefined}
    >
      {props.tree.map(node =>
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
