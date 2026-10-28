import {
  $,
  component$,
  useContext,
  useOn,
  useSignal,
  type JSXOutput,
  type QRL,
  type Signal,
} from '@builder.io/qwik';
import {isBrowser} from '@builder.io/qwik/build';
import {focusVia, useIdGenerator, type FocusOrigin} from '@angular-community/qwik-cdk/a11y';
import {useAnimationsDisabled} from '../dialog/use-animations-disabled';
import {MAT_FORM_FIELD_CONTROL_STATE} from '../core/mat-form-field-control';
import {MAT_CHIPS_CONFIG, MAT_CHIPS_CONFIG_DEFAULTS} from './tokens';
import {MatChipRow} from './mat-chip-row';
import type {MatChipRemoveButtonDef} from './mat-chip';

/** Descriptor for one `<MatChipRow>` rendered inside `<MatChipGrid rows={[...]}>`. See
 *  `mat-chip-set.tsx`'s module doc comment for why containers take a data array. */
export interface MatChipRowDef {
  /** Stable identity for this entry — see `MatChipDef.key`'s doc comment in `mat-chip-set.tsx`. */
  key?: string | number;
  id?: string;
  content: JSXOutput;
  disabled?: boolean;
  highlighted?: boolean;
  color?: string | null;
  removable?: boolean;
  disableRipple?: boolean;
  avatar?: JSXOutput;
  trailingIcon?: JSXOutput;
  removeButton?: MatChipRemoveButtonDef;
  onRemoved$?: QRL<() => void>;
  class?: string | ReadonlyArray<string>;
}

/** The `input[matChipInputFor]` rendered as part of `<MatChipGrid>` — see
 *  `mat-chip-grid.tsx`'s module doc comment for why the grid owns the input directly
 *  rather than accepting it as separate projected content. */
export interface MatChipGridInputDef {
  placeholder?: string;
  /** Keys (`KeyboardEvent.key`) that trigger `onTokenEnd$`. Falls back to
   *  `MatChipsConfig.separatorKeys`, then `['Enter']` — mirrors upstream's
   *  `matChipInputSeparatorKeyCodes` default of `[ENTER]`. */
  separatorKeys?: readonly string[];
  disabled?: boolean;
  id?: string;
  /** Fires when a separator key is pressed (mirrors upstream's `(matChipInputTokenEnd)`).
   *  `clear()` empties the input — call it from the handler, same as
   *  upstream's `event.chipInput.clear()`. */
  onTokenEnd$?: QRL<(value: string, clear: () => void) => void>;
}

/**
 * Props for `<MatChipGrid>` — upstream `MatChipGrid` (`src/material/chips/chip-grid.ts`),
 * which implements `MatFormFieldControl` so it can be used as `<MatFormField
 * control={<MatChipGrid .../>}>`'s control.
 *
 * ## Why the grid owns its `input` directly (a data prop, not separate projected content)
 *
 * Upstream's `matChipInputFor` is a SEPARATE directive/element (`<input
 * [matChipInputFor]="grid">`) that finds its grid via a template reference and calls
 * `grid.registerInput(this)` — after which `MatChipGrid.id` DELEGATES to the input's own id
 * (`this._chipInput ? this._chipInput.id : this._uid` — see chip-grid.ts). That delegation
 * only works because Angular's multi-pass change detection lets the grid re-evaluate `id`
 * AFTER the input has registered itself, however many ticks later that happens to be.
 *
 * This port's `<MatFormField control={<MatChipGrid .../>}>` reads `MatChipGrid`'s `id`
 * (via `readControlProps`) from the JSX descriptor BEFORE `MatChipGrid` ever renders (see
 * `core/mat-form-field-control.ts`) — there is no later tick in which an `<input>` nested
 * INSIDE `MatChipGrid` could register itself and retroactively change what was already read.
 * So the direction has to invert: the id that ends up on the real `<input>` element must be
 * decided UP FRONT, by whoever builds `<MatFormField control={<MatChipGrid .../>}>` — which
 * is only possible if `MatChipGrid` renders that `<input>` ITSELF (as this `input` prop),
 * rather than accepting it as a sibling the consumer writes independently. The consumer sets
 * `<MatChipGrid controlType="mat-chip-grid" id={someId} input={{...}}>` and `MatChipGrid`
 * renders the SAME id onto the actual `<input>` — or, when nested in a `<MatFormField>`, reads
 * `MAT_FORM_FIELD_CONTROL_STATE.assignedId` during its own render (the SAME live-context
 * mechanism `MatInput` already uses — see `input/mat-input.tsx`) and renders THAT instead,
 * so the label's `for` and the input's `id` always agree, exactly reproducing upstream's
 * externally-observable id-delegation behavior without needing the same internal mechanism.
 *
 * `controlType` must be set to `'mat-chip-grid'` explicitly by the consumer when nesting in a
 * `<MatFormField>` — `MatFormField`'s own fallback (`controlProps?.controlType ?? 'mat-input'`)
 * assumes `MatInput` when omitted (see `form-field/mat-form-field.tsx`); there was no existing
 * second control type to generalize that fallback against before this port, so this is the
 * documented, zero-risk way to get the correct `mat-mdc-form-field-type-mat-chip-grid` class
 * without touching form-field's shared code.
 */
