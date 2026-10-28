/**
 * Module-level orchestration for `MatSelect` (`mat-select.tsx`), ported from
 * `MatSelect.open()`/`.close()`/`._exitAndDetach()`/`._handleKeydown()`/
 * `._onSelect()`/`._highlightCorrectOption()` (`src/material/select/select.ts`).
 *
 * Deliberately NOT closures inside `mat-select.tsx`'s `component$` body —
 * same rationale as `qwik-material/tooltip/tooltip-runtime.ts`'s module doc
 * comment (which this file mirrors closely): Qwik's optimizer extracts each
 * `$()`-wrapped handler into its own lazy-loaded chunk, and one such handler
 * calling ANOTHER local `const foo$ = $(...)` *by reference* from inside the
 * same `component$` is the same family of forward-reference/closure-capture
 * risk `overlay-host.tsx`'s doc comment warns about. Every function here
 * takes its state as explicit arguments (plain signals + config), so
 * `mat-select.tsx`'s own `onClick$`/`onKeyDown$` handlers are the only real
 * `$()` boundaries — they just call these plain functions directly, exactly
 * like `mat-tooltip.tsx` calls `showTooltip`/`hideTooltip`.
 */
import {noSerialize, type NoSerialize, type QRL, type Signal} from '@builder.io/qwik';
import {isBrowser} from '@builder.io/qwik/build';
import {
  A,
  ALT,
  ENTER,
  SPACE,
  DOWN_ARROW,
  UP_ARROW,
  hasModifierKey,
} from '@angular-community/qwik-cdk/keycodes';
import {ensureCdkDispatchers, type QwikCdkInternals} from '@angular-community/qwik-cdk';
import {
  createOverlayService,
  createFlexibleConnectedPositionStrategy,
  createRepositionScrollStrategy,
  type ConnectedPosition,
  type OverlayEntry,
  type OverlayRef,
  type OverlayRegistry,
} from '@angular-community/qwik-cdk/overlay';
import {
  createListKeyManager,
  createLiveAnnouncer,
  type ListKeyManager,
  type ListKeyManagerOption,
  type LiveAnnouncer,
} from '@angular-community/qwik-cdk/a11y';
import {MatSelectPanel} from './mat-select-panel';
import type {ResolvedSelectOption, ResolvedSelectNode} from './select-option-resolver';

/** Mirrors upstream `MatSelect._positions`. */
export const SELECT_POSITIONS: ConnectedPosition[] = [
  {originX: 'start', originY: 'bottom', overlayX: 'start', overlayY: 'top'},
  {originX: 'end', originY: 'bottom', overlayX: 'end', overlayY: 'top'},
  {
    originX: 'start',
    originY: 'top',
    overlayX: 'start',
    overlayY: 'bottom',
    panelClass: 'mat-mdc-select-panel-above',
  },
  {
    originX: 'end',
    originY: 'top',
    overlayX: 'end',
    overlayY: 'bottom',
    panelClass: 'mat-mdc-select-panel-above',
  },
];

interface KeyManagerItem extends ListKeyManagerOption {
  option: ResolvedSelectOption;
}

/**
 * All of the reactive signals/refs `MatSelect` owns and threads through
 * every runtime function. Several (`value`/`activeIndex`/`exiting`) are
 * also passed, BY REFERENCE, as props to the lazily-created
 * `MatSelectPanel` — see that component's doc comment for why passing the
 * Signal itself (never `.value`) is what keeps it reactive across the
 * overlay boundary.
 *
 * Deliberately ONLY `Signal`s (never a plain store, never a QRL) — same
 * shape `qwik-material/tooltip`'s `TooltipRuntimeSignals` uses, kept
 * strictly separate from `SelectRuntimeConfig` (plain data + QRLs) and
 * `QwikCdkInternals` (the shared store, always its own top-level argument —
 * see `ctx` below). An earlier version of this file bundled `ctx` and the
 * host/trigger/form-field-origin REF signals into `SelectRuntimeConfig`
 * instead; that crashed at runtime the moment a handler capturing it ran
 * ("Cannot read properties of undefined", deep in Qwik's own QRL
 * resolution) — nesting a `useStore()`-backed object (`ctx`) as a FIELD of
 * a plain object that itself gets captured by a `$()` closure is not the
 * same as capturing `ctx` as its own free variable, which is what every
 * other qwik-cdk/qwik-material consumer (`showTooltip(ctx, signals,
 * config, ...)`) already does safely. Keeping `ctx` a fully separate
 * argument, and refs here (Signals, not nested in `cfg`), avoids the same
 * trap.
 */
