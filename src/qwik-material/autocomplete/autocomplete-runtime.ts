/**
 * Module-level orchestration for `MatAutocomplete` (`mat-autocomplete.tsx`),
 * ported from `MatAutocompleteTrigger`'s `openPanel()`/`closePanel()`/
 * `_handleKeydown()`/`_handleInput()`/`_handleFocus()`/`_handleClick()`/
 * `_setValueAndClose()`/`_resetActiveItem()`
 * (`src/material/autocomplete/autocomplete-trigger.ts`), with
 * `MatAutocomplete.showPanel`/`_skipPredicate()` folded in.
 *
 * Deliberately NOT closures inside `mat-autocomplete.tsx`'s `component$`
 * body — same rationale as `qwik-material/select/select-runtime.ts`'s
 * module doc comment (which this file mirrors closely): every function here
 * takes its state as explicit arguments (plain config + signals), so
 * `mat-autocomplete.tsx`'s own `$()` handlers are the only real `$()`
 * boundaries — they just call these plain functions directly, each time
 * re-resolving `flat`/`tree` fresh from the CURRENT `props.options` (see
 * `autocomplete-option-resolver.ts`'s doc comment for why that resolution
 * is cheap and safe to repeat on every call, unlike `select-option-
 * resolver.ts`'s memoize-once treatment).
 *
 * ## Why `tree` is passed to the panel as a `Signal`, unlike select's panel
 *
 * `qwik-material/select`'s `MatSelectPanel` receives `tree` as a plain,
 * once-only value — select's own `options` prop never changes after mount.
 * Autocomplete's `options` prop is DELIBERATELY reactive (every scenario
 * refilters live, while the SAME overlay session stays open — see
 * `src/dev-app/qwik-parity/autocomplete.ts`'s FILTERING header note). So
 * `MatAutocomplete` keeps a `Signal<readonly ResolvedAutocompleteNode[]>`
 * (`signals.treeSignal`) that it REWRITES every time the resolved tree
 * changes (`syncAutocompleteOptions`, below) — the ALREADY-MOUNTED
 * `MatAutocompletePanel` (a completely separate component instance, living
 * in the overlay) reads this signal BY REFERENCE (never `.value`), so a
 * write here reactively updates its rendered option list without
 * recreating the overlay. Exactly the same "pass the Signal itself" pattern
 * `core/mat-form-field-control.ts`'s doc comment and `select-runtime.ts`'s
 * own `value`/`activeIndex`/`exiting` signals already establish.
 *
 * ## Why there's no `onTabOut`-driven close, unlike select's key manager
 *
 * `select-runtime.ts`'s `buildKeyManager` wires `manager.onTabOut(() =>
 * ...)` ONCE, at key-manager-build time (cached for the component's whole
 * lifetime) — safe there because select's callback only touches STABLE
 * `Signal` references, never a plain `cfg` object. This file's config
 * (`AutocompleteRuntimeConfig`) is rebuilt FRESH every render (its
 * `requireSelection`/`onValueChange$`/... fields can't be assumed to never
 * change the way select's effectively-static ones can), so wiring a close
 * callback into the key manager ONCE, at its (also cached) build time, would
 * capture a STALE `cfg` forever — the exact "stale QRL/closure capture"
 * hazard this project's other controlled inputs already guard against (see
 * `mat-input.tsx`'s `handleFocus$`/`handleBlur$` doc comments). `Tab` is
 * therefore handled directly inside `handleAutocompleteKeydown` (called
 * FRESH on every keydown, from a `$()` handler `mat-autocomplete.tsx`
 * reconstructs on every render — see that file's own doc comment), which
 * always has the CURRENT `cfg` in scope — never through the key manager's
 * own `onTabOut`/`onKeydown('Tab')` path at all.
 */
import {noSerialize, type NoSerialize, type QRL, type Signal} from '@qwik.dev/core';
import {isBrowser} from '@qwik.dev/core/build';
import {hasModifierKey} from '@angular-community/qwik-cdk/keycodes';
import type {MatFormFieldControlState} from '../core/mat-form-field-control';
import {ensureCdkDispatchers, type QwikCdkInternals} from '@angular-community/qwik-cdk';
import {
  createOverlayService,
  createFlexibleConnectedPositionStrategy,
  resolveScrollStrategyDescriptor,
  type ConnectedPosition,
  type OverlayEntry,
  type OverlayRef,
  type OverlayRegistry,
  type ScrollStrategyDescriptor,
} from '@angular-community/qwik-cdk/overlay';
import {
  createListKeyManager,
  type ListKeyManager,
  type ListKeyManagerOption,
} from '@angular-community/qwik-cdk/a11y';
import {MatAutocompletePanel} from './mat-autocomplete-panel';
import type {
  ResolvedAutocompleteNode,
  ResolvedAutocompleteOption,
} from './autocomplete-option-resolver';

