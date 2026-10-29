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
  /** Mirrors `MatOption.value`. Rendered as a literal `value` DOM attribute
   *  — NOT because upstream's `MatOption` has any `[attr.value]` host
   *  binding (it doesn't: `option.ts`'s `host` object has no `value` entry
   *  at all) but because every parity scenario's Angular template writes
   *  the STATIC (bracket-less) `<mat-option value="apple">` — and Angular
   *  keeps a plain static attribute in the rendered DOM regardless of
   *  whether it also happens to match an `@Input()` name. Confirmed live:
   *  omitting this produced a real `attr 'value' 'apple' != 'undefined'`
   *  diff on every option, every scenario, once the id-generator infinite
   *  loop (see mat-select.tsx's doc comment) stopped masking it.
   *
   *  Set `echoValueAttr={false}` to suppress this — needed by `qwik-material/paginator`'s
   *  page-size options, whose real upstream template (`paginator.html`) writes a genuine
   *  property binding (`<mat-option [value]="pageSizeOption">`), which Angular does NOT echo
   *  as a DOM attribute at all (see `qwik-material/paginator/SYNC.md`), and by
   *  `qwik-material/timepicker`'s own options, whose upstream `timepicker.html` is the same
   *  shape (`<mat-option [value]="option.value">`) — confirmed live there too: a real
   *  timepicker `<mat-option>` has NO `value` attribute at all (see
   *  `qwik-material/timepicker/SYNC.md`). */
  value?: T;
  /**
   * Whether `value` is echoed as a literal DOM attribute. Angular keeps it only
   * when the consuming template writes it statically (`<mat-option value="x">`);
   * a bound `[value]` leaves no attribute. Default `true` (select's scenarios);
   * paginator, timepicker, and some autocomplete scenarios bind it.
   */
  echoValueAttr?: boolean;
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
      value={props.echoValueAttr !== false && props.value != null ? String(props.value) : undefined}
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
          echoAttributes
        />
      )}
      {props.groupInertLabel != null && (
        <span class="cdk-visually-hidden">({props.groupInertLabel})</span>
      )}
      {/* `mat-ripple` is both the bare directive-selector attribute AND a
          literal class — same "attribute + class" convention established by
          radio/tabs/slide-toggle's own ripple containers (see e.g.
          mat-radio-button.tsx's matching comment). Confirmed live: the real
          Angular DOM's ripple div classes are `[mat-focus-indicator
          mat-mdc-option-ripple mat-ripple]`, not just the two static
          classes the template literally writes — `MatRipple` the directive
          adds its own `mat-ripple` class at runtime. */}
      <div
        class="mat-mdc-option-ripple mat-focus-indicator mat-ripple"
        aria-hidden="true"
        {...({'mat-ripple': ''} as Record<string, string>)}
      />
    </mat-option>
  );
});
