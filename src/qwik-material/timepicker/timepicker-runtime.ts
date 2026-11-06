/**
 * Module-level orchestration for `useMatTimepicker()`'s handle — ported from
 * `MatTimepicker.open()`/`.close()`/`._selectValue()`/`._handleKeydown()`/
 * `._syncSelectedState()`/`._generateOptions()` (`src/material/timepicker/timepicker.ts`) and
 * `MatTimepickerInput._handleInput()`/`._handleBlur()`/`._handleKeydown()`/
 * `._assignUserSelection()`/`._formatValue()` (`timepicker-input.ts`).
 *
 * Deliberately NOT closures inside `mat-timepicker-input.tsx`/`mat-timepicker-toggle.tsx` — same
 * rationale as `qwik-material/select/select-runtime.ts`'s module doc comment (which this
 * mirrors): every function here takes its state as explicit arguments (the shared
 * `MatTimepickerHandle` + a `QwikCdkInternals` context where overlay plumbing is needed), so the
 * two components' own `$()` handlers are the only real QRL boundaries — they just call these
 * plain functions directly.
 *
 * Interactive/runtime date handling that doesn't need a CONFIGURABLE adapter (building the
 * option list, the cache key, keyboard navigation math — all arithmetic/formatting that no
 * scenario ever needs a non-default locale or a custom adapter for) still uses
 * `DEFAULT_DATE_ADAPTER`/`MAT_NATIVE_DATE_FORMATS` directly (plain module-level imports, never a
 * `useContext()`-based hook — hooks can't be called from inside a `$()` handler). Parsing/
 * formatting the connected input's TEXT (`handleTimepickerInput`/`handleTimepickerBlur`/
 * `selectTimepickerOption`'s reformat) — the one place an app-supplied custom adapter actually
 * matters for a timepicker — goes through `resolveAdapterForTimepicker()` instead, which
 * resolves whatever `DateAdapter`/`MatDateFormats` the owning `useMatTimepicker()` handle was
 * configured with (app-wide or per subtree — see `use-mat-timepicker.ts` and
 * `datepicker/SYNC.md`'s "DateAdapter / MAT_DATE_FORMATS / MAT_DATE_LOCALE / dateClass" section).
 */
import {noSerialize, type Signal} from '@qwik.dev/core';
import {isBrowser} from '@qwik.dev/core/build';
import {
  DOWN_ARROW,
  ENTER,
  ESCAPE,
  hasModifierKey,
  TAB,
  UP_ARROW,
} from '@angular-community/qwik-cdk/keycodes';
import {ensureCdkDispatchers, type QwikCdkInternals} from '@angular-community/qwik-cdk';
import {
  createFlexibleConnectedPositionStrategy,
  createOverlayService,
  createRepositionScrollStrategy,
  type ConnectedPosition,
  type OverlayEntry,
  type OverlayRegistry,
} from '@angular-community/qwik-cdk/overlay';
import {createListKeyManager, type ListKeyManager} from '@angular-community/qwik-cdk/a11y';
import type {DateAdapter} from '../core/datetime/date-adapter';
import type {MatDateFormats} from '../core/datetime/date-formats';
import {DEFAULT_DATE_ADAPTER} from '../core/datetime/native-date-adapter';
import {MAT_NATIVE_DATE_FORMATS} from '../core/datetime/native-date-formats';
import {resolveDateAdapter} from '../core/datetime/use-date-adapter';
import {generateOptions, type MatTimepickerOption} from './timepicker-util';
import {MatTimepickerPanel} from './mat-timepicker-panel';
import type {
  MatTimepickerHandle,
  MatTimepickerRenderOption,
  TimepickerKeyItem,
} from './use-mat-timepicker';

/** Mirrors upstream `MatTimepicker._getOverlayRef()`'s `withPositions([...])`. */
const TIMEPICKER_POSITIONS: ConnectedPosition[] = [
  {originX: 'start', originY: 'bottom', overlayX: 'start', overlayY: 'top'},
  {
    originX: 'start',
    originY: 'top',
    overlayX: 'start',
    overlayY: 'bottom',
    panelClass: 'mat-timepicker-above',
  },
];