/** Mirrors upstream `MatAutocompleteTrigger._setStrategyPositions()`'s
 *  default (`position: 'auto'`) — below positions, then above. */
export const AUTOCOMPLETE_POSITIONS: ConnectedPosition[] = [
  {originX: 'start', originY: 'bottom', overlayX: 'start', overlayY: 'top'},
  {originX: 'end', originY: 'bottom', overlayX: 'end', overlayY: 'top'},
  {
    originX: 'start',
    originY: 'top',
    overlayX: 'start',
    overlayY: 'bottom',
    panelClass: 'mat-mdc-autocomplete-panel-above',
  },
  {
    originX: 'end',
    originY: 'top',
    overlayX: 'end',
    overlayY: 'bottom',
    panelClass: 'mat-mdc-autocomplete-panel-above',
  },
];

interface KeyManagerItem extends ListKeyManagerOption {
  option: ResolvedAutocompleteOption;
}

function toKeyManagerItem(option: ResolvedAutocompleteOption): KeyManagerItem {
  return {option, disabled: option.disabled, getLabel: () => option.label};
}

/** All of the reactive signals `MatAutocomplete` owns and threads through
 *  every runtime function here. See the module doc comment for why `tree`
 *  specifically must be a `Signal`. */
export interface AutocompleteRuntimeSignals {
  /** Mirrors `MatAutocompleteTrigger._overlayAttached` — whether the
   *  overlay exists at all, INDEPENDENT of `MatAutocomplete.showPanel`
   *  (zero options still leaves this `true`, just visually hidden — see
   *  `mat-autocomplete-panel.tsx`'s `showPanel` derivation). The trigger's
   *  own `panelOpen` (ARIA-visible, derived) is `overlayAttached.value &&
   *  flat.length > 0`, computed fresh wherever needed — never a separate
   *  stored signal, so it can never drift from `flat`. */
  overlayAttached: Signal<boolean>;
  activeIndex: Signal<number>;
  /** The value of the option last explicitly committed via selection (click
   *  or Enter) — mirrors `MatOption.selected`'s FLAG semantics (never a
   *  pure "does the typed text equal this option's label" comparison; see
   *  `handleAutocompleteInput`'s doc comment for why that distinction
   *  matters). `undefined` means nothing is selected. Compared via strict
   *  `===` against each option's own `value` by `MatAutocompletePanel` —
   *  same "always strict equality" deviation `select/SYNC.md` documents. */
  selectedValue: Signal<unknown>;
  overlayRef: Signal<NoSerialize<OverlayRef> | undefined>;
  keyManager: Signal<NoSerialize<ListKeyManager<KeyManagerItem>> | undefined>;
  /** Live tree fed to the already-mounted `MatAutocompletePanel` — see the
   *  module doc comment. */
  treeSignal: Signal<readonly ResolvedAutocompleteNode[]>;
  panelEl: Signal<Element | undefined>;
  /** The input's raw `.value` captured at the moment the CURRENT overlay
   *  session was freshly attached — mirrors `_valueOnAttach`. Only updated
   *  on a fresh attach, never on a "refresh the already-open panel" call —
   *  see `openAutocompletePanel`'s own comment. */
  valueOnAttach: Signal<string>;
  /** Ref to the native `<input>` itself — both the trigger element and
   *  (standalone, no form field) the connected-overlay origin fallback. */
  inputRef: Signal<HTMLElement | undefined>;
  /** `MAT_FORM_FIELD_CONNECTED_ORIGIN`, when nested in a `<MatFormField>` —
   *  read `.value` live, never dereferenced ahead of time. */
  formFieldOriginRef: Signal<Element | undefined> | undefined;
  /** `MAT_FORM_FIELD_CONTROL_STATE`, when nested in a `<MatFormField>` —
   *  `undefined` for standalone usage. Needed here (not just read by
   *  `mat-autocomplete.tsx`'s own `handleBlur$`) specifically for the
   *  `requireSelection` reset-on-close path (`closeAutocompletePanelWithResetCheck`)
   *  — see that function's own doc comment for why blur's own empty/float
   *  update runs TOO EARLY to see the reset. */
  formField: MatFormFieldControlState | undefined;
  /** Local "is the control empty" signal — mirrors `mat-input.tsx`'s own
   *  `emptySignal`. Updated here for the same reset-timing reason as
   *  `formField` above. */
  emptySignal: Signal<boolean>;
}

