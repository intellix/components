import {$, component$, Slot, useContext, useSignal, type JSXOutput, type QRL} from '@qwik.dev/core';
import {useFocusOrigin, useIdGenerator} from '@angular-community/qwik-cdk/a11y';
import {useAnimationsDisabled} from '../dialog/use-animations-disabled';
import {rippleLoaderHostAttrs, useRippleLoader} from './internal/ripple-loader';
import {MAT_CHIP_LISTBOX_SELECTION} from './internal/listbox-selection';
import type {MatChipRemoveButtonDef} from './mat-chip';

/**
 * Props for `<MatChipOption>` — upstream `MatChipOption`
 * (`src/material/chips/chip-option.ts`), the selectable chip used inside
 * `<MatChipListbox>`.
 *
 * Note this does NOT reuse `<MatChip>`'s rendering (independently reproduces
 * chip-option.html instead) — but it DOES reproduce several of the base
 * `MatChip`'s HOST BINDINGS that `MatChipOption`'s own `@Component({host:
 * {...}})` never re-declares. Angular's Ivy compiler walks the full
 * directive inheritance chain and includes every ANCESTOR host binding
 * whose key the subclass doesn't itself redeclare — confirmed live:
 * `mat-primary`/`mat-mdc-standard-chip` (from the base's un-overridden
 * `[class]`/`[class.mat-mdc-standard-chip]` bindings) and Backspace/Delete
 * removal (from the base's un-overridden `(keydown)="_handleKeydown($event)"`
 * — dispatching polymorphically to WHICHEVER subclass's `_handleKeydown` is
 * in effect, which for `MatChipOption` is just the base implementation,
 * since it doesn't override that method) all show up on a real
 * `<mat-chip-option>`, exactly as if its host metadata were merged with the
 * base's. Only keys `MatChipOption`'s own host OBJECT re-declares (color is
 * NOT one of them) override the inherited value.
 */
export interface MatChipOptionProps {
  id?: string;
  value?: unknown;
  disabled?: boolean;
  highlighted?: boolean;
  /** M2-only theme color — inherited from the base `MatChip` (see this file's module doc
   *  comment); same `'primary'` default. */
  color?: string | null;
  removable?: boolean;
  disableRipple?: boolean;
  avatar?: JSXOutput;
  trailingIcon?: JSXOutput;
  removeButton?: MatChipRemoveButtonDef;
  onRemoved$?: QRL<() => void>;
  /** Selection state — controlled by the owning `<MatChipListbox>`. */
  selected?: boolean;
  /** Whether this chip participates in selection at all (ORed with the listbox's own
   *  `selectable`) — set by the owning `<MatChipListbox>`. */
  selectable?: boolean;
  /** Set by the owning `<MatChipListbox>` — whether it is in multi-select mode. */
  chipListMultiple?: boolean;
  /** Set by the owning `<MatChipListbox>` — whether it is disabled. */
  chipListDisabled?: boolean;
  /** Set by the owning `<MatChipListbox>` — mirrors `hideSingleSelectionIndicator`. */
  chipListHideSingleSelectionIndicator?: boolean;
  'aria-label'?: string;
  'aria-description'?: string;
  /** Fires on click/Space/Enter when selectable — the owning `<MatChipListbox>` uses
   *  this to update its own selection state (mirrors upstream's `selectionChange`). */
  onSelectedChange$?: QRL<(selected: boolean, isUserInput: boolean) => void>;
  class?: string | ReadonlyArray<string>;
}