export interface MatChipGridProps {
  /**
   * The chip rows. Accepts a plain array for standalone usage — but when `<MatChipGrid>` is
   * nested as `<MatFormField control={<MatChipGrid .../>}>`'s control (its one real use,
   * upstream), a plain array value here is FROZEN after the very first render: the whole
   * `<MatChipGrid rows={...} .../>` JSX descriptor is the VALUE of `<MatFormField>`'s `control`
   * prop, and — confirmed live, via a repro that reproduces form-field/SYNC.md's documented
   * "touched/dirty/invalid" nested-prop-staleness finding one level further down — a prop
   * nested that way never reflects a later change, even though `<MatFormField>` itself (and
   * even `<MatChipGrid>`'s OWN re-renders, triggered for an unrelated reason) keep running
   * correctly; only the SPECIFIC prop value stays stuck at whatever it was on the very first
   * render. Pass a `Signal<MatChipRowDef[]>` instead whenever rows can change after mount
   * (add/remove) AND `<MatChipGrid>` is nested in a `<MatFormField>`: create it once
   * (`useSignal(() => initialRows)`) and reassign `.value = latestRows` on every one of the
   * OWNING route/component's own renders — the same "signal reassigned on every provider
   * render" pattern `MatButtonToggleGroup`/`MatChipListbox`'s selection context already use,
   * which sidesteps the issue entirely because `<MatChipGrid>` then dereferences `.value`
   * itself, fresh, on ITS OWN every render, rather than relying on the frozen prop reference.
   */
  rows: MatChipRowDef[] | Signal<MatChipRowDef[]>;
  input?: MatChipGridInputDef;
  disabled?: boolean;
  required?: boolean;
  placeholder?: string;
  id?: string;
  /** Set to `'mat-chip-grid'` when nesting inside `<MatFormField>` — see the module doc
   *  comment above. */
  controlType?: string;
  /**
   * NOT rendered anywhere by `MatChipGrid` itself — purely a signal to the owning
   * `<MatFormField>`'s `readControlProps()` static read (see `core/mat-form-field-control.ts`)
   * that this control already has content, so the label floats correctly on the very FIRST
   * (SSR) render. `MatFormField` computes its OWN initial `shouldLabelFloat` BEFORE
   * `MatChipGrid` ever renders (design doc's SSR-ordering constraint — see
   * `form-field/SYNC.md`), so it cannot know `rows.length > 0` any other way for that one
   * first paint. Pass e.g. `value={rows.length ? rows : undefined}` (or any truthy/falsy
   * value mirroring whether `rows` starts non-empty) whenever `<MatChipGrid>` starts with
   * existing rows inside a `<MatFormField>`.
   */
  value?: unknown;
  'aria-label'?: string;
  'aria-labelledby'?: string;
  class?: string | ReadonlyArray<string>;
}

function queryRowEls(root: Element | undefined): HTMLElement[] {
  return root ? Array.from(root.querySelectorAll<HTMLElement>('mat-chip-row')) : [];
}