export interface AutocompleteRuntimeConfig {
  disabled: boolean;
  readOnly: boolean;
  autoActiveFirstOption: boolean;
  requireSelection: boolean;
  hideSingleSelectionIndicator: boolean;
  panelId: string;
  panelClass: readonly string[];
  overlayPanelClass: string | string[] | undefined;
  hasBackdrop: boolean;
  backdropClass: string | undefined;
  color: 'primary' | 'accent' | 'warn' | undefined;
  ariaLabel: string | undefined;
  panelAriaLabelledby: string | null;
  /** Falls back to measuring the connected element — mirrors
   *  `_getPanelWidth`'s `autocomplete.panelWidth || this._getHostWidth()`. */
  panelWidth: string | number | undefined;
  animationsDisabled: boolean;
  isRtl: boolean;
  /** QRL props threaded through UNWRAPPED — see `mat-select.tsx`'s own
   *  doc comment for why a QRL (not a plain function wrapping one) is
   *  what's safe to capture/call from this module's plain functions. */
  displayWith$: QRL<(value: unknown) => string> | undefined;
  onValueChange$: QRL<(value: unknown) => void> | undefined;
  onTouched$: QRL<() => void> | undefined;
  onOpenedChange$: QRL<(open: boolean) => void> | undefined;
  /**
   * Mirrors upstream `MAT_AUTOCOMPLETE_SCROLL_STRATEGY`. A plain,
   * serializable `ScrollStrategyDescriptor` (string/object, or a `QRL`
   * escape hatch) — NOT a function factory, see
   * `select-runtime.ts`'s `SelectRuntimeConfig.scrollStrategyDescriptor`
   * for why that distinction matters (a factory function doesn't survive
   * a real SSR→CSR resume).
   */
  scrollStrategyDescriptor: ScrollStrategyDescriptor;
}

function makeIdGen(ctx: QwikCdkInternals) {
  return {
    getId(prefix: string): string {
      return `${prefix}${ctx.idCounter.value++}`;
    },
  };
}

function makeRegistry(ctx: QwikCdkInternals): OverlayRegistry {
  return {
    entries: ctx.entries,
    push: e => {
      ctx.overlayContainerCreated.value = true;
      ctx.entries.value = [...ctx.entries.value, e];
    },
    remove: id => {
      ctx.entries.value = ctx.entries.value.filter(x => x.id !== id);
    },
    get: id => ctx.entries.value.find((x: OverlayEntry) => x.id === id),
  };
}

/** Mirrors `MatAutocompleteTrigger._getHostWidth()`/`_getPanelWidth()`. */
function getOverlayWidth(
  cfg: AutocompleteRuntimeConfig,
  signals: AutocompleteRuntimeSignals,
): string | number {
  if (cfg.panelWidth) return cfg.panelWidth;
  const el = signals.formFieldOriginRef?.value ?? signals.inputRef.value;
  return el?.getBoundingClientRect().width ?? '';
}

/** Mirrors `_getDisplayValue()`, resolved synchronously for the common (no
 *  `displayWith`) case. */
function displayValueSync(value: unknown): string {
  return value != null ? String(value) : '';
}

/** Builds a fresh `ListKeyManager` — matches select-runtime.ts's "always a
 *  fresh key manager per component instance, items refreshed per call"
 *  simplification. `skipPredicate` is unconditionally `false` — mirrors
 *  `MatAutocomplete._skipPredicate()` (NOT gated on open/closed state at
 *  all, unlike `mat-select`'s own skip predicate — see autocomplete.ts's
 *  DISABLED OPTIONS note). No typeahead (`MatAutocomplete` never calls
 *  `.withTypeAhead()` upstream — typed characters flow into the native
 *  input as filtering text instead). */
