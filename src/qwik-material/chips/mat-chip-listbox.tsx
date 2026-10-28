import {
  $,
  component$,
  useContextProvider,
  useSignal,
  type JSXOutput,
  type QRL,
} from '@builder.io/qwik';
import {isBrowser} from '@builder.io/qwik/build';
import {MatChipOption} from './mat-chip-option';
import type {MatChipRemoveButtonDef} from './mat-chip';
import {
  MAT_CHIP_LISTBOX_SELECTION,
  type MatChipListboxSelectionState,
} from './internal/listbox-selection';

/** Descriptor for one `<MatChipOption>` rendered inside `<MatChipListbox options={[...]}>`.
 *  See `mat-chip-set.tsx`'s module doc comment for why containers take a data array. */
export interface MatChipOptionDef {
  /** Stable identity for this entry — see `MatChipDef.key`'s doc comment in `mat-chip-set.tsx`. */
  key?: string | number;
  id?: string;
  content: JSXOutput;
  value?: unknown;
  /** Current selection state — the consumer owns this (controlled component, same
   *  convention as `MatButtonToggleGroup`'s `values`/`onValuesChange$`). */
  selected?: boolean;
  disabled?: boolean;
  highlighted?: boolean;
  color?: string | null;
  removable?: boolean;
  disableRipple?: boolean;
  avatar?: JSXOutput;
  trailingIcon?: JSXOutput;
  removeButton?: MatChipRemoveButtonDef;
  onRemoved$?: QRL<() => void>;
  'aria-label'?: string;
  'aria-description'?: string;
  class?: string | ReadonlyArray<string>;
}

export interface MatChipListboxChangeEvent {
  value: unknown;
}

/** Props for `<MatChipListbox>` — upstream `MatChipListbox`
 *  (`src/material/chips/chip-listbox.ts`). See `mat-chip-set.tsx`'s module doc comment
 *  for why `options: MatChipOptionDef[]` replaces nested `<MatChipOption>` children. */
export interface MatChipListboxProps {
  options: MatChipOptionDef[];
  multiple?: boolean;
  disabled?: boolean;
  /** Default true. When false, selection changes are ignored entirely (propagates to
   *  every option's own `selectable`). */
  selectable?: boolean;
  hideSingleSelectionIndicator?: boolean;
  required?: boolean;
  'aria-label'?: string;
  'aria-labelledby'?: string;
  'aria-orientation'?: 'horizontal' | 'vertical';
  id?: string;
  class?: string | ReadonlyArray<string>;
  /** Fires when the user changes the selection (click/Space/Enter on a selectable option).
   *  `value` is the clicked option's `value` (single-select) or the full array of currently-
   *  selected values in DOM order (multi-select) — mirrors upstream's `MatChipListboxChange`. */
  onChange$?: QRL<(event: MatChipListboxChangeEvent) => void>;
}

function getOptionButtons(root: Element | undefined): HTMLButtonElement[] {
  if (!root) return [];
  return Array.from(root.querySelectorAll<HTMLButtonElement>('button[role="option"]'));
}

