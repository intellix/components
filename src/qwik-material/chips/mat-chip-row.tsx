import {$, component$, Slot, useOn, useSignal, type JSXOutput, type QRL} from '@qwik.dev/core';
import {isBrowser} from '@qwik.dev/core/build';
import {useFocusOrigin, useIdGenerator, type FocusOrigin} from '@angular-community/qwik-cdk/a11y';
import {useAnimationsDisabled} from '../dialog/use-animations-disabled';
import {rippleLoaderHostAttrs, useRippleLoader} from './internal/ripple-loader';
import type {MatChipRemoveButtonDef} from './mat-chip';
import {cloneJsxForReuse} from '../core/jsx-reuse';

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
 * `editable`/`matChipEdit` inline editing (upstream `MatChipRow`/`MatChipEditInput`) IS
 * implemented — see `isEditing`/`startEditing$`/`finishEditing$` below. Entry points: a
 * double-click anywhere on the chip (`_handleDoubleclick`), or pressing Enter while the row has
 * focus (`_handleKeydown`), or clicking/pressing Enter on the projected `editIcon` button
 * (`MatChipEdit._handleClick`/`_handleKeydown`, which calls `_edit()` directly, bypassing the
 * primary-action-only gate `MatChipAction._handleClick` would otherwise apply). NOT ported:
 * upstream's THIRD entry point — a single click on an ALREADY-focused chip ALSO starts editing
 * (`_handleClick`/`_alreadyFocused`, set on a raw `mousedown` listener captured before the
 * click's own focus-shift) — a real, minor, documented gap (double-click and Enter cover the
 * same outcome); also not ported: projecting your OWN custom `[matChipEditInput]` span (only
 * the DEFAULT contenteditable span `_getEditInput()` falls back to is implemented — no current
 * scenario needs a custom one). The row's primary action is a `<span role="gridcell">`, never a
 * `<button>` (unlike `MatChipOption`'s primary `<button>`) — see the parity spec's shared
 * role-split note.
 */

/**
 * Descriptor for the projected `[matChipEdit]` leading icon/button — upstream `MatChipEdit`
 * (`src/material/chips/chip-icons.ts`), which starts editing when clicked or when Enter/Space is
 * pressed on it (`_parentChip._edit(event)`), bypassing the primary-action-only gate the base
 * `matChipAction` directive otherwise applies (`MatChipEdit` sets `_isPrimary = false`). Same
 * "directive → prop" pattern as `MatChipRemoveButtonDef`.
 */
export interface MatChipEditButtonDef {
  /** The button's visible content (upstream: an `<mat-icon matChipEdit>` — this port's icon
   *  component is out of scope; pass plain text/spans). */
  content: JSXOutput;
  'aria-label'?: string;
  /** Independently disables just the edit action (ORed with the chip's own `disabled`). */
  disabled?: boolean;
}

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
  /**
   * Fires when the row is removed. Receives the ORIGIN of the triggering interaction
   * (`'mouse'` for a click, `'keyboard'` for Enter/Space on the remove button or Backspace/
   * Delete on the row itself) — the owning `<MatChipGrid>` needs this to correctly replay it
   * via `focusVia()` on whichever row slides into the removed one's place (confirmed live:
   * reading the origin back off the removed row's OWN `cdk-*-focused` class, after the fact,
   * races the same click's own pending `focusin` class update and isn't reliable — passing it
   * through the call chain directly, from whichever handler actually knows it, is).
   */
  onRemoved$?: QRL<(origin?: FocusOrigin) => void>;
  /** Set by the owning `<MatChipGrid>` — mirrors upstream's `chip._chipListDisabled`. */
  chipListDisabled?: boolean;
  class?: string | ReadonlyArray<string>;
  /** Mirrors upstream `MatChip`'s `@Input('aria-label') ariaLabel` — rendered on the primary
   *  action, not the host (upstream's own host binding forces `[attr.aria-label]: null`). */
  'aria-label'?: string;
  /** Mirrors upstream `MatChip`'s `@Input('aria-description') ariaDescription` — same
   *  "primary action, not host" placement as `aria-label` above. */
  'aria-description'?: string;
  /** Mirrors `[editable]`. Default `false`. */
  editable?: boolean;
  /** Mirrors the projected `[matChipEdit]` leading icon/button — see {@link MatChipEditButtonDef}. */
  editIcon?: MatChipEditButtonDef;
  /** Fires when editing finishes (Enter while editing, or the row losing focus entirely while
   *  editing) — mirrors upstream's `(edited)`. Receives the RAW, untrimmed edited text (upstream
   *  itself emits `_getEditInput().getValue()` untrimmed — trimming, if wanted, is the
   *  consumer's own job, same as upstream's own docs example does in its `edit()` handler). */
  onEdited$?: QRL<(value: string) => void>;
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

  const isEditing = useSignal(false);
  // Seeds the edit input's initial text — set by `startEditing$` right before flipping
  // `isEditing`, read by the plain `ref` callback that mounts the edit span (see
  // `initEditInput` below). A signal, not a plain closure variable, because the two run in
  // different renders (this one; the edit span's own mount, next render).
  const editSeedValue = useSignal('');
  const editInputRef = useSignal<HTMLElement>();

  // Upstream `_hasTrailingIcon()`/`_hasLeadingActionIcon()`: both hidden while editing.
  const hasTrailingIcon = (props.trailingIcon != null || props.removeButton != null) && !isEditing.value;
  const hasLeadingActionIcon = props.editIcon != null && !isEditing.value;

  const animationsDisabled = useAnimationsDisabled();
  const rippleInitialized = useRippleLoader();
  // Confirmed live against real Angular: unlike `MatChipOption` (whose primary action is
  // ALWAYS ripple-ENABLED from the very first render — a `<mat-chip-option>` with no remove
  // button shows no `mat-ripple-loader-disabled` attribute at all, checked directly against a
  // freshly-loaded page with zero interactions), a `<mat-chip-row>` DOES start permanently
  // ripple-disabled at first paint, the same construction-time quirk `mat-chip.tsx`'s
  // `rippleDisabledInitial` documents for the base `MatChip` (and for the SAME underlying
  // reason: `ngDoCheck`'s later correction needs some OTHER change-detection-triggering event
  // to happen anywhere on the page first). The owning `<MatChipGrid>` corrects it the same
  // way `<MatChipSet>` corrects a base chip — see its own `fixupRippleDisabled$`.
  // Upstream `override _isRippleDisabled()` also ORs in `this._isEditing` — moot here while the
  // `|| true` construction-time quirk above stays unfixed (the whole expression is already
  // unconditionally `true`), but kept alongside it so a future fix to that quirk doesn't also
  // need to remember to add this back.
  const rippleDisabled =
    disabled || disableRipple || animationsDisabled.value || isEditing.value || true;

  const focusOrigin = useFocusOrigin();

  const primaryRef = useSignal<Element>();
  const hostRef = useSignal<Element>();

  const removeDisabled = disabled || (props.removeButton?.disabled ?? false);
  const editIconDisabled = disabled || (props.editIcon?.disabled ?? false);

  const remove$ = $((origin?: FocusOrigin) => {
    if (removable) props.onRemoved$?.(origin);
  });

  /**
   * Plain `ref` callback (not `$()` — runs synchronously the moment the edit span mounts, same
   * rationale as `core/host-props.ts`'s `composeRef`). Mirrors `MatChipEditInput.initialize()`:
   * focus the span, seed its `textContent`, then move the cursor/selection to the end — needed
   * because `setValue()`'s `textContent` assignment alone leaves any caret at the START.
   */
  function initEditInput(el: Element) {
    // A `ref` callback only ever runs once a real element mounts in a real browser — SSR
    // produces JSX only, never invokes `ref` — but this guard matches the rest of this file's
    // (and `mat-chip-grid.tsx`'s) convention of an explicit `isBrowser` check regardless.
    if (!isBrowser) return;
    const native = el as HTMLElement;
    editInputRef.value = native;
    native.focus();
    native.textContent = editSeedValue.value;
    const range = document.createRange();
    range.selectNodeContents(native);
    range.collapse(false);
    const sel = window.getSelection();
    sel?.removeAllRanges();
    if (sel) sel.addRange(range);
  }

  /**
   * Mirrors `_startEditing()`. `fromEvent`, when passed, is the triggering double-click/edit-
   * icon-click `MouseEvent` — used only to replicate upstream's one guard: double-clicking the
   * REMOVE button itself must not ALSO start editing (the remove button has no `dblclick`
   * handler of its own, so the native event still bubbles to the host otherwise). Re-entrant
   * (already editing) is a no-op — upstream's own `_startEditing` has no such guard and would
   * instead restart the defer-to-next-render init sequence against whatever's CURRENTLY in the
   * edit span; not reproduced here as a deliberate, documented simplification (see this file's
   * module doc comment).
   */
  const startEditing$ = $((fromEvent?: MouseEvent) => {
    if (disabled || !props.editable || isEditing.value) return;
    if (fromEvent && (fromEvent.target as Element | null)?.closest('.mat-mdc-chip-remove')) return;
    const labelEl = primaryRef.value?.querySelector(
      '.mdc-evolution-chip__text-label',
    ) as HTMLElement | null;
    // Upstream `this.value` getter: trims. The FINAL edited value emitted by `finishEditing$`
    // below is deliberately NOT trimmed, matching upstream's own asymmetry there.
    editSeedValue.value = (labelEl?.textContent ?? '').trim();
    isEditing.value = true;
  });

  /** Mirrors `_onEditFinish()`. */
  const finishEditing$ = $(() => {
    if (!isBrowser || !isEditing.value) return;
    const editEl = editInputRef.value;
    const value = editEl?.textContent ?? '';
    isEditing.value = false;
    props.onEdited$?.(value);
    const active = document.activeElement;
    if (active === editEl || active === document.body) {
      (primaryRef.value as HTMLElement | undefined)?.focus();
    }
  });

  // Mirrors `override _handleKeydown`: Enter either finishes an in-progress edit or (when
  // `editable`) starts one; any OTHER key, while editing, is stopped from reaching the owning
  // grid's own arrow-key navigation (so typing — including arrow keys — moves the text cursor,
  // not focus between chips); otherwise falls to the base `MatChip` Backspace(no-repeat)/
  // Delete removal.
  const handleHostKeydown$ = $((event: KeyboardEvent) => {
    if (event.key === 'Enter' && !disabled) {
      if (isEditing.value) {
        event.preventDefault();
        finishEditing$();
      } else if (props.editable) {
        startEditing$();
      }
    } else if (isEditing.value) {
      event.stopPropagation();
    } else if ((event.key === 'Backspace' && !event.repeat) || event.key === 'Delete') {
      event.preventDefault();
      remove$('keyboard');
    }
  });

  // Mirrors `_handleFocus()`: clicking/focusing anywhere inside a row (the host itself is
  // focusable at tabindex -1) redirects real DOM focus to the primary gridcell — but NOT while
  // editing (upstream: `if (!this._isEditing && !this.disabled) { this.focus(); }`), since by
  // then focus belongs inside the edit span instead.
  const handleHostFocus$ = $(() => {
    if (!disabled && !isEditing.value) {
      (primaryRef.value as HTMLElement | undefined)?.focus();
    }
  });

  // Mirrors `_handleDoubleclick()`.
  const handleHostDblClick$ = $((event: MouseEvent) => {
    if (!disabled && props.editable) {
      startEditing$(event);
    }
  });

  const handleRemoveClick$ = $((event: MouseEvent) => {
    if (!removeDisabled) {
      event.stopPropagation();
      event.preventDefault();
      remove$('mouse');
    }
  });

  const handleRemoveKeydown$ = $((event: KeyboardEvent) => {
    if ((event.key === 'Enter' || event.key === ' ') && !removeDisabled) {
      event.stopPropagation();
      event.preventDefault();
      remove$('keyboard');
    }
  });

  // Mirrors `MatChipEdit._handleClick`/`_handleKeydown`: calls `_edit()` (→ `_startEditing()`
  // with NO event, so the remove-icon guard above never applies here) directly, bypassing the
  // "only the PRIMARY action reacts" gate `matChipAction`'s own click/keydown handling applies.
  const handleEditIconClick$ = $((event: MouseEvent) => {
    if (!editIconDisabled) {
      event.stopPropagation();
      event.preventDefault();
      startEditing$();
    }
  });

  const handleEditIconKeydown$ = $((event: KeyboardEvent) => {
    if ((event.key === 'Enter' || event.key === ' ') && !editIconDisabled) {
      event.stopPropagation();
      event.preventDefault();
      startEditing$();
    }
  });

  // Mirrors the constructor's `this._onBlur... if (this._isEditing...) { this._onEditFinish(); }`
  // — upstream's `_onBlur` fires once FocusMonitor sees focus leave the chip ENTIRELY (not just
  // moving from the host to the edit span within it). `focusout` bubbles; deferred one tick so a
  // focus move to ANOTHER element still inside this same row (there is none today, but matches
  // `mat-chip-grid.tsx`'s own identical deferred-focusout convention) is seen before deciding.
  useOn(
    'focusout',
    $(() => {
      setTimeout(() => {
        if (!isBrowser || !isEditing.value) return;
        const root = hostRef.value;
        const active = document.activeElement;
        const stillFocused = !!root && !!active && root.contains(active);
        if (!stillFocused) finishEditing$();
      });
    }),
  );

  const classes = [
    'mat-mdc-chip',
    'mat-mdc-chip-row',
    `mat-${color || 'primary'}`,
    'mat-mdc-standard-chip',
    'mdc-evolution-chip',
    hasAvatar && 'mat-mdc-chip-with-avatar',
    disabled && 'mat-mdc-chip-disabled',
    isEditing.value && 'mat-mdc-chip-editing',
    props.editable && 'mat-mdc-chip-editable',
    disabled && 'mdc-evolution-chip--disabled',
    hasLeadingActionIcon && 'mdc-evolution-chip--with-leading-action',
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
      ref={hostRef}
      id={id}
      class={classes}
      role="row"
      tabIndex={disabled ? undefined : -1}
      {...rippleLoaderHostAttrs({className: 'mat-mdc-chip-ripple'})}
      mat-ripple-loader-disabled={rippleDisabled ? '' : undefined}
      mat-ripple-loader-uninitialized={rippleInitialized.value ? undefined : ''}
      onFocus$={handleHostFocus$}
      onKeyDown$={handleHostKeydown$}
      onDblClick$={handleHostDblClick$}
    >
      {!isEditing.value && <span class="mat-mdc-chip-focus-overlay" />}
      {hasLeadingActionIcon && (
        <span class="mdc-evolution-chip__cell mdc-evolution-chip__cell--leading" role="gridcell">
          {/* Upstream `MatChipEdit extends MatChipAction extends MatChipContent` — Angular's
              host-metadata inheritance UNIONS every ancestor's static 'class' string (confirmed
              live against a real Angular render): MatChipContent's own `mat-mdc-chip-action
              mdc-evolution-chip__action` plus `mdc-evolution-chip__action--secondary` (from
              `_isPrimary = false`, same as the remove button below, which inherits the same way)
              land on this button TOO, alongside MatChipEdit's own literal 5 classes. */}
          <button
            type="button"
            class="mat-mdc-chip-edit mat-mdc-chip-avatar mat-focus-indicator mdc-evolution-chip__icon mdc-evolution-chip__icon--primary mat-mdc-chip-action mdc-evolution-chip__action mdc-evolution-chip__action--secondary"
            role="button"
            tabIndex={editIconDisabled ? undefined : -1}
            disabled={editIconDisabled || undefined}
            aria-disabled={editIconDisabled ? 'true' : 'false'}
            aria-label={props.editIcon?.['aria-label']}
            onClick$={handleEditIconClick$}
            onKeyDown$={handleEditIconKeydown$}
          >
            {cloneJsxForReuse(props.editIcon!.content)}
          </button>
        </span>
      )}
      <span
        ref={primaryRef}
        {...({matchipaction: ''} as Record<string, string>)}
        class="mdc-evolution-chip__cell mdc-evolution-chip__cell--primary mat-mdc-chip-action mdc-evolution-chip__action mdc-evolution-chip__action--primary"
        role="gridcell"
        tabIndex={disabled ? undefined : -1}
        {...(disabled ? {disabled: ''} : {})}
        aria-disabled={disabled ? 'true' : 'false'}
        aria-label={props['aria-label']}
        aria-description={props['aria-description']}
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
          {isEditing.value ? (
            <span
              ref={initEditInput}
              class="mat-chip-edit-input"
              role="textbox"
              tabIndex={-1}
              contentEditable="true"
            />
          ) : (
            <Slot />
          )}
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
              tabIndex={removeDisabled ? undefined : -1}
              aria-label={props.removeButton['aria-label']}
              disabled={removeDisabled || undefined}
              aria-disabled={removeDisabled ? 'true' : 'false'}
              onClick$={handleRemoveClick$}
              onKeyDown$={handleRemoveKeydown$}
            >
              {cloneJsxForReuse(props.removeButton.content)}
            </button>
          )}
        </span>
      )}
      {rippleInitialized.value && <span class="mat-ripple mat-mdc-chip-ripple" />}
    </mat-chip-row>
  );
});