function buildKeyManager(
  flat: readonly ResolvedAutocompleteOption[],
  signals: AutocompleteRuntimeSignals,
): ListKeyManager<KeyManagerItem> {
  const manager = createListKeyManager(flat.map(toKeyManagerItem))
    .withWrap()
    .skipPredicate(() => false);
  manager.onChange(index => {
    signals.activeIndex.value = index;
  });
  return manager;
}

function getKeyManager(
  flat: readonly ResolvedAutocompleteOption[],
  signals: AutocompleteRuntimeSignals,
): ListKeyManager<KeyManagerItem> {
  if (!signals.keyManager.value) {
    signals.keyManager.value = noSerialize(buildKeyManager(flat, signals));
  }
  return signals.keyManager.value as ListKeyManager<KeyManagerItem>;
}

/** Mirrors `_resetActiveItem()` — ALWAYS resets (never tries to highlight
 *  whatever's currently selected, unlike `mat-select`'s own
 *  `_highlightCorrectOption` — a real, confirmed-live difference; see
 *  autocomplete.ts's ACTIVE/SELECTED STATE note: "-active" and "-selected"
 *  are independent, and a reopen always starts with no active item unless
 *  `autoActiveFirstOption`). Called on every open AND every refilter while
 *  open. */
function resetActiveItem(
  flat: readonly ResolvedAutocompleteOption[],
  cfg: AutocompleteRuntimeConfig,
  signals: AutocompleteRuntimeSignals,
): void {
  const manager = getKeyManager(flat, signals);
  if (cfg.autoActiveFirstOption) {
    manager.setActiveItem(flat.findIndex(o => !o.disabled));
  } else {
    manager.setActiveItem(-1);
  }
}

/** Mirrors `_destroyPanel()`/the detach half of `closePanel()` — the
 *  SYNCHRONOUS half (no exit animation at all — see
 *  `angular-parity.spec.ts`'s NO EXIT ANIMATION header note, a genuine
 *  difference from `mat-select`/`mat-menu`). */
function detachOverlay(signals: AutocompleteRuntimeSignals): void {
  const ref = signals.overlayRef.value;
  if (ref) ref.detach();
  signals.overlayRef.value = undefined;
  signals.overlayAttached.value = false;
}

/** Mirrors `MatAutocompleteTrigger.openPanel()`/`_openPanelInternal()`/
 *  `_attachOverlay()`. Idempotent — a no-op if the overlay is already
 *  attached (this port's "already open" branch only refreshes the live
 *  `tree` signal + re-highlights, mirroring upstream's lighter "update
 *  origin/size" branch minus the resize, not an upstream "no-op" — see
 *  SYNC.md's panel-resize-on-refilter deviation). */