export interface SelectRuntimeSignals {
  panelOpen: Signal<boolean>;
  activeIndex: Signal<number>;
  exiting: Signal<boolean>;
  overlayRef: Signal<NoSerialize<OverlayRef> | undefined>;
  /** "Sticky" preferred overlay origin — see select/SYNC.md's "overlay
   *  origin / first-open vs. later-open" write-up. `undefined` until the
   *  first `open()`, after which it's set to the form-field wrapper (or the
   *  select's own trigger, standalone). */
  stickyOrigin: Signal<NoSerialize<Element> | undefined>;
  /** Current value — a single value, or an array when `multiple`. Owned
   *  internally (seeded once from `props.value` — see mat-select.tsx's doc
   *  comment on why `props.value` itself is not reactively re-read). */
  value: Signal<unknown>;
  keyManager: Signal<NoSerialize<ListKeyManager<KeyManagerItem>> | undefined>;
  /** Ref to the rendered `.mat-mdc-select-panel` element, forwarded down
   *  into `MatSelectPanel` — used for scroll-into-view and the exit
   *  animation's `animationend` listener. */
  panelEl: Signal<Element | undefined>;
  liveAnnouncer: Signal<NoSerialize<LiveAnnouncer> | undefined>;
  /** `MatSelect`'s own host/trigger element refs, and (when nested in a
   *  `<MatFormField>`) its wrapper ref — read `.value` live, at the moment
   *  a function here actually runs, never dereferenced ahead of time (refs
   *  populate post-mount; see `mat-select.tsx`'s own doc comment on `cfg`). */
  hostRef: Signal<HTMLElement | undefined>;
  triggerRef: Signal<HTMLElement | undefined>;
  formFieldOriginRef: Signal<Element | undefined> | undefined;
}