const adapter = DEFAULT_DATE_ADAPTER as unknown as DateAdapter<unknown>;
const formats = MAT_NATIVE_DATE_FORMATS;

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

/** Mirrors `MatTimepicker._generateOptions()`. Resolves the current option list (custom
 *  `options`, or an interval-generated list bounded by `min`/`max`, 30-minute default), reusing
 *  the cached list when the cache key (interval + formatted min/max) hasn't changed. */
function generateTimeOptions<D>(picker: MatTimepickerHandle<D>): readonly MatTimepickerOption<D>[] {
  const custom = picker.customOptions.value;
  if (custom !== null) return custom;

  const a = adapter as unknown as DateAdapter<D>;
  const intervalSeconds = picker.interval.value ?? 30 * 60;
  const min = picker.min.value ?? a.setTime(a.today(), 0, 0, 0);
  const max = picker.max.value ?? a.setTime(a.today(), 23, 59, 0);
  const cacheKey = `${intervalSeconds}/${a.format(min, formats.display.timeInput)}/${a.format(max, formats.display.timeInput)}`;

  if (cacheKey !== picker._optionsCacheKey.value) {
    picker._optionsCacheKey.value = cacheKey;
    picker._cachedTimeOptions.value = generateOptions(a, formats, min, max, intervalSeconds);
  }
  return picker._cachedTimeOptions.value;
}

/** Builds a fresh `ListKeyManager` for the given render options — mirrors upstream's
 *  `ActiveDescendantKeyManager` config (`.withHomeAndEnd(true).withPageUpDown(true)
 *  .withVerticalOrientation(true)`, no typeahead/horizontal — timepicker options are never
 *  individually disabled). */
function buildKeyManager<D>(
  options: readonly MatTimepickerRenderOption<D>[],
): ListKeyManager<TimepickerKeyItem<D>> {
  const items: TimepickerKeyItem<D>[] = options.map(option => ({
    option,
    disabled: false,
    getLabel: () => option.label,
  }));
  return createListKeyManager(items).withHomeAndEnd().withPageUpDown().withVerticalOrientation();
}

/** Mirrors `_scrollOptionIntoView`'s call to `option._getHostElement().scrollIntoView(...)` — a
 *  visual-only nicety, never observed by the structural DOM diff this project's parity suite
 *  runs. No-op if the panel or the target option's DOM node isn't available yet (e.g.
 *  immediately after `open()`, before the overlay has actually attached). */
function scrollOptionIntoView<D>(picker: MatTimepickerHandle<D>, index: number): void {
  if (!isBrowser) return;
  const option = picker._renderOptions.value[index];
  if (!option) return;
  const el = document.getElementById(option.id);
  el?.scrollIntoView({block: 'nearest', inline: 'nearest'});
}

/** Mirrors `_syncSelectedState()`: selects+activates the option matching `value` (if any),
 *  scrolling it into view; otherwise activates `fallbackIndex` (or clears the active item). */
function syncSelectedState<D>(
  picker: MatTimepickerHandle<D>,
  manager: ListKeyManager<TimepickerKeyItem<D>>,
  fallbackIndex: number | null,
): void {
  const a = adapter as unknown as DateAdapter<D>;
  const value = picker.value.value;
  const options = picker._renderOptions.value;
  let matchedIndex = -1;

  if (value != null) {
    matchedIndex = options.findIndex(option => a.sameTime(option.value, value));
  }

  if (matchedIndex >= 0) {
    manager.setActiveItem(matchedIndex);
    scrollOptionIntoView(picker, matchedIndex);
  } else if (fallbackIndex !== null && options[fallbackIndex]) {
    manager.setActiveItem(fallbackIndex);
    scrollOptionIntoView(picker, fallbackIndex);
  } else {
    manager.setActiveItem(-1);
  }
}