export async function openAutocompletePanel(
  flat: readonly ResolvedAutocompleteOption[],
  tree: readonly ResolvedAutocompleteNode[],
  ctx: QwikCdkInternals,
  cfg: AutocompleteRuntimeConfig,
  signals: AutocompleteRuntimeSignals,
): Promise<void> {
  if (!isBrowser) return;
  if (cfg.disabled || cfg.readOnly) return;
  const inputEl = signals.inputRef.value as HTMLInputElement | undefined;
  if (!inputEl) return;

  if (!signals.overlayAttached.value) {
    signals.valueOnAttach.value = inputEl.value;

    const positionOriginEl = signals.formFieldOriginRef?.value ?? inputEl;
    const strategy = createFlexibleConnectedPositionStrategy(positionOriginEl)
      .withFlexibleDimensions(false)
      .withPush(false)
      .withPopoverLocation('inline')
      .withPopoverInsertionOrigin(positionOriginEl);
    strategy.withPositions(AUTOCOMPLETE_POSITIONS);

    const {keyboardDispatcher, outsideClickDispatcher} = ensureCdkDispatchers(ctx);
    const idGen = makeIdGen(ctx);
    const registry = makeRegistry(ctx);
    const overlay = createOverlayService(registry, idGen, ctx.overlayDefaultConfig);

    signals.treeSignal.value = tree;

    // Resolves BEFORE `overlay.create()` so the real `ScrollStrategy`
    // instance (not a descriptor) lands in its config — see
    // `resolveScrollStrategyDescriptor`'s own doc comment. Only actually
    // suspends for the `QRL<() => ScrollStrategy>` escape hatch; the
    // default/descriptor form resolves synchronously.
    const resolvedScrollStrategy = await resolveScrollStrategyDescriptor(
      cfg.scrollStrategyDescriptor,
    );

    const overlayRef = overlay.create(
      MatAutocompletePanel,
      {
        id: cfg.panelId,
        tree: signals.treeSignal,
        value: signals.selectedValue,
        activeIndex: signals.activeIndex,
        hideSingleSelectionIndicator: cfg.hideSingleSelectionIndicator,
        panelClass: cfg.panelClass,
        color: cfg.color,
        ariaLabel: cfg.ariaLabel,
        ariaLabelledby: cfg.panelAriaLabelledby,
        animationsDisabled: cfg.animationsDisabled,
        panelRef: signals.panelEl,
        onOptionSelect: (option: ResolvedAutocompleteOption) => {
          void selectAutocompleteOption(option, cfg, signals);
        },
      },
      {
        direction: cfg.isRtl ? 'rtl' : 'ltr',
        positionStrategy: strategy,
        // Mirrors upstream MAT_AUTOCOMPLETE_SCROLL_STRATEGY: configurable
        // via <QwikMaterialProvider matAutocompleteScrollStrategy={...}>,
        // falling back to the previously hard-coded reposition strategy.
        scrollStrategy: resolvedScrollStrategy,
        hasBackdrop: cfg.hasBackdrop,
        backdropClass: cfg.backdropClass ?? 'cdk-overlay-transparent-backdrop',
        panelClass: cfg.overlayPanelClass,
        width: getOverlayWidth(cfg, signals),
        disableAnimations: cfg.animationsDisabled,
      },
    );

    signals.overlayRef.value = noSerialize(overlayRef);
    signals.overlayAttached.value = true;

    // Mirrors the TWO independent Escape paths upstream (see
    // `_handlePanelKeydown` vs. the host's own `_handleKeydown`) — see
    // `handleAutocompleteKeydown`'s own comment for why the actual close
    // happens here, not in that function.
    keyboardDispatcher.add(overlayRef, {
      onKeydown(e) {
        if (
          (e.key === 'Escape' && !hasModifierKey(e)) ||
          (e.key === 'ArrowUp' && hasModifierKey(e, 'altKey'))
        ) {
          e.preventDefault();
          e.stopPropagation();
          closeAutocompletePanelWithResetCheck(cfg, signals);
        }
      },
    });
    outsideClickDispatcher.add(overlayRef, {
      onOutsideClick() {
        closeAutocompletePanelWithResetCheck(cfg, signals);
      },
    });
  } else {
    // Already attached — refresh the live tree only; this port doesn't
    // replicate upstream's resize-on-reattach (`updateSize`/`setOrigin`) —
    // see SYNC.md.
    signals.treeSignal.value = tree;
  }

  const manager = getKeyManager(flat, signals);
  manager.setItems(flat.map(toKeyManagerItem));
  resetActiveItem(flat, cfg, signals);

  cfg.onOpenedChange$?.(true);
}

/** Mirrors the `_subscribeToClosingActions()` "option list changed while
 *  attached" branch (`resetActiveItem()` + `_updatePanelState()`, minus the
 *  position reapply this port doesn't replicate — see SYNC.md) — called
 *  reactively whenever `props.options` changes WHILE the panel is already
 *  open (a genuine refilter, not a fresh open). A no-op when the overlay
 *  isn't attached at all. */
export function syncAutocompleteOptions(
  flat: readonly ResolvedAutocompleteOption[],
  tree: readonly ResolvedAutocompleteNode[],
  cfg: AutocompleteRuntimeConfig,
  signals: AutocompleteRuntimeSignals,
): void {
  if (!signals.overlayAttached.value) return;
  signals.treeSignal.value = tree;
  const manager = getKeyManager(flat, signals);
  manager.setItems(flat.map(toKeyManagerItem));
  resetActiveItem(flat, cfg, signals);
}