export interface SelectRuntimeConfig {
  multiple: boolean;
  disabled: boolean;
  typeaheadDebounceInterval: number;
  isRtl: boolean;
  animationsDisabled: boolean;
  panelId: string;
  panelClass: readonly string[];
  overlayPanelClass: string | string[] | undefined;
  color: 'primary' | 'accent' | 'warn' | undefined;
  ariaLabel: string | undefined;
  panelAriaLabelledby: string | null;
  hideSingleSelectionIndicator: boolean;
  panelWidth: string | number | null;
  canSelectNullableOptions: boolean;
  /** QRL props threaded through UNWRAPPED — see `mat-select.tsx`'s own
   *  doc comment for why a QRL (not a plain function wrapping one) is
   *  what's safe to capture/call from this module's plain functions. */
  onValueChange$: QRL<(value: unknown) => void> | undefined;
  onTouched$: QRL<() => void> | undefined;
  onOpenedChange$: QRL<(open: boolean) => void> | undefined;
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

/** Mirrors `MatSelect._getOverlayWidth` — always measured off the SAME
 *  preferred-origin element used for width (the form field wrapper, when
 *  there is one — regardless of which shape the overlay ends up rendered
 *  in; see select.ts's own "PANEL WIDTH" note and select/SYNC.md). */
function getOverlayWidth(cfg: SelectRuntimeConfig, signals: SelectRuntimeSignals): string | number {
  if (cfg.panelWidth === 'auto' || cfg.panelWidth === undefined) {
    const el = signals.formFieldOriginRef?.value ?? signals.hostRef.value;
    return el?.getBoundingClientRect().width ?? '';
  }
  return cfg.panelWidth === null ? '' : cfg.panelWidth;
}

/** Builds (or rebuilds) the `ListKeyManager` for the CURRENT flat option
 *  list, preserving nothing across calls — matches this port's "always a
 *  fresh overlay/key-manager per open session" simplification (same family
 *  as tooltip-runtime.ts's documented "fresh OverlayRef per show()"
 *  decision); cheap since option lists here are small and static. */
function buildKeyManager(
  flat: readonly ResolvedSelectOption[],
  cfg: SelectRuntimeConfig,
  signals: SelectRuntimeSignals,
): ListKeyManager<KeyManagerItem> {
  const items: KeyManagerItem[] = flat.map(option => ({
    option,
    disabled: option.disabled,
    getLabel: () => option.label,
  }));

  const manager = createListKeyManager(items)
    .withTypeAhead(cfg.typeaheadDebounceInterval)
    .withVerticalOrientation()
    .withHomeAndEnd()
    .withPageUpDown()
    .withAllowedModifierKeys(['shiftKey'])
    .skipPredicate(it => (signals.panelOpen.value ? false : !!it.disabled));

  manager.onChange(index => {
    signals.activeIndex.value = index;
    if (signals.panelOpen.value) scrollOptionIntoView(index, flat, signals);
  });
  manager.onTabOut(() => {
    if (signals.panelOpen.value) {
      const active = manager.activeItem;
      if (!cfg.multiple && active) {
        selectOption(active.option, true, flat, cfg, signals);
      }
      signals.hostRef.value?.focus();
      closeSelectPanel(cfg, signals);
    }
  });

  return manager;
}

/** Lazily (re)creates the key manager for the given flat list, keeping the
 *  existing one (and its active index) when the list is unchanged in
 *  length — good enough for this port's static-option scenarios. */
function getKeyManager(
  flat: readonly ResolvedSelectOption[],
  cfg: SelectRuntimeConfig,
  signals: SelectRuntimeSignals,
): ListKeyManager<KeyManagerItem> {
  if (!signals.keyManager.value) {
    signals.keyManager.value = noSerialize(buildKeyManager(flat, cfg, signals));
  }
  return signals.keyManager.value as ListKeyManager<KeyManagerItem>;
}

/** Mirrors upstream `_getOptionScrollPosition` (`src/material/core/option/option.ts`). */
export function getOptionScrollPosition(
  optionOffset: number,
  optionHeight: number,
  currentScrollPosition: number,
  panelHeight: number,
): number {
  if (optionOffset < currentScrollPosition) {
    return optionOffset;
  }
  if (optionOffset + optionHeight > currentScrollPosition + panelHeight) {
    return Math.max(0, optionOffset - panelHeight + optionHeight);
  }
  return currentScrollPosition;
}

/** Mirrors `MatSelect._scrollOptionIntoView()` — a visual-only nicety (sets
 *  `scrollTop`, never observed by the structural DOM diff this port's
 *  parity suite runs), kept for fidelity. A no-op if the panel or the
 *  target option's DOM node isn't available (e.g. right after `open()`,
 *  before the overlay has actually attached). */
function scrollOptionIntoView(
  index: number,
  flat: readonly ResolvedSelectOption[],
  signals: SelectRuntimeSignals,
): void {
  if (!isBrowser) return;
  const panel = signals.panelEl.value as HTMLElement | undefined;
  const option = flat[index];
  if (!panel || !option) return;
  const el = document.getElementById(option.id);
  if (!el) return;
  panel.scrollTop = getOptionScrollPosition(
    (el as HTMLElement).offsetTop,
    (el as HTMLElement).offsetHeight,
    panel.scrollTop,
    panel.offsetHeight,
  );
}

function isSelected(value: unknown, option: ResolvedSelectOption, multiple: boolean): boolean {
  if (multiple) {
    return Array.isArray(value) && value.some(v => v === option.value);
  }
  return value === option.value;
}

/** Mirrors `_highlightCorrectOption()`. */
function highlightCorrectOption(
  flat: readonly ResolvedSelectOption[],
  cfg: SelectRuntimeConfig,
  signals: SelectRuntimeSignals,
): void {
  const manager = getKeyManager(flat, cfg, signals);
  const value = signals.value.value;
  const empty = cfg.multiple
    ? !(Array.isArray(value) && value.length)
    : value == null || value === '';

  if (empty) {
    const firstEnabled = flat.findIndex(o => !o.ownDisabled && !o.disabled);
    manager.setActiveItem(firstEnabled);
  } else {
    const selectedIndex = flat.findIndex(o => isSelected(value, o, cfg.multiple));
    manager.setActiveItem(selectedIndex);
  }
}

/** Mirrors `MatSelect.open()`. */
export function openSelectPanel(
  flat: readonly ResolvedSelectOption[],
  tree: readonly ResolvedSelectNode[],
  ctx: QwikCdkInternals,
  cfg: SelectRuntimeConfig,
  signals: SelectRuntimeSignals,
): void {
  if (!isBrowser) return;
  if (signals.panelOpen.value || cfg.disabled || flat.length === 0) return;

  const originEl = (signals.stickyOrigin.value as Element | undefined) ?? signals.triggerRef.value;
  if (!originEl) return;

  const strategy = createFlexibleConnectedPositionStrategy(originEl)
    .withFlexibleDimensions(true)
    .withPush(true)
    .withPopoverLocation('inline');
  strategy.withPositions(SELECT_POSITIONS);

  const {keyboardDispatcher, outsideClickDispatcher} = ensureCdkDispatchers(ctx);
  const idGen = makeIdGen(ctx);
  const registry = makeRegistry(ctx);
  const overlay = createOverlayService(registry, idGen);

  signals.exiting.value = false;

  const overlayRef = overlay.create(
    MatSelectPanel,
    {
      id: cfg.panelId,
      tree,
      multiple: cfg.multiple,
      value: signals.value,
      activeIndex: signals.activeIndex,
      exiting: signals.exiting,
      hideSingleSelectionIndicator: cfg.hideSingleSelectionIndicator,
      panelClass: cfg.panelClass,
      color: cfg.color,
      ariaLabel: cfg.ariaLabel,
      ariaLabelledby: cfg.panelAriaLabelledby,
      animationsDisabled: cfg.animationsDisabled,
      panelRef: signals.panelEl,
      onOptionSelect: (option: ResolvedSelectOption) => {
        selectOption(option, true, flat, cfg, signals);
      },
    },
    {
      direction: cfg.isRtl ? 'rtl' : 'ltr',
      positionStrategy: strategy,
      scrollStrategy: createRepositionScrollStrategy(),
      hasBackdrop: true,
      backdropClass: 'cdk-overlay-transparent-backdrop',
      panelClass: cfg.overlayPanelClass,
      width: getOverlayWidth(cfg, signals),
      disableAnimations: cfg.animationsDisabled,
    },
  );

  signals.overlayRef.value = noSerialize(overlayRef);
  signals.panelOpen.value = true;

  keyboardDispatcher.add(overlayRef, {
    onKeydown(e) {
      if (e.key === 'Escape' && !hasModifierKey(e)) {
        e.preventDefault();
        closeSelectPanel(cfg, signals);
      }
    },
  });
  outsideClickDispatcher.add(overlayRef, {
    onOutsideClick() {
      closeSelectPanel(cfg, signals);
    },
  });

  const manager = getKeyManager(flat, cfg, signals);
  manager.setItems(
    flat.map(option => ({option, disabled: option.disabled, getLabel: () => option.label})),
  );
  manager.withHorizontalOrientation(null);
  highlightCorrectOption(flat, cfg, signals);
  if (signals.activeIndex.value >= 0)
    scrollOptionIntoView(signals.activeIndex.value, flat, signals);

  // Sticky origin for the NEXT open — see the field's own doc comment.
  signals.stickyOrigin.value = noSerialize(
    signals.formFieldOriginRef?.value ?? signals.triggerRef.value,
  );

  cfg.onOpenedChange$?.(true);
}

/** Mirrors `MatSelect._detachOverlay()` (called once the exit
 *  animation/fallback timer has run, or immediately when animations are
 *  disabled — see `closeSelectPanel`). */
function detachOverlay(signals: SelectRuntimeSignals): void {
  const ref = signals.overlayRef.value;
  if (ref) {
    ref.detach();
  }
  signals.overlayRef.value = undefined;
  signals.exiting.value = false;
}

/** Mirrors `MatSelect.close()` + `_exitAndDetach()`. */
export function closeSelectPanel(cfg: SelectRuntimeConfig, signals: SelectRuntimeSignals): void {
  if (!signals.panelOpen.value) return;
  signals.panelOpen.value = false;

  const manager = signals.keyManager.value;
  manager?.withHorizontalOrientation(cfg.isRtl ? 'rtl' : 'ltr');

  const panelEl = signals.panelEl.value as HTMLElement | undefined;
  if (cfg.animationsDisabled || !panelEl) {
    detachOverlay(signals);
  } else {
    signals.exiting.value = true;
    let settled = false;
    const finish = () => {
      if (settled) return;
      settled = true;
      panelEl.removeEventListener('animationend', onAnimationEnd);
      clearTimeout(fallback);
      detachOverlay(signals);
    };
    const onAnimationEnd = (event: AnimationEvent) => {
      if (event.animationName === '_mat-select-exit') finish();
    };
    panelEl.addEventListener('animationend', onAnimationEnd);
    const fallback = setTimeout(finish, 200);
  }

  cfg.onTouched$?.();
  cfg.onOpenedChange$?.(false);
}

/** Mirrors `MatSelect._onSelect()` + `_sortValues()` + `_propagateChanges()`,
 *  collapsed into one call (this port has no separate `SelectionModel` —
 *  `signals.value` IS the selection model). `flat` is only needed to
 *  restore panel-order (mirrors `_sortValues`'s `options.indexOf(...)`
 *  comparator) after a multi-select toggle. */
function selectOption(
  option: ResolvedSelectOption,
  isUserInput: boolean,
  flat: readonly ResolvedSelectOption[],
  cfg: SelectRuntimeConfig,
  signals: SelectRuntimeSignals,
): void {
  if (option.disabled) return;

  if (cfg.multiple) {
    const current = Array.isArray(signals.value.value) ? (signals.value.value as unknown[]) : [];
    const next = current.includes(option.value)
      ? current.filter(v => v !== option.value)
      : [...current, option.value];
    // Mirrors `_sortValues()`: order follows panel (document) order, not
    // click order.
    const indexOf = (v: unknown) => flat.findIndex(o => o.value === v);
    next.sort((a, b) => indexOf(a) - indexOf(b));
    signals.value.value = next;
    if (isUserInput) {
      signals.keyManager.value?.setActiveItem(option.index);
    }
    cfg.onValueChange$?.(next);
    return;
  }

  if (option.value == null && !cfg.canSelectNullableOptions) {
    signals.value.value = undefined;
    cfg.onValueChange$?.(undefined);
  } else {
    signals.value.value = option.value;
    cfg.onValueChange$?.(option.value);
  }

  if (isUserInput) {
    closeSelectPanel(cfg, signals);
    signals.hostRef.value?.focus();
  }
}

/** Mirrors `MatSelect._handleClosedKeydown()`. */
export function handleClosedKeydown(
  event: KeyboardEvent,
  flat: readonly ResolvedSelectOption[],
  tree: readonly ResolvedSelectNode[],
  ctx: QwikCdkInternals,
  cfg: SelectRuntimeConfig,
  signals: SelectRuntimeSignals,
): void {
  const manager = getKeyManager(flat, cfg, signals);
  manager.setItems(
    flat.map(option => ({option, disabled: option.disabled, getLabel: () => option.label})),
  );

  const isArrowKey =
    event.key === 'ArrowDown' ||
    event.key === 'ArrowUp' ||
    event.key === 'ArrowLeft' ||
    event.key === 'ArrowRight';
  const isOpenKey = event.keyCode === ENTER || event.keyCode === SPACE;

  if (
    (!manager.isTyping() && isOpenKey && !hasModifierKey(event)) ||
    ((cfg.multiple || event.altKey) && isArrowKey)
  ) {
    event.preventDefault();
    openSelectPanel(flat, tree, ctx, cfg, signals);
  } else if (!cfg.multiple) {
    const previouslySelected = manager.activeItem;
    manager.onKeydown(event);
    const selected = manager.activeItem;
    if (selected && selected !== previouslySelected) {
      selectOption(selected.option, true, flat, cfg, signals);
      if (isBrowser) {
        const announcer = signals.liveAnnouncer.value ?? noSerialize(createLiveAnnouncer());
        signals.liveAnnouncer.value = announcer;
        announcer?.announce(selected.option.label, 'polite', 10000);
      }
    }
  }
}

/** Mirrors `MatSelect._handleOpenKeydown()`. Escape is handled separately,
 *  by the overlay keyboard dispatcher wired in `openSelectPanel` — see that
 *  function's `keyboardDispatcher.add` call and select.ts's own header note
 *  on why TWO independent Escape paths exist upstream. */
export function handleOpenKeydown(
  event: KeyboardEvent,
  flat: readonly ResolvedSelectOption[],
  cfg: SelectRuntimeConfig,
  signals: SelectRuntimeSignals,
): void {
  const manager = getKeyManager(flat, cfg, signals);
  const isArrowKey = event.keyCode === DOWN_ARROW || event.keyCode === UP_ARROW;
  const isTyping = manager.isTyping();

  if (isArrowKey && event.altKey) {
    event.preventDefault();
    closeSelectPanel(cfg, signals);
  } else if (
    !isTyping &&
    (event.keyCode === ENTER || event.keyCode === SPACE) &&
    manager.activeItem &&
    !hasModifierKey(event)
  ) {
    event.preventDefault();
    selectOption(manager.activeItem.option, true, flat, cfg, signals);
  } else if (!isTyping && cfg.multiple && event.keyCode === A && event.ctrlKey) {
    event.preventDefault();
    const hasDeselected = flat.some(o => !o.disabled && !isSelected(signals.value.value, o, true));
    const next = hasDeselected ? flat.filter(o => !o.disabled).map(o => o.value) : [];
    signals.value.value = next;
    cfg.onValueChange$?.(next);
  } else {
    manager.onKeydown(event);
  }
}

/** Mirrors `MatSelect._handleKeydown()`. */
export function handleSelectKeydown(
  event: KeyboardEvent,
  flat: readonly ResolvedSelectOption[],
  tree: readonly ResolvedSelectNode[],
  ctx: QwikCdkInternals,
  cfg: SelectRuntimeConfig,
  signals: SelectRuntimeSignals,
): void {
  if (cfg.disabled) return;
  if (event.keyCode === ALT) return;
  if (signals.panelOpen.value) {
    handleOpenKeydown(event, flat, cfg, signals);
  } else {
    handleClosedKeydown(event, flat, tree, ctx, cfg, signals);
  }
}

export type {KeyManagerItem};