export const MatChipListbox = component$<MatChipListboxProps>(props => {
  const disabled = props.disabled ?? false;
  const multiple = props.multiple ?? false;
  const selectable = props.selectable ?? true;
  const hideSingleSelectionIndicator = props.hideSingleSelectionIndicator ?? false;
  const required = props.required ?? false;
  const ariaOrientation = props['aria-orientation'] ?? 'horizontal';
  const empty = props.options.length === 0;
  // Upstream `role` getter (base `MatChipSet`, inherited): `empty ? null : _defaultRole`,
  // `_defaultRole = 'listbox'` for the listbox subclass.
  const role = empty ? undefined : 'listbox';
  // Upstream `[tabIndex]="(disabled || empty) ? -1 : tabIndex"`.
  const tabIndexValue = disabled || empty ? -1 : 0;
  // Upstream `[attr.aria-required]="role ? required : null"`.
  const ariaRequired: 'true' | 'false' | undefined = role
    ? required
      ? 'true'
      : 'false'
    : undefined;

  const containerRef = useSignal<Element>();

  // See `internal/listbox-selection.ts` for why selection state flows to each
  // `<MatChipOption>` through this context-provided signal rather than through its own
  // `selected` prop (a real Qwik reactivity gap, found live, for a child rendered from a
  // `.map()` over a same-length, same-keyed array).
  const nextSelectionState: MatChipListboxSelectionState = {
    multiple,
    value: multiple ? undefined : props.options.find(o => o.selected)?.value,
    values: multiple ? props.options.filter(o => o.selected).map(o => o.value) : [],
  };
  const selectionSignal = useSignal(nextSelectionState);
  selectionSignal.value = nextSelectionState;
  useContextProvider(MAT_CHIP_LISTBOX_SELECTION, selectionSignal);

  const handleContainerFocus$ = $(() => {
    // Mirrors upstream `MatChipListbox.focus()`, invoked via the host's own
    // non-bubbling `(focus)` binding (fires only when the CONTAINER itself —
    // not a descendant button — receives DOM focus, e.g. Tab landing on it).
    if (disabled) return;
    const buttons = getOptionButtons(containerRef.value);
    if (!buttons.length) return;
    const selectedButton = buttons.find(b => b.getAttribute('aria-selected') === 'true');
    (selectedButton ?? buttons[0])?.focus();
  });

  const handleKeydown$ = $((event: KeyboardEvent) => {
    if (!isBrowser) return;
    const buttons = getOptionButtons(containerRef.value);
    if (!buttons.length) return;
    const active = document.activeElement;
    const index = active ? buttons.indexOf(active as HTMLButtonElement) : -1;
    let nextIndex: number | null = null;
    // Upstream's `FocusKeyManager` is configured with BOTH `withVerticalOrientation()` AND
    // `withHorizontalOrientation(dir)` regardless of `ariaOrientation` (chip-set.ts
    // `_setUpFocusManagement`) — so Left/Right and Up/Down both always navigate. No
    // `.withWrap()` is configured, so movement clamps at the ends instead of wrapping.
    if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
      nextIndex = Math.max(0, index - 1);
    } else if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
      nextIndex = index === -1 ? 0 : Math.min(buttons.length - 1, index + 1);
    } else if (event.key === 'Home') {
      nextIndex = 0;
    } else if (event.key === 'End') {
      nextIndex = buttons.length - 1;
    } else {
      return;
    }
    event.preventDefault();
    buttons[nextIndex]?.focus();
  });

  const handleOptionSelectedChange$ = $((index: number, nextSelected: boolean) => {
    const opts = props.options;
    const def = opts[index];
    if (!def) return;
    let value: unknown;
    if (props.multiple) {
      // Upstream: `this._chips.toArray().map(chip => chip.value)` — DOM order, not selection
      // order (confirmed live: selecting Parking after Wifi/Pool were already selected
      // produces "wifi, parking, pool", not "wifi, pool, parking"). Iterate `opts` in their
      // own order, substituting the NEW state only at the toggled index.
      value = opts.filter((o, i) => (i === index ? nextSelected : o.selected)).map(o => o.value);
    } else {
      value = nextSelected ? def.value : undefined;
    }
    props.onChange$?.({value});
  });

  // `mat-mdc-chip-set` comes from the base `MatChipSet`'s own static host `class` string
  // (`'mat-mdc-chip-set mdc-evolution-chip-set'`) — confirmed live that Angular's host
  // metadata inheritance UNIONS static class tokens across the whole directive chain rather
  // than letting a subclass's own `class` key fully replace the base's (unlike a `[class.x]`/
  // `[attr.x]` BINDING, which the subclass redeclaring the SAME key does fully override — see
  // `mat-chip-option.tsx`'s module doc comment for that half of the inheritance story).
  const classes = [
    'mat-mdc-chip-set',
    'mdc-evolution-chip-set',
    'mat-mdc-chip-listbox',
    disabled && 'mat-mdc-chip-list-disabled',
    required && 'mat-mdc-chip-list-required',
    props.class,
  ].filter(Boolean) as string[];

  return (
    <mat-chip-listbox
      ref={containerRef}
      id={props.id}
      class={classes}
      role={role}
      tabIndex={tabIndexValue}
      aria-required={ariaRequired}
      aria-disabled={disabled ? 'true' : 'false'}
      aria-multiselectable={multiple ? 'true' : 'false'}
      aria-orientation={ariaOrientation}
      aria-label={props['aria-label']}
      aria-labelledby={props['aria-labelledby']}
      onFocus$={handleContainerFocus$}
      onKeyDown$={handleKeydown$}
    >
      <div class="mdc-evolution-chip-set__chips" role="presentation">
        {props.options.map((def, i) => (
          <MatChipOption
            key={def.key ?? def.id ?? i}
            id={def.id}
            value={def.value}
            selected={def.selected}
            disabled={def.disabled}
            chipListDisabled={disabled}
            chipListMultiple={multiple}
            chipListHideSingleSelectionIndicator={hideSingleSelectionIndicator}
            selectable={selectable}
            highlighted={def.highlighted}
            color={def.color}
            removable={def.removable}
            disableRipple={def.disableRipple}
            avatar={def.avatar}
            trailingIcon={def.trailingIcon}
            removeButton={def.removeButton}
            onRemoved$={def.onRemoved$}
            aria-label={def['aria-label']}
            aria-description={def['aria-description']}
            onSelectedChange$={$((nextSelected: boolean, _isUserInput: boolean) =>
              handleOptionSelectedChange$(i, nextSelected),
            )}
            class={def.class}
          >
            {def.content}
          </MatChipOption>
        ))}
      </div>
    </mat-chip-listbox>
  );
});