/** Mirrors `MatTimepicker.open()`. */
export function openTimepickerPanel<D>(
  picker: MatTimepickerHandle<D>,
  ctx: QwikCdkInternals,
  animationsDisabled: boolean,
): void {
  if (!isBrowser) return;

  // Focus should already be on the input, but this call covers programmatic opens too (e.g. the
  // toggle button). Called even if already open, because the user might be clicking the toggle
  // while the input already has focus.
  picker._inputRef.value?.focus();

  if (picker.isOpen.value) return;

  // NO first-open-vs-later-open quirk, unlike `mat-select` — the position AND insertion origin
  // are always the SAME element, resolved fresh on every open: the form field's wrapper when
  // there is one, else the input itself. See timepicker/SYNC.md.
  const originEl = (picker._formFieldOrigin?.value ?? picker._inputRef.value) as
    | HTMLElement
    | undefined;
  if (!originEl) return;

  const idGen = makeIdGen(ctx);
  const timeOptions = generateTimeOptions(picker);
  picker._renderOptions.value = timeOptions.map(option => ({
    ...option,
    id: idGen.getId('mat-option-'),
  }));

  const strategy = createFlexibleConnectedPositionStrategy(originEl)
    .withFlexibleDimensions(false)
    .withPush(false)
    .withTransformOriginOn('.mat-timepicker-panel')
    .withPopoverLocation('inline')
    .withPositions(TIMEPICKER_POSITIONS);

  const {outsideClickDispatcher} = ensureCdkDispatchers(ctx);
  const registry = makeRegistry(ctx);
  const overlay = createOverlayService(registry, idGen, ctx.overlayDefaultConfig);

  picker._exiting.value = false;

  const overlayRef = overlay.create(
    MatTimepickerPanel,
    {
      id: picker.panelId,
      // Cast through `unknown` — `MatTimepickerPanelProps` is deliberately not generic (see its
      // own doc comment); these are the SAME Signal objects, just erased to `unknown` across
      // the `Overlay.create<P>()` boundary.
      options: picker._renderOptions as unknown as Signal<
        readonly MatTimepickerRenderOption<unknown>[]
      >,
      value: picker.value as unknown as Signal<unknown>,
      activeIndex: picker._activeIndex,
      exiting: picker._exiting,
      ariaLabel: picker.ariaLabel.value,
      // Mirrors `_getAriaLabelledby()`: `null` whenever an explicit `aria-label` is set, else the
      // explicit `aria-labelledby` or (the common case, no scenario sets either) the connected
      // form field's own floating-label id.
      ariaLabelledby: picker.ariaLabel.value
        ? undefined
        : picker.ariaLabelledby.value || picker._formFieldLabelId,
      animationsDisabled,
      panelRef: picker._panelEl,
      onOptionSelect: noSerialize((option: MatTimepickerRenderOption<unknown>) => {
        selectTimepickerOption(picker, option as MatTimepickerRenderOption<D>, animationsDisabled);
      }),
    },
    {
      direction: ctx.direction.value,
      positionStrategy: strategy,
      scrollStrategy: createRepositionScrollStrategy(),
      // No backdrop — `outsidePointerEvents()` (the outside-click dispatcher below) handles
      // dismissal instead. Confirmed live against upstream: see timepicker.ts's header.
      hasBackdrop: false,
      disableAnimations: animationsDisabled,
      width: originEl.offsetWidth,
      // Mirrors upstream `MatTimepicker.panelClass` — applied to the OVERLAY PANE
      // (`.cdk-overlay-pane`), NOT the inner `.mat-timepicker-panel` listbox div (confirmed from
      // `timepicker.ts`'s own `_getOverlayRef()`: `panelClass: this.panelClass()` is passed to
      // `createOverlayRef`'s config, not bound anywhere in `timepicker.html`'s template).
      panelClass: picker.panelClassList.value as string[] | undefined,
    },
  );

  picker._overlayRef.value = noSerialize(overlayRef);
  picker.isOpen.value = true;

  // Mirrors `_getOverlayRef()`'s own `outsidePointerEvents()` subscription: closes on a pointer
  // event outside BOTH the panel and the connected input/origin.
  outsideClickDispatcher.add(overlayRef, {
    onOutsideClick(event) {
      const target = event.target as Element | null;
      if (target && target !== originEl && !originEl.contains(target)) {
        closeTimepickerPanel(picker, animationsDisabled);
      }
    },
  });

  const manager = buildKeyManager(picker._renderOptions.value);
  manager.onChange(index => {
    picker._activeIndex.value = index;
    scrollOptionIntoView(picker, index);
  });
  picker._keyManager.value = noSerialize(manager);

  syncSelectedState(picker, manager, 0);

  picker.onOpenedChange$?.(true);
}