export const MatChipOption = component$<MatChipOptionProps>(props => {
  const idGen = useIdGenerator();
  const autoId = useSignal(() => idGen.getId('mat-mdc-chip-'));
  const id = props.id ?? autoId.value;

  const disabled = (props.disabled ?? false) || (props.chipListDisabled ?? false);
  const removable = props.removable ?? true;
  const highlighted = props.highlighted ?? false;
  const color = props.color ?? 'primary';
  const disableRipple = props.disableRipple ?? false;
  // See `internal/listbox-selection.ts`'s doc comment for why the owning `<MatChipListbox>`'s
  // context-provided signal — when present — wins over the (frozen-after-first-render)
  // `selected` prop.
  const listboxSelection = useContext(MAT_CHIP_LISTBOX_SELECTION, undefined);
  const selected = listboxSelection
    ? listboxSelection.value.multiple
      ? listboxSelection.value.values.includes(props.value)
      : listboxSelection.value.value !== undefined && listboxSelection.value.value === props.value
    : (props.selected ?? false);
  const chipListMultiple = props.chipListMultiple ?? false;
  const chipListHideSingleSelectionIndicator = props.chipListHideSingleSelectionIndicator ?? false;
  // Upstream: `selectable = this._selectable && this.chipListSelectable`.
  const selectable = (props.selectable ?? true) && true;

  const hasAvatar = props.avatar != null;
  const hasTrailingIcon = props.trailingIcon != null || props.removeButton != null;
  // Upstream `_hasLeadingGraphic()`: an avatar, or the selection checkmark
  // (shown in single-select unless explicitly hidden; always shown in multi-select).
  const hasLeadingGraphic = hasAvatar || !chipListHideSingleSelectionIndicator || chipListMultiple;
  // Chip-option's primary action is always an interactive `<button>` — never ripple-disabled
  // via "no interactive actions" the way a plain `<MatChip>` with no remove icon is.
  const hasInteractiveActions = true;

  const animationsDisabled = useAnimationsDisabled();
  const rippleInitialized = useRippleLoader();
  const rippleDisabled =
    disabled || disableRipple || animationsDisabled.value || !hasInteractiveActions;

  const focusOrigin = useFocusOrigin();

  const removeDisabled = disabled || (props.removeButton?.disabled ?? false);

  const remove$ = $(() => {
    if (removable) props.onRemoved$?.();
  });

  const handlePrimaryInteraction$ = $(() => {
    if (!disabled && selectable) {
      props.onSelectedChange$?.(!selected, true);
    }
  });

  const handlePrimaryClick$ = $((event: MouseEvent) => {
    if (!disabled) {
      event.preventDefault();
      handlePrimaryInteraction$();
    }
  });

  const handlePrimaryKeydown$ = $((event: KeyboardEvent) => {
    if ((event.key === 'Enter' || event.key === ' ') && !disabled) {
      event.preventDefault();
      handlePrimaryInteraction$();
    }
  });

  const handleRemoveClick$ = $((event: MouseEvent) => {
    if (!removeDisabled) {
      event.stopPropagation();
      event.preventDefault();
      remove$();
    }
  });

  const handleRemoveKeydown$ = $((event: KeyboardEvent) => {
    if ((event.key === 'Enter' || event.key === ' ') && !removeDisabled) {
      event.stopPropagation();
      event.preventDefault();
      remove$();
    }
  });

  // Inherited from the base `MatChip` (see module doc comment) — not overridden here.
  const handleHostKeydown$ = $((event: KeyboardEvent) => {
    if ((event.key === 'Backspace' && !event.repeat) || event.key === 'Delete') {
      event.preventDefault();
      remove$();
    }
  });

  const classes = [
    'mat-mdc-chip',
    'mat-mdc-chip-option',
    `mat-${color || 'primary'}`,
    'mat-mdc-standard-chip',
    'mdc-evolution-chip',
    'mdc-evolution-chip--filter',
    'mdc-evolution-chip--selectable',
    selected && 'mat-mdc-chip-selected',
    chipListMultiple && 'mat-mdc-chip-multiple',
    disabled && 'mat-mdc-chip-disabled',
    hasAvatar && 'mat-mdc-chip-with-avatar',
    disabled && 'mdc-evolution-chip--disabled',
    selected && 'mdc-evolution-chip--selected',
    !animationsDisabled.value && 'mdc-evolution-chip--selecting',
    hasTrailingIcon && 'mdc-evolution-chip--with-trailing-action',
    hasAvatar && 'mdc-evolution-chip--with-primary-icon',
    hasLeadingGraphic && 'mdc-evolution-chip--with-primary-graphic',
    hasAvatar && 'mdc-evolution-chip--with-avatar',
    highlighted && 'mat-mdc-chip-highlighted',
    hasTrailingIcon && 'mat-mdc-chip-with-trailing-icon',
    animationsDisabled.value && '_mat-animation-noopable',
    focusOrigin.value && 'cdk-focused',
    focusOrigin.value === 'touch' && 'cdk-touch-focused',
    focusOrigin.value === 'keyboard' && 'cdk-keyboard-focused',
    focusOrigin.value === 'mouse' && 'cdk-mouse-focused',
    focusOrigin.value === 'program' && 'cdk-program-focused',
    props.class,
  ].filter(Boolean) as string[];

  // Upstream `ariaSelected` getter: `this.selectable ? this.selected.toString() : null`.
  const ariaSelected: 'true' | 'false' | undefined = selectable
    ? selected
      ? 'true'
      : 'false'
    : undefined;

  return (
    <mat-chip-option
      id={id}
      class={classes}
      role="presentation"
      {...rippleLoaderHostAttrs({className: 'mat-mdc-chip-ripple'})}
      mat-ripple-loader-disabled={rippleDisabled ? '' : undefined}
      mat-ripple-loader-uninitialized={rippleInitialized.value ? undefined : ''}
      onKeyDown$={handleHostKeydown$}
    >
      <span class="mat-mdc-chip-focus-overlay" />
      <span class="mdc-evolution-chip__cell mdc-evolution-chip__cell--primary">
        <button
          type="button"
          {...({matchipaction: ''} as Record<string, string>)}
          class="mat-mdc-chip-action mdc-evolution-chip__action mdc-evolution-chip__action--primary"
          tabIndex={-1}
          role="option"
          aria-disabled={disabled ? 'true' : 'false'}
          aria-description={props['aria-description']}
          aria-label={props['aria-label']}
          aria-selected={ariaSelected}
          onClick$={handlePrimaryClick$}
          onKeyDown$={handlePrimaryKeydown$}
        >
          {hasLeadingGraphic && (
            <span class="mdc-evolution-chip__graphic mat-mdc-chip-graphic">
              {hasAvatar && (
                <span
                  class="mat-mdc-chip-avatar mdc-evolution-chip__icon mdc-evolution-chip__icon--primary"
                  role="img"
                >
                  {props.avatar}
                </span>
              )}
              <span class="mdc-evolution-chip__checkmark">
                <svg
                  class="mdc-evolution-chip__checkmark-svg"
                  viewBox="-2 -3 30 30"
                  focusable="false"
                  aria-hidden="true"
                >
                  <path
                    class="mdc-evolution-chip__checkmark-path"
                    fill="none"
                    stroke="currentColor"
                    d="M1.73,12.91 8.1,19.28 22.79,4.59"
                  />
                </svg>
              </span>
            </span>
          )}
          <span class="mdc-evolution-chip__text-label mat-mdc-chip-action-label">
            <Slot />
            <span class="mat-mdc-chip-primary-focus-indicator mat-focus-indicator" />
          </span>
        </button>
      </span>
      {hasTrailingIcon && (
        <span class="mdc-evolution-chip__cell mdc-evolution-chip__cell--trailing">
          {props.trailingIcon != null && (
            <span
              class="mat-mdc-chip-trailing-icon mdc-evolution-chip__icon mdc-evolution-chip__icon--trailing mat-mdc-chip-action mdc-evolution-chip__action mdc-evolution-chip__action--presentational mdc-evolution-chip__action--secondary mdc-evolution-chip__action--trailing"
              aria-hidden="true"
              aria-disabled={disabled ? 'true' : 'false'}
            >
              {props.trailingIcon}
            </span>
          )}
          {props.removeButton != null && (
            <button
              type="button"
              class="mat-mdc-chip-remove mat-mdc-chip-trailing-icon mat-focus-indicator mdc-evolution-chip__icon mdc-evolution-chip__icon--trailing mat-mdc-chip-action mdc-evolution-chip__action mdc-evolution-chip__action--secondary mdc-evolution-chip__action--trailing"
              role="button"
              tabIndex={removeDisabled ? undefined : -1}
              aria-label={props.removeButton['aria-label']}
              disabled={removeDisabled || undefined}
              aria-disabled={removeDisabled ? 'true' : 'false'}
              onClick$={handleRemoveClick$}
              onKeyDown$={handleRemoveKeydown$}
            >
              {props.removeButton.content}
            </button>
          )}
        </span>
      )}
      {rippleInitialized.value && <span class="mat-ripple mat-mdc-chip-ripple" />}
    </mat-chip-option>
  );
});
