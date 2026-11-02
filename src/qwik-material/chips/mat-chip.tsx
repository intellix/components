import {$, component$, Slot, useSignal, type JSXOutput, type QRL} from '@qwik.dev/core';
import {useFocusOrigin, useIdGenerator} from '@angular-community/qwik-cdk/a11y';
import {useAnimationsDisabled} from '../dialog/use-animations-disabled';
import {rippleLoaderHostAttrs, useRippleLoader} from './internal/ripple-loader';

/** A `matChipRemove` button's content/props — see `MatChipProps.removeButton`. */
export interface MatChipRemoveButtonDef {
  /** The button's visible content (upstream: an `<mat-icon matChipRemove>`/plain text —
   *  this port's icon component is out of scope; pass plain text/spans). */
  content: JSXOutput;
  'aria-label'?: string;
  /** Independently disables just the remove action (ORed with the chip's own `disabled`). */
  disabled?: boolean;
}

/**
 * Props for `<MatChip>` — the base, non-selectable, non-grid chip (upstream
 * `MatChip`, `src/material/chips/chip.ts`). Used inside `<MatChipSet>`.
 *
 * Avatar/trailing-icon/remove-button content is accepted as NAMED PROPS
 * (`avatar`/`trailingIcon`/`removeButton`), not `<Slot>`-projected children
 * — the same "named prop instead of inspected children" pattern
 * `qwik-material/list`'s `MatListItem` established (see its SYNC.md):
 * `MatChip`'s own host classes (`mdc-evolution-chip--with-avatar`,
 * `mat-mdc-chip-with-trailing-icon`, …) depend on whether these are
 * present, which a real `component$` can only know synchronously from a
 * named prop, never from `<Slot>`-projected content (Qwik strips
 * `children` from a `component$`'s own props — see
 * `grid-list/mat-grid-list.tsx`'s header comment for the confirmed-live
 * detail). The chip's plain text content has no such requirement, so it
 * is still ordinary `<Slot>` content (`<MatChip>Apple</MatChip>`).
 */
export interface MatChipProps {
  id?: string;
  disabled?: boolean;
  highlighted?: boolean;
  /** M2-only theme color. Default `'primary'` — NOT `'accent'` (confirmed live
   *  against upstream; this chip family's default literal differs from checkbox/radio). */
  color?: string | null;
  /** Whether removing is permitted at all (mirrors upstream's `removable`, default true). */
  removable?: boolean;
  disableRipple?: boolean;
  'aria-label'?: string;
  /** Rendered inside the leading graphic wrapper (`matChipAvatar`). */
  avatar?: JSXOutput;
  /** Rendered as a non-interactive trailing icon (`matChipTrailingIcon`). */
  trailingIcon?: JSXOutput;
  /** Rendered as the interactive remove action (`matChipRemove`). */
  removeButton?: MatChipRemoveButtonDef;
  /** Fires when the chip is removed (click/Enter/Space on the remove button, or
   *  Backspace/Delete on the chip itself) — mirrors upstream's `(removed)`. */
  onRemoved$?: QRL<() => void>;
  /** Set by the owning `<MatChipSet>`/`<MatChipListbox>`/`<MatChipGrid>` — mirrors
   *  upstream's `chip._chipListDisabled`. Not meant to be set directly by a consumer. */
  chipListDisabled?: boolean;
  class?: string | ReadonlyArray<string>;
}