/** Mirrors `_detachOverlay()` (called once the exit animation/fallback timer has finished, or
 *  immediately when animations are disabled). */
function detachOverlay<D>(picker: MatTimepickerHandle<D>): void {
  picker._overlayRef.value?.detach();
  picker._overlayRef.value = undefined;
  picker._exiting.value = false;
  picker._keyManager.value?.destroy();
  picker._keyManager.value = undefined;
}

/** Mirrors `MatTimepicker.close()`. `~100ms` exit animation, same family as `mat-select`'s own
 *  (see timepicker/SYNC.md's EXIT ANIMATION note). */
export function closeTimepickerPanel<D>(
  picker: MatTimepickerHandle<D>,
  animationsDisabled: boolean,
): void {
  if (!picker.isOpen.value) return;
  picker.isOpen.value = false;
  // Mirrors `timepicker.closed.subscribe(() => this._onTouched?.())` — closing by ANY means
  // (selecting, Escape, Tab, outside click) marks the implicit control touched.
  picker.touched.value = true;

  const panelEl = picker._panelEl.value as HTMLElement | undefined;
  if (animationsDisabled || !panelEl) {
    detachOverlay(picker);
  } else {
    picker._exiting.value = true;
    let settled = false;
    const finish = () => {
      if (settled) return;
      settled = true;
      panelEl.removeEventListener('animationend', onAnimationEnd);
      clearTimeout(fallback);
      detachOverlay(picker);
    };
    const onAnimationEnd = (event: AnimationEvent) => {
      if (event.animationName === '_mat-timepicker-exit') finish();
    };
    panelEl.addEventListener('animationend', onAnimationEnd);
    const fallback = setTimeout(finish, 200);
  }

  picker.onOpenedChange$?.(false);
}

/** Resolves the `DateAdapter`/`MatDateFormats` a timepicker handle was configured with
 *  (app-wide or per subtree — see `use-mat-timepicker.ts`'s `_dateAdapterFactory`/`_dateFormats`/
 *  `_locale` doc comments) into a live adapter instance, fresh, every call — mirrors
 *  `datepicker-runtime.ts`'s identical `resolveAdapterForPicker()`; never cache the result past
 *  the current async call. */
async function resolveAdapterForTimepicker<D>(
  picker: MatTimepickerHandle<D>,
): Promise<{adapter: DateAdapter<D>; formats: MatDateFormats}> {
  const a = await resolveDateAdapter(picker._dateAdapterFactory, picker._locale.value);
  return {adapter: a, formats: picker._dateFormats};
}

/** Formats `value` for display with the GIVEN adapter/formats — shared by every custom-adapter-
 *  aware call site below, and exported so `mat-timepicker-input.tsx` can compute its own
 *  SSR-correct, ADAPTER-AWARE initial `.value` snapshot (mirrors `datepicker-runtime.ts`'s
 *  identically-shaped `formatDateWithAdapter()`, and its own usage in `mat-datepicker-input.tsx`). */
export function formatTimeWithAdapter<D>(
  a: DateAdapter<D>,
  f: MatDateFormats,
  value: D | null,
): string {
  const valid = value != null && a.isValid(value) ? value : null;
  return valid == null ? '' : a.format(valid, f.display.timeInput);
}

/** Writes the formatted display string for `value` directly onto the connected `<input>`'s DOM
 *  `.value` property — mirrors `MatTimepickerInput._formatValue()`. A direct ref write, not a
 *  reactive JSX prop, matching `qwik-material/input`'s own established "value via ref" pattern
 *  (see `mat-input.tsx`'s doc comment on its `value` prop). Async: goes through whichever
 *  `DateAdapter`/`MatDateFormats` this picker was configured with — see
 *  `resolveAdapterForTimepicker()`. */