function queryPrimaryAction(rowEl: Element): HTMLElement | null {
  return rowEl.querySelector<HTMLElement>('[role="gridcell"].mat-mdc-chip-action');
}

export const MatChipGrid = component$<MatChipGridProps>(props => {
  const config = useContext(MAT_CHIPS_CONFIG, MAT_CHIPS_CONFIG_DEFAULTS);
  const idGen = useIdGenerator();
  const autoInputId = useSignal(() => idGen.getId('mat-mdc-chip-list-input-'));

  // See `MatChipGridProps.rows`'s own doc comment for why a `Signal` must be dereferenced
  // HERE, fresh, on every one of this component's own renders, rather than trusted as a
  // plain prop value when nested inside `<MatFormField control={...}>`.
  const rows = Array.isArray(props.rows) ? props.rows : props.rows.value;
  const disabled = props.disabled ?? false;
  const required = props.required ?? false;

  const containerRef = useSignal<Element>();
  const inputRef = useSignal<Element>();
  // Live "is the input empty" — seeded true (no scenario starts with a preset input value).
  // See input/mat-input.tsx's `emptySignal` for the same "can't re-read a frozen nested prop"
  // reasoning; here it additionally drives this component's OWN `role`/`shouldLabelFloat`.
  const inputEmpty = useSignal(true);

  // Only present when nested in a `<MatFormField control={<MatChipGrid .../>}>` — see this
  // file's module doc comment and `core/mat-form-field-control.ts`.
  const formField = useContext(MAT_FORM_FIELD_CONTROL_STATE, undefined);

  const inputDisabled = (props.input?.disabled ?? false) || disabled;
  const inputId = formField ? formField.assignedId : (props.input?.id ?? autoInputId.value);
  const inputPlaceholder = props.input?.placeholder ?? props.placeholder ?? '';
  const separatorKeys = props.input?.separatorKeys ?? config.separatorKeys ?? ['Enter'];

  // Upstream's OVERRIDDEN `empty` getter (`(!chipInput || chipInput.empty) && chips.length
  // === 0`) — polymorphically read by the inherited `role` getter (`empty ? null :
  // _defaultRole`). `tabIndex` below deliberately does NOT use this — see its own comment.
  const formControlEmpty = inputEmpty.value && rows.length === 0;
  const role = formControlEmpty ? undefined : 'grid';
  // Upstream `[attr.tabindex]="(disabled || (_chips && _chips.length === 0)) ? -1 : tabIndex"`
  // — uses the chip COUNT directly, never the overridden `empty` getter above.
  const tabIndexValue = disabled || rows.length === 0 ? -1 : 0;

  const handleInputInput$ = $(() => {
    const el = inputRef.value as HTMLInputElement | undefined;
    inputEmpty.value = !el?.value;
  });

  const focusLastRow$ = $((origin: FocusOrigin) => {
    const rowEls = queryRowEls(containerRef.value);
    const last = rowEls[rowEls.length - 1];
    const action = last && queryPrimaryAction(last);
    if (action) focusVia(action, origin);
  });

  const handleInputKeydown$ = $((event: KeyboardEvent) => {
    const el = inputRef.value as HTMLInputElement | undefined;
    const isEmpty = !el?.value;
    if (isEmpty && event.key === 'Backspace') {
      if (!event.repeat) {
        focusLastRow$('keyboard');
      }
      event.preventDefault();
    } else if (separatorKeys.includes(event.key) && !event.repeat) {
      event.preventDefault();
      const value = el?.value ?? '';
      const clear = $(() => {
        const liveEl = inputRef.value as HTMLInputElement | undefined;
        if (liveEl) liveEl.value = '';
        inputEmpty.value = true;
      });
      props.input?.onTokenEnd$?.(value, clear);
    }
  });

  // Mirrors `MatChipGrid.focus()` — fires only when the GRID HOST ITSELF receives DOM focus
  // directly (native `focus` doesn't bubble), e.g. Tab landing on it.
  const handleHostFocus$ = $(() => {
    if (disabled || inputDisabled) return;
    const rowEls = queryRowEls(containerRef.value);
    const firstEnabled = rowEls.find(el => !el.hasAttribute('disabled'));
    if (!firstEnabled) {
      (inputRef.value as HTMLElement | undefined)?.focus();
      return;
    }
    queryPrimaryAction(firstEnabled)?.focus();
  });

  // Bubbling focusin/focusout on the grid host covers BOTH the input and any row's focus —
  // mirrors upstream's combined `focused` getter (`_chipInput?.focused ||
  // _hasFocusedChip()`), driving the owning `<MatFormField>`'s `mat-focused` class the same
  // way `MatInput`'s own `onFocus$`/`onBlur$` do (see `core/mat-form-field-control.ts`).
  useOn(
    'focusin',
    $(() => {
      if (formField) {
        formField.focused = true;
        formField.shouldLabelFloat = true;
      }
    }),
  );
  useOn(
    'focusout',
    $(() => {
      // Deferred: give focus a chance to land on another element inside this same grid
      // (e.g. Tab moving from the input to a chip) before deciding the whole control blurred.
      setTimeout(() => {
        if (!isBrowser) return;
        const root = containerRef.value;
        const active = document.activeElement;
        const stillFocused = !!root && !!active && root.contains(active);
        if (formField && !stillFocused) {
          formField.focused = false;
          formField.shouldLabelFloat = !(inputEmpty.value && rows.length === 0);
        }
      });
    }),
  );

  // See `mat-chip-row.tsx`'s `rippleDisabled` doc comment and `mat-chip-set.tsx`'s own
  // `fixupRippleDisabled$` (the identical mechanism, for the base chip-set case) for the full
  // write-up of this upstream construction-time quirk and why the correction has to be
  // IMPERATIVE, applied by the CONTAINER, deferred to the next frame.
  //
  // Scoped to rows that existed AT MOUNT only — confirmed live (`grid-input`'s "Mango",
  // added via `onTokenEnd$` AFTER the grid first rendered) that a row created dynamically,
  // after the initial render, does NOT get this same correction from whatever later change-
  // detection pass fixes the ORIGINAL rows: it stays ripple-disabled through every subsequent
  // step this parity suite exercises. A `@ContentChildren`/`@ViewChild` query re-resolving for
  // content added well after the component tree's own initial settle apparently needs
  // something this suite never triggers; reproducing "never corrects" for such a row (by
  // excluding it here) matches what's actually observed, rather than guessing at upstream's
  // exact trigger.
  const mountedRowKeys = useSignal(() => new Set(rows.map((d, i) => String(d.key ?? d.id ?? i))));
  const animationsDisabledForRipple = useAnimationsDisabled();
  const fixupRippleDisabled$ = $(() => {
    const root = containerRef.value;
    if (!root || !isBrowser) return;
    requestAnimationFrame(() => {
      // Re-read `props.rows` LIVE here, rather than closing over the outer-scope `rows`
      // const: `useOn()`'s registered handler reference can go stale (confirmed live — a
      // sibling re-render that changes `rows` without ALSO re-triggering one of THIS
      // listener's own events first leaves it holding an EARLIER render's closure), the
      // same "stale QRL capture" pitfall `MatButtonToggleGroup` documents for its own
      // onClick$. `props.rows` itself (the signal/array reference) stays live regardless.
      const liveRows = Array.isArray(props.rows) ? props.rows : props.rows.value;
      const liveDisabled = props.disabled ?? false;
      const rowEls = queryRowEls(root);
      rowEls.forEach((el, i) => {
        const def = liveRows[i];
        if (!def) return;
        if (!mountedRowKeys.value.has(String(def.key ?? def.id ?? i))) return;
        const rowDisabled = (def.disabled ?? false) || liveDisabled;
        const rowDisableRipple = def.disableRipple ?? false;
        if (!rowDisabled && !rowDisableRipple && !animationsDisabledForRipple.value) {
          el.removeAttribute('mat-ripple-loader-disabled');
        }
      });
    });
  });
  useOn('pointerdown', fixupRippleDisabled$);
  useOn('keydown', fixupRippleDisabled$);
  useOn('focusin', fixupRippleDisabled$);

  const classes = [
    'mat-mdc-chip-set',
    'mat-mdc-chip-grid',
    'mdc-evolution-chip-set',
    disabled && 'mat-mdc-chip-list-disabled',
    required && 'mat-mdc-chip-list-required',
    props.class,
  ].filter(Boolean) as string[];

  const inputClasses = [
    'mat-mdc-chip-input',
    'mat-mdc-input-element',
    'mdc-text-field__input',
    'mat-input-element',
    'mat-mdc-form-field-input-control',
  ];

  return (
    <mat-chip-grid
      ref={containerRef}
      class={classes}
      role={role}
      tabIndex={tabIndexValue}
      aria-disabled={disabled ? 'true' : 'false'}
      aria-invalid="false"
      aria-label={props['aria-label']}
      aria-labelledby={props['aria-labelledby']}
      onFocus$={handleHostFocus$}
    >
      <div class="mdc-evolution-chip-set__chips" role="presentation">
        {rows.map((def, i) => {
          // `rowOrigin` comes DIRECTLY from `<MatChipRow>`'s own remove handlers (see that
          // file's `onRemoved$` doc comment) rather than being read back off the row's own
          // `cdk-*-focused` class after the fact — confirmed live that the latter races the
          // SAME click's own pending `focusin`-triggered class update and isn't reliable.
          const wrappedRemoved$ = $(async (rowOrigin?: FocusOrigin) => {
            if (!isBrowser) {
              await def.onRemoved$?.();
              return;
            }
            const rowEls = queryRowEls(containerRef.value);
            const rowEl = rowEls[i];
            const active = document.activeElement;
            const hadFocus = !!rowEl && !!active && rowEl.contains(active);
            const origin = rowOrigin ?? null;
            const inner = def.onRemoved$;
            if (inner) await inner();
            if (hadFocus) {
              requestAnimationFrame(() => {
                const newRowEls = queryRowEls(containerRef.value);
                // Strip any OTHER row's stale `cdk-*-focused` classes before redirecting:
                // the removed row's own blur (moving focus away from it) should have already
                // cleared whichever row ELSE happened to carry one from an earlier step (e.g.
                // `grid-input`'s Backspace-focuses-last-chip, superseded by this removal — see
                // angular-parity.spec.ts's own note on exactly this), but confirmed live that
                // a DIFFERENT row's own `useFocusOrigin()` state can survive this specific
                // combination (a sibling re-rendering because the array itself changed, not
                // because of its own focus event) — the same category of "a signal written
                // from this component's own `useOn()` listener is reliable, but a RE-RENDER
                // for an unrelated reason can still re-assert stale classes" issue
                // `mat-chip.tsx`'s `rippleDisabledInitial` hits, just for a different class
                // set. One extra imperative pass keeps this deterministic either way.
                for (const rowEl of newRowEls) {
                  rowEl.classList.remove(
                    'cdk-focused',
                    'cdk-touch-focused',
                    'cdk-keyboard-focused',
                    'cdk-mouse-focused',
                    'cdk-program-focused',
                  );
                }
                if (newRowEls.length === 0) {
                  const input = inputRef.value as HTMLElement | undefined;
                  if (input) focusVia(input, origin);
                  return;
                }
                const newIndex = Math.min(i, newRowEls.length - 1);
                const action = queryPrimaryAction(newRowEls[newIndex]);
                if (action) focusVia(action, origin);
              });
            }
          });
          return (
            <MatChipRow
              key={def.key ?? def.id ?? i}
              id={def.id}
              disabled={def.disabled}
              chipListDisabled={disabled}
              highlighted={def.highlighted}
              color={def.color}
              removable={def.removable}
              disableRipple={def.disableRipple}
              avatar={def.avatar}
              trailingIcon={def.trailingIcon}
              removeButton={def.removeButton}
              onRemoved$={wrappedRemoved$}
              class={def.class}
            >
              {def.content}
            </MatChipRow>
          );
        })}
        <input
          key="chip-input"
          ref={inputRef}
          id={inputId}
          class={inputClasses}
          placeholder={inputPlaceholder || undefined}
          disabled={inputDisabled || undefined}
          onInput$={handleInputInput$}
          onKeyDown$={handleInputKeydown$}
        />
      </div>
    </mat-chip-grid>
  );
});