/** Mirrors `_setValueAndClose()`'s "a real selection was made" branch. */
export async function selectAutocompleteOption(
  option: ResolvedAutocompleteOption,
  cfg: AutocompleteRuntimeConfig,
  signals: AutocompleteRuntimeSignals,
): Promise<void> {
  if (option.disabled) return;
  signals.selectedValue.value = option.value;
  const inputEl = signals.inputRef.value as HTMLInputElement | undefined;
  const display = cfg.displayWith$
    ? ((await cfg.displayWith$(option.value)) ?? '')
    : displayValueSync(option.value);
  if (inputEl) inputEl.value = display;
  cfg.onValueChange$?.(option.value);
  // Mirrors `_setValueAndClose()`'s EXACT order — `focus()` BEFORE
  // `closePanel()`, not after. This is load-bearing, not cosmetic:
  // clicking an option (unlike pressing Enter) genuinely blurs the input
  // first (confirmed live against the real Angular app — a plain,
  // non-focusable click target blurs whatever was previously focused, the
  // ordinary browser behavior for mousedown on a non-focusable element;
  // `<mat-option>` carries no tabindex either side). `focus()` here is
  // therefore a REAL, synchronous re-focus, not a no-op — and because
  // `MatAutocomplete`'s own `handleFocus$` reopens the panel on ANY
  // genuine focus event (mirrors upstream's own `_handleFocus()`, which
  // has no "already open" guard either — see that function's own
  // comment), this refocus ITSELF re-triggers `openAutocompletePanel`
  // synchronously, before this function's next line ever runs. Calling
  // `detachOverlay` AFTER `focus()` (matching upstream's own
  // `_setValueAndClose` → `this.closePanel()` ordering, which also runs
  // after its own `focus()` call) means that spurious reopen is the one
  // that gets closed — settling correctly within this same synchronous
  // call. Reversing this order (detach, then focus) was tried first and
  // reproduced the browser's own close synchronously being undone by the
  // LATER reopen, leaving the panel incorrectly open — confirmed live.
  inputEl?.focus();
  detachOverlay(signals);
  cfg.onOpenedChange$?.(false);
}

/** Mirrors `closePanel()` + `_setValueAndClose()`'s "no selection" branch
 *  (the `requireSelection` reset-on-close check). Used by Escape, Tab, and
 *  an outside click — every close path that does NOT stem from picking an
 *  option directly.
 *
 * ## Why this ALSO updates `formField`/`emptySignal` directly, unlike the
 * other close paths
 *
 * For a genuine outside click, the NATIVE blur (moving focus away from the
 * input) fires BEFORE the click event that this function is ultimately
 * called from (standard browser event order: focus-related events, then
 * click) — confirmed live. `mat-autocomplete.tsx`'s own `handleBlur$` has
 * therefore ALREADY run, and already computed `shouldLabelFloat` from
 * whatever the input's value was AT THAT MOMENT — which, for
 * `requireSelection`, is still the STALE, about-to-be-discarded text (e.g.
 * "zzz"), not the post-reset empty string this function is about to write.
 * Left alone, the label would incorrectly stay floated (the stale value
 * read at blur time was non-empty) even though the control is about to
 * become genuinely empty — confirmed live against the real Angular app
 * (see `src/dev-app/qwik-parity/autocomplete.ts`'s LABEL-FLOATING note:
 * "a close that BOTH blurs the input AND leaves the value empty" is the
 * one case that visibly unfloats it). So the reset branch below
 * recomputes `empty`/`shouldLabelFloat` itself, from the (already-false,
 * since blur already ran) `formField.focused` and the NEW empty value —
 * the one synchronous update `handleBlur$` can't retroactively make. */
export function closeAutocompletePanelWithResetCheck(
  cfg: AutocompleteRuntimeConfig,
  signals: AutocompleteRuntimeSignals,
): void {
  if (!signals.overlayAttached.value) return;
  const inputEl = signals.inputRef.value as HTMLInputElement | undefined;
  if (cfg.requireSelection && inputEl && inputEl.value !== signals.valueOnAttach.value) {
    signals.selectedValue.value = undefined;
    inputEl.value = '';
    cfg.onValueChange$?.(undefined);
    signals.emptySignal.value = true;
    if (signals.formField) {
      signals.formField.empty = true;
      signals.formField.shouldLabelFloat = signals.formField.focused;
    }
  }
  detachOverlay(signals);
  cfg.onOpenedChange$?.(false);
}