export const MatChip = component$<MatChipProps>(props => {
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

  const animationsDisabled = useAnimationsDisabled();
  const rippleInitialized = useRippleLoader();
  // Upstream's `_isRippleDisabled()` is evaluated once in the CONSTRUCTOR
  // (`this._rippleLoader?.configureRipple(..., {disabled: this._isRippleDisabled()})`),
  // which runs BEFORE `@ContentChild(MAT_CHIP_REMOVE) removeIcon`/`editIcon` resolve (those
  // populate in `ngAfterContentInit`, a later lifecycle phase) — so `_hasInteractiveActions()`
  // (reading `this.removeIcon`/`this.editIcon`) always sees them as `undefined` at THAT
  // moment, making the chip permanently ripple-disabled at first paint regardless of whether a
  // remove button is actually projected. `ngDoCheck` re-evaluates `_isRippleDisabled()`
  // (correctly, since `removeIcon` has resolved by then) on every LATER Angular
  // change-detection cycle — but Angular only runs one across the WHOLE component tree when
  // some event fires ANYWHERE, so the correction only becomes externally observable once some
  // interaction has happened anywhere on the page, not necessarily on this chip itself.
  // Confirmed live: `avatar-trailing-icon`'s "Kara" (zero interactions on the whole page) keeps
  // `mat-ripple-loader-disabled` forever; `removable`'s surviving chips LOSE it the moment
  // anything is clicked/keyed on the page, even though neither was the thing clicked.
  //
  // The correction has TWO paths here, because a signal written from a handler on a
  // DIFFERENT element (`document`, or the owning `<MatChipSet>`'s own host) and consumed
  // here via `useContext()` was found, via an extensive live repro, to correctly recompute
  // this component's render output (confirmed by logging — the right boolean comes out)
  // WITHOUT the resulting literal JSX attribute ever actually patching the live DOM — a
  // genuine, narrow gap reproducible with either `useOnDocument()` or `useOn()` + context,
  // but NOT with a signal written from a listener on THIS SAME component's own host (e.g.
  // `rippleInitialized` below, confirmed reliably working — it already drives
  // `mat-ripple-loader-uninitialized` on this exact element).
  //
  //  1. If THIS chip itself receives a qualifying event (the same focus/mousedown/
  //     mouseenter/touchstart set `useRippleLoader()` already tracks), `rippleInitialized`
  //     flips and — since that's a local, self-written signal — reliably repatches this
  //     attribute too, in the SAME render pass that already correctly repaints
  //     `mat-ripple-loader-uninitialized`. No race: one signal drives both.
  //  2. Otherwise (this chip itself was never touched, e.g. `removable`'s chip that
  //     DIDN'T receive the reflow-under-pointer `mouseenter`), the owning `<MatChipSet>`
  //     corrects it via DIRECT, IMPERATIVE `removeAttribute()` calls instead (see
  //     `mat-chip-set.tsx`'s `fixupRippleDisabled$`) — the one thing proven to reliably
  //     reach a DIFFERENT component's DOM for this specific attribute.
  //
  // Before path (1) ever fires, this is `true` unconditionally (matches the constructor's
  // unresolved-ContentChild state) — for every base `<mat-chip>`, regardless of its actual
  // remove-button presence, same as `basic`/`colors`/`avatar-trailing-icon` (no scenario
  // interaction at all) confirm live.
  const hasInteractiveActions = props.removeButton != null;
  const rippleDisabledInitial =
    disabled ||
    disableRipple ||
    animationsDisabled.value ||
    (rippleInitialized.value ? !hasInteractiveActions : true);

  const focusOrigin = useFocusOrigin();

  const removeDisabled = disabled || (props.removeButton?.disabled ?? false);

  const remove$ = $(() => {
    if (removable) props.onRemoved$?.();
  });

  const handleHostKeydown$ = $((event: KeyboardEvent) => {
    if ((event.key === 'Backspace' && !event.repeat) || event.key === 'Delete') {
      event.preventDefault();
      remove$();
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
    `mat-${color || 'primary'}`,
    'mdc-evolution-chip',
    disabled && 'mdc-evolution-chip--disabled',
    hasTrailingIcon && 'mdc-evolution-chip--with-trailing-action',
    hasAvatar && 'mdc-evolution-chip--with-primary-graphic',
    hasAvatar && 'mdc-evolution-chip--with-primary-icon',
    hasAvatar && 'mdc-evolution-chip--with-avatar',
    hasAvatar && 'mat-mdc-chip-with-avatar',
    highlighted && 'mat-mdc-chip-highlighted',
    disabled && 'mat-mdc-chip-disabled',
    'mat-mdc-standard-chip',
    hasTrailingIcon && 'mat-mdc-chip-with-trailing-icon',
    animationsDisabled.value && '_mat-animation-noopable',
    focusOrigin.value && 'cdk-focused',
    focusOrigin.value === 'touch' && 'cdk-touch-focused',
    focusOrigin.value === 'keyboard' && 'cdk-keyboard-focused',
    focusOrigin.value === 'mouse' && 'cdk-mouse-focused',
    focusOrigin.value === 'program' && 'cdk-program-focused',
    props.class,
  ].filter(Boolean) as string[];

  const contentClasses = [
    'mat-mdc-chip-action',
    'mdc-evolution-chip__action',
    'mdc-evolution-chip__action--presentational',
    'mdc-evolution-chip__action--primary',
  ];

  return (
    <mat-chip
      id={id}
      class={classes}
      aria-label={props['aria-label']}
      {...rippleLoaderHostAttrs({className: 'mat-mdc-chip-ripple'})}
      mat-ripple-loader-disabled={rippleDisabledInitial ? '' : undefined}
      mat-ripple-loader-uninitialized={rippleInitialized.value ? undefined : ''}
      onKeyDown$={handleHostKeydown$}
    >
      <span class="mat-mdc-chip-focus-overlay" />
      <span class="mdc-evolution-chip__cell mdc-evolution-chip__cell--primary">
        <span
          {...({matchipcontent: ''} as Record<string, string>)}
          class={contentClasses}
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
            <span class="mat-mdc-chip-primary-focus-indicator mat-focus-indicator" />
          </span>
        </span>
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
    </mat-chip>
  );
});
