import {$, component$, Slot, type QRL} from '@builder.io/qwik';
import {ENTER, SPACE, hasModifierKey} from '@angular-community/qwik-cdk/keycodes';
import {createIdGenerator} from '@angular-community/qwik-cdk/a11y';
import {MatPseudoCheckbox} from './mat-pseudo-checkbox';

/**
 * Fallback id generator, mirroring the SAME "simplified singleton" pattern
 * `MatBadge`/`MatTooltip` already use for their own fallback ids — only
 * actually exercised for a `<MatOption>` rendered WITHOUT an explicit `id`.
 * In practice every option this port renders gets an explicit one from
 * `select-option-resolver.ts` (which itself falls back to the SAME
 * `useIdGenerator()` SSR-stable counter `MatSelect` uses for everything
 * else), so this singleton is a pure safety net, not load-bearing for any
 * parity scenario.
 */
const fallbackIdGen = createIdGenerator();

/**
 * Qwik port of upstream `MatOption` (`src/material/core/option/option.ts` +
 * `option.html`). Renders the literal `<mat-option>` custom element. See
 * `mat-optgroup.tsx`'s doc comment for why this is a plain,
 * fully-props-controlled presentational component invoked internally by
 * whatever owns the option list (`MatSelect` today), rather than something
 * a consumer mounts directly with internal selection state of its own —
 * `selected`/`active` are owned and computed by the OWNER (mirrors
 * `ActiveDescendantKeyManager`'s role upstream, ported declaratively — see
 * `qwik-cdk/a11y/key-manager/list-key-manager.ts`'s doc comment).
 */
export interface MatOptionProps<T = unknown> {
  /** Mirrors `MatOption.value`. Not rendered directly (no native `value`
   *  attribute on a non-form element) — read back by the owner on select. */
  value?: T;
  /** Mirrors `MatOption.id` (`_IdGenerator().getId('mat-option-')`).
   *  Optional here — see the module doc comment's `fallbackIdGen`: a
   *  consumer-facing `<MatOption value="apple">Apple</MatOption>`
   *  descriptor (read by `select-option-resolver.ts`, never rendered
   *  directly) never sets this; whatever actually resolves/renders the
   *  option supplies one. */
  id?: string;
  /** Own disabled state OR'd with the owning group's, computed by the owner
   *  (mirrors `MatOption.disabled`'s getter: `(group && group.disabled) || this._disabled()`). */
  disabled?: boolean;
  /** Mirrors `MatOption.selected`. */
  selected?: boolean;
  /** Mirrors `MatOption.active` (`ActiveDescendantKeyManager`'s current item). */
  active?: boolean;
  /** Mirrors `MatOptionParentComponent.multiple` (read by `MatOption.multiple`). */
  multiple?: boolean;
  /** Mirrors `MatOption.hideSingleSelectionIndicator`. */
  hideSingleSelectionIndicator?: boolean;
  /**
   * The group this option belongs to, in `_inert` a11y mode only (upstream:
   * `MatAutocomplete` on Safari; never `MatSelect`). Renders the
   * visually-hidden `({{group.label}})` span `option.html` adds in that
   * mode. Omit/leave undefined for a normal (non-inert) group or no group.
   */
  groupInertLabel?: string;
  class?: string | ReadonlyArray<string>;
  /** Fires on click or Enter/Space keydown — mirrors `_selectViaInteraction()`
   *  being invoked by both `(click)` and `(keydown)` host bindings. The
   *  owner decides what selecting means (toggle for `multiple`, else select
   *  + close). Not fired when `disabled`. */
  onSelectInteraction$?: QRL<(event: MouseEvent | KeyboardEvent) => void>;
}

export const MatOption = component$<MatOptionProps>(props => {
  const disabled = props.disabled ?? false;
  const selected = props.selected ?? false;
  const active = props.active ?? false;
  const multiple = props.multiple ?? false;
  const hideSingleSelectionIndicator = props.hideSingleSelectionIndicator ?? false;
  const id = props.id ?? fallbackIdGen.getId('mat-option-');

  const classes = [
    'mat-mdc-option',
    'mdc-list-item',
    selected && 'mdc-list-item--selected',
    multiple && 'mat-mdc-option-multiple',
    active && 'mat-mdc-option-active',
    disabled && 'mdc-list-item--disabled',
    props.class,
  ].filter(Boolean) as string[];

  const onClick$ = $((event: MouseEvent) => {
    if (!disabled) props.onSelectInteraction$?.(event);
  });

  const onKeyDown$ = $((event: KeyboardEvent) => {
    if ((event.keyCode === ENTER || event.keyCode === SPACE) && !hasModifierKey(event)) {
      event.preventDefault();
      if (!disabled) props.onSelectInteraction$?.(event);
    }
  });

  return (
    <mat-option
      role="option"
      id={id}
      class={classes}
      aria-selected={selected ? 'true' : 'false'}
      aria-disabled={disabled ? 'true' : 'false'}
      onClick$={onClick$}
      onKeyDown$={onKeyDown$}
    >
      {multiple && (
        <MatPseudoCheckbox
          class="mat-mdc-option-pseudo-checkbox"
          disabled={disabled}
          state={selected ? 'checked' : 'unchecked'}
          aria-hidden="true"
        />
      )}
      <span class="mdc-list-item__primary-text">
        <Slot />
      </span>
      {!multiple && selected && !hideSingleSelectionIndicator && (
        <MatPseudoCheckbox
          class="mat-mdc-option-pseudo-checkbox"
          disabled={disabled}
          state="checked"
          appearance="minimal"
          aria-hidden="true"
        />
      )}
      {props.groupInertLabel != null && (
        <span class="cdk-visually-hidden">({props.groupInertLabel})</span>
      )}
      <div
        class="mat-mdc-option-ripple mat-focus-indicator"
        aria-hidden="true"
        {...({'mat-ripple': ''} as Record<string, string>)}
      />
    </mat-option>
  );
});
