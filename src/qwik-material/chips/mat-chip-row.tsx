import {$, component$, Slot, useSignal, type JSXOutput, type QRL} from '@builder.io/qwik';
import {useFocusOrigin, useIdGenerator} from '@angular-community/qwik-cdk/a11y';
import {useAnimationsDisabled} from '../dialog/use-animations-disabled';
import {rippleLoaderHostAttrs, useRippleLoader} from './internal/ripple-loader';
import type {MatChipRemoveButtonDef} from './mat-chip';

/**
 * Props for `<MatChipRow>` — upstream `MatChipRow` (`src/material/chips/chip-row.ts`), the
 * chip used inside `<MatChipGrid>`. Same "independent host, not a wrapper around `<MatChip>`"
 * note as `MatChipOption` applies here too — but ALSO the same "inherited, un-overridden base
 * `MatChip` host bindings still apply" note (see `mat-chip-option.tsx`'s module doc comment):
 * `mat-primary`/`mat-mdc-standard-chip`/`_mat-animation-noopable` all come from the base
 * `MatChip`'s host metadata, which `MatChipRow`'s own `@Component({host: {...}})` never
 * redeclares. Backspace/Delete/Enter keydown IS explicitly overridden here (matches
 * upstream's `override _handleKeydown`).
 *
 * `editable`/`matChipEdit` (upstream's inline-editing feature) is NOT implemented — no parity
 * scenario exercises it (see chips/SYNC.md deviations). The row's primary action is a `<span
 * role="gridcell">`, never a `<button>` (unlike `MatChipOption`'s primary `<button>`) — see the
 * parity spec's shared role-split note.
 */
export interface MatChipRowProps {
  id?: string;
  disabled?: boolean;
  highlighted?: boolean;
  /** M2-only theme color — inherited from the base `MatChip`; same `'primary'` default. */
  color?: string | null;
  removable?: boolean;
  disableRipple?: boolean;
  avatar?: JSXOutput;
  trailingIcon?: JSXOutput;
  removeButton?: MatChipRemoveButtonDef;
  onRemoved$?: QRL<() => void>;
  /** Set by the owning `<MatChipGrid>` — mirrors upstream's `chip._chipListDisabled`. */
  chipListDisabled?: boolean;
  class?: string | ReadonlyArray<string>;
}

export const MatChipRow = component$<MatChipRowProps>(props => {
  const idGen = useIdGenerator();
  const autoId = useSignal(() => idGen.getId('mat-mdc-chip-'));
  const id = props.id ?? autoId.value;

  const disabled = (props.disabled ?? false) || (props.chipListDisabled ?? false);
  const removable = props.removable ?? true;
  const highlighted = props.highlighted ?? false;
  const color = props.color ?? 'primary';
  const disableRipple = props.disableRipple ?? false;

  const hasAvatar = props.avatar != null;
  const hasTrailingIcon = props.trailingIcon != null || props.removeButton != null;
  // Chip-row's primary action is always the gridcell `<span matChipAction>` — like
  // chip-option, this always exists, so a row is never ripple-disabled via "no actions".
  const hasInteractiveActions = true;

  const animationsDisabled = useAnimationsDisabled();
  const rippleInitialized = useRippleLoader();
  const rippleDisabled =
    disabled || disableRipple || animationsDisabled.value || !hasInteractiveActions;

  const focusOrigin = useFocusOrigin();

  const primaryRef = useSignal<Element>();

  const removeDisabled = disabled || (props.removeButton?.disabled ?? false);

  const remove$ = $(() => {
    if (removable) props.onRemoved$?.();
  });

  // Mirrors `_handleKeydown`: ENTER is swallowed entirely (editing isn't implemented, so
  // neither the "finish edit" nor "start edit" branch ever applies); any other key falls to
  // the base `MatChip` Backspace(no-repeat)/Delete removal.
  const handleHostKeydown$ = $((event: KeyboardEvent) => {
    if (event.key === 'Enter') return;
    if ((event.key === 'Backspace' && !event.repeat) || event.key === 'Delete') {
      event.preventDefault();
      remove$();
    }
  });

  // Mirrors `_handleFocus()`: clicking/focusing anywhere inside a row (the host itself is
  // focusable at tabindex -1) redirects real DOM focus to the primary gridcell.
  const handleHostFocus$ = $(() => {
    if (!disabled) {
      (primaryRef.value as HTMLElement | undefined)?.focus();
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

  const classes = [
    'mat-mdc-chip',
    'mat-mdc-chip-row',
    `mat-${color || 'primary'}`,
    'mat-mdc-standard-chip',
    'mdc-evolution-chip',
    hasAvatar && 'mat-mdc-chip-with-avatar',
    disabled && 'mat-mdc-chip-disabled',
    disabled && 'mdc-evolution-chip--disabled',
    hasTrailingIcon && 'mdc-evolution-chip--with-trailing-action',
    hasAvatar && 'mdc-evolution-chip--with-primary-graphic',
    hasAvatar && 'mdc-evolution-chip--with-primary-icon',
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

  return (
    <mat-chip-row
      id={id}
      class={classes}
      role="row"
      tabIndex={disabled ? undefined : -1}
      {...rippleLoaderHostAttrs({className: 'mat-mdc-chip-ripple'})}
      mat-ripple-loader-disabled={rippleDisabled ? '' : undefined}
      mat-ripple-loader-uninitialized={rippleInitialized.value ? undefined : ''}
      onFocus$={handleHostFocus$}
      onKeyDown$={handleHostKeydown$}
    >
      <span class="mat-mdc-chip-focus-overlay" />
      <span
        ref={primaryRef}
        {...({matchipaction: ''} as Record<string, string>)}
        class="mat-mdc-chip-action mdc-evolution-chip__action mdc-evolution-chip__action--primary"
        role="gridcell"
        tabIndex={disabled ? undefined : -1}
        {...(disabled ? {disabled: ''} : {})}
        aria-disabled={disabled ? 'true' : 'false'}
      >
        {hasAvatar && (
          <span class="mdc-evolution-chip__graphic mat-mdc-chip-graphic">
            <span
              class="mat-mdc-chip-avatar mdc-evolution-chip__icon mdc-evolution-chip__icon--primary"
              role="img"
            >
              {props.avatar}
            </span>
          </span>
        )}
        <span class="mdc-evolution-chip__text-label mat-mdc-chip-action-label">
          <Slot />
          <span
            class="mat-mdc-chip-primary-focus-indicator mat-focus-indicator"
            aria-hidden="true"
          />
        </span>
      </span>
      {hasTrailingIcon && (
        <span class="mdc-evolution-chip__cell mdc-evolution-chip__cell--trailing" role="gridcell">
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
              tabIndex={-1}
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
    </mat-chip-row>
  );
});