async function formatInputValue<D>(picker: MatTimepickerHandle<D>, value: D | null): Promise<void> {
  const el = picker._inputRef.value;
  if (!el) return;
  const resolved = await resolveAdapterForTimepicker(picker);
  el.value = formatTimeWithAdapter(resolved.adapter, resolved.formats, value);
}

/** Mirrors `_isValid()`. */
function isValidOrNull<D>(a: DateAdapter<D>, value: D | null): boolean {
  return !value || a.isValid(value);
}

/** Mirrors `MatTimepickerInput._updateFormsState()`'s `matTimepickerParse`/`Min`/`Max` half —
 *  recomputes the three error signals from the current `value`/`min`/`max`. Called after every
 *  change that could affect them (typed input, selecting an option, Escape-clearing). */
function updateValidation<D>(picker: MatTimepickerHandle<D>, value: D | null): void {
  const a = adapter as unknown as DateAdapter<D>;
  const valid = isValidOrNull(a, value);
  picker.parseError.value = !valid;
  const min = picker.min.value;
  const max = picker.max.value;
  picker.minError.value = !!min && !!value && valid && a.compareTime(min, value) > 0;
  picker.maxError.value = !!max && !!value && valid && a.compareTime(max, value) < 0;
  if (value != null && valid) {
    picker._lastValidValue.value = value;
  }
}

/**
 * Mirrors `MatTimepickerInput._assignUserSelection()`: if `selection` is a syntactically valid
 * time, it's merged onto the last-known-valid DATE (so a datepicker sharing the same value
 * object wouldn't lose its date component — not exercised by any scenario here, ported for
 * fidelity); otherwise `selection` (null, or an invalid date) is assigned as-is.
 */
function assignUserSelection<D>(picker: MatTimepickerHandle<D>, selection: D | null): void {
  const a = adapter as unknown as DateAdapter<D>;
  let toAssign: D | null;

  if (selection == null || !a.isValid(selection)) {
    toAssign = selection;
  } else {
    const target = a.getValidDateOrNull(picker._lastValidValue.value ?? picker.value.value);
    const hours = a.getHours(selection);
    const minutes = a.getMinutes(selection);
    const seconds = a.getSeconds(selection);
    toAssign = target ? a.setTime(target, hours, minutes, seconds) : selection;
  }

  picker.value.value = toAssign;
  // Mirrors the CVA `onChange` call marking the implicit control dirty — fires for both typed
  // input and a picked option (both funnel through `assignUserSelection`).
  picker.dirty.value = true;
  updateValidation(picker, toAssign);
  picker.onValueChange$?.(toAssign);
}

/** Mirrors `MatTimepicker._selectValue()` + `MatTimepickerInput.timepickerValueAssigned()`.
 *  Async — see `formatInputValue()`'s doc comment. */
export async function selectTimepickerOption<D>(
  picker: MatTimepickerHandle<D>,
  option: MatTimepickerRenderOption<D>,
  animationsDisabled: boolean,
): Promise<void> {
  closeTimepickerPanel(picker, animationsDisabled);
  assignUserSelection(picker, option.value);
  await formatInputValue(picker, option.value);
  picker._inputRef.value?.focus();
}

/** Mirrors `MatTimepickerInput._handleInput()`. Async — `parseTime()` goes through whichever
 *  `DateAdapter`/`MatDateFormats` this picker was configured with (an app-supplied custom
 *  adapter's whole point), resolved fresh via `resolveAdapterForTimepicker()` — a `QRL` factory,
 *  never a stored live instance, so this resolves correctly even on the FIRST invocation after
 *  a real SSR→resume. `sameTime` (arithmetic only, never locale/format-dependent) stays on the
 *  hardcoded module singleton. */
export async function handleTimepickerInput<D>(
  event: Event,
  picker: MatTimepickerHandle<D>,
): Promise<void> {
  const arithmetic = adapter as unknown as DateAdapter<D>;
  const text = (event.target as HTMLInputElement).value;
  const {adapter: a, formats: f} = await resolveAdapterForTimepicker(picker);
  const date = a.parseTime(text, f.parse.timeInput);
  const currentValue = picker.value.value;
  const hasChanged = !arithmetic.sameTime(date, currentValue);

  if (!date || hasChanged || (text && currentValue == null)) {
    assignUserSelection(picker, date);
  } else {
    updateValidation(picker, currentValue);
  }
}