/** Mirrors `_handleInput()`. `rawValue` is the native input's live
 *  `.value`, read by the caller (`mat-autocomplete.tsx`'s `onInput$`) off
 *  the real DOM element.
 *
 * ## Deviation: no "deselect if typed text no longer matches the selected
 * option's display" check
 *
 * Upstream's `_handleInput` also clears a stale `.selected` flag mid-typing
 * (`if (panelOpen && !requireSelection) { ...deselect if value !== display
 * }`) — not reproduced here. Every one of this port's 8 scenarios either
 * has `requireSelection` set (where upstream skips this branch entirely
 * anyway) or never types again after a selection without first reopening
 * (which already re-filters/re-renders the panel from scratch) — see
 * `autocomplete-runtime.spec.ts`/SYNC.md for the full write-up. A future
 * scenario needing this would set `signals.selectedValue` to `undefined`
 * here when the live text diverges from `displayValueSync(selectedValue)`.
 */
export function handleAutocompleteInput(
  rawValue: string,
  flat: readonly ResolvedAutocompleteOption[],
  tree: readonly ResolvedAutocompleteNode[],
  ctx: QwikCdkInternals,
  cfg: AutocompleteRuntimeConfig,
  signals: AutocompleteRuntimeSignals,
): void {
  if (!rawValue) {
    signals.selectedValue.value = undefined;
  }
  if (!cfg.requireSelection) {
    cfg.onValueChange$?.(rawValue);
  }
  const inputEl = signals.inputRef.value as HTMLInputElement | undefined;
  if (inputEl && !inputEl.readOnly && !inputEl.disabled && !cfg.disabled) {
    openAutocompletePanel(flat, tree, ctx, cfg, signals);
  }
}

/** Mirrors `_handleFocus()` (minus `_canOpenOnNextFocus`'s window-blur
 *  edge case — not exercised by any scenario here; see SYNC.md). */
export function handleAutocompleteFocus(
  flat: readonly ResolvedAutocompleteOption[],
  tree: readonly ResolvedAutocompleteNode[],
  ctx: QwikCdkInternals,
  cfg: AutocompleteRuntimeConfig,
  signals: AutocompleteRuntimeSignals,
): void {
  if (cfg.disabled || cfg.readOnly) return;
  openAutocompletePanel(flat, tree, ctx, cfg, signals);
}

/** Mirrors `_handleClick()`. */
export function handleAutocompleteClick(
  flat: readonly ResolvedAutocompleteOption[],
  tree: readonly ResolvedAutocompleteNode[],
  ctx: QwikCdkInternals,
  cfg: AutocompleteRuntimeConfig,
  signals: AutocompleteRuntimeSignals,
): void {
  if (cfg.disabled || cfg.readOnly || signals.overlayAttached.value) return;
  openAutocompletePanel(flat, tree, ctx, cfg, signals);
}

/** Mirrors `_handleKeydown()`. See the module doc comment for why `Tab`'s
 *  close is handled directly here rather than through the key manager's
 *  own `onTabOut`, and why Escape's actual close happens in
 *  `openAutocompletePanel`'s keyboard-dispatcher registration instead. */
export function handleAutocompleteKeydown(
  event: KeyboardEvent,
  flat: readonly ResolvedAutocompleteOption[],
  tree: readonly ResolvedAutocompleteNode[],
  ctx: QwikCdkInternals,
  cfg: AutocompleteRuntimeConfig,
  signals: AutocompleteRuntimeSignals,
): void {
  if (cfg.disabled) return;
  const key = event.key;
  const hasModifier = hasModifierKey(event);
  const panelOpen = signals.overlayAttached.value && flat.length > 0;

  if (key === 'Escape' && !hasModifier) {
    event.preventDefault();
    return;
  }

  if (key === 'Tab') {
    if (panelOpen) {
      closeAutocompletePanelWithResetCheck(cfg, signals);
    }
    return;
  }

  const manager = getKeyManager(flat, signals);
  manager.setItems(flat.map(toKeyManagerItem));
  const isArrowKey =
    key === 'ArrowUp' || key === 'ArrowDown' || key === 'ArrowLeft' || key === 'ArrowRight';

  if (panelOpen && key === 'Enter' && !hasModifier) {
    const active = manager.activeItem;
    if (active) {
      event.preventDefault();
      void selectAutocompleteOption(active.option, cfg, signals);
      resetActiveItem(flat, cfg, signals);
    }
    return;
  }

  if (isArrowKey && !hasModifier && panelOpen) {
    manager.onKeydown(event);
  } else if (isArrowKey) {
    openAutocompletePanel(flat, tree, ctx, cfg, signals);
  }
}

export type {KeyManagerItem};