/** Mirrors `MatTimepickerInput._handleBlur()`: reformats a valid value on blur, and — matching
 *  `if (!this.timepicker().isOpen()) this._onTouched?.();` — marks the implicit control touched
 *  when blurring while the panel was never opened (the "closed by selecting/Escape/outside
 *  click" path already marks it via `closeTimepickerPanel`). Async — see `formatInputValue()`'s
 *  doc comment. */
export async function handleTimepickerBlur<D>(picker: MatTimepickerHandle<D>): Promise<void> {
  const a = adapter as unknown as DateAdapter<D>;
  const value = picker.value.value;
  if (value != null && a.isValid(value)) {
    await formatInputValue(picker, value);
  }
  if (!picker.isOpen.value) {
    picker.touched.value = true;
  }
}

/** Mirrors `MatTimepickerInput._handleKeydown()`'s closed-picker branch. */
function handleClosedKeydown<D>(
  event: KeyboardEvent,
  picker: MatTimepickerHandle<D>,
  ctx: QwikCdkInternals,
  animationsDisabled: boolean,
): void {
  if (event.keyCode === ESCAPE && !hasModifierKey(event) && picker.value.value !== null) {
    event.preventDefault();
    assignUserSelection(picker, null);
    formatInputValue(picker, null);
  } else if (event.keyCode === DOWN_ARROW || event.keyCode === UP_ARROW) {
    event.preventDefault();
    openTimepickerPanel(picker, ctx, animationsDisabled);
  }
}

/** Mirrors `MatTimepicker._handleKeydown()` (the overlay's own keydown subscription) — reachable
 *  here, rather than via a separate overlay-level dispatcher, because real DOM focus never
 *  leaves the connected `<input>` (same reasoning `mat-select`'s own host-level `onKeyDown$`
 *  relies on). */
function handleOpenKeydown<D>(
  event: KeyboardEvent,
  picker: MatTimepickerHandle<D>,
  animationsDisabled: boolean,
): void {
  const keyCode = event.keyCode;
  const manager = picker._keyManager.value;

  if (keyCode === TAB) {
    closeTimepickerPanel(picker, animationsDisabled);
  } else if (keyCode === ESCAPE && !hasModifierKey(event)) {
    event.preventDefault();
    closeTimepickerPanel(picker, animationsDisabled);
  } else if (keyCode === ENTER) {
    event.preventDefault();
    const activeIndex = manager?.activeItemIndex ?? -1;
    const active =
      activeIndex != null && activeIndex >= 0
        ? picker._renderOptions.value[activeIndex]
        : undefined;
    if (active) {
      selectTimepickerOption(picker, active, animationsDisabled);
    } else {
      closeTimepickerPanel(picker, animationsDisabled);
    }
  } else {
    manager?.onKeydown(event);
  }
}

/** Mirrors `MatTimepickerInput._handleKeydown()`'s dispatch between open/closed. */
export function handleTimepickerInputKeydown<D>(
  event: KeyboardEvent,
  picker: MatTimepickerHandle<D>,
  ctx: QwikCdkInternals,
  animationsDisabled: boolean,
): void {
  if (picker.disabled.value) return;
  if (picker.isOpen.value) {
    handleOpenKeydown(event, picker, animationsDisabled);
  } else {
    handleClosedKeydown(event, picker, ctx, animationsDisabled);
  }
}

/** Formats the given value for display — exported so `mat-timepicker-input.tsx` can compute the
 *  SSR-correct initial `.value` snapshot (mirrors `MatInput`'s own `initialValue` pattern). */
export function formatTimeForDisplay<D>(value: D | null): string {
  if (value == null) return '';
  const a = adapter as unknown as DateAdapter<D>;
  if (!a.isValid(value)) return '';
  return a.format(value, formats.display.timeInput);
}
