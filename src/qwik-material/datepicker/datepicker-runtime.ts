/**
 * Module-level orchestration for `useMatDatepicker()`/`useMatDateRangePicker()`'s handles —
 * ported from `MatDatepickerBase.open()`/`close()`/`_openOverlay()`/`_getDropdownStrategy()`/
 * `_getDialogStrategy()` and `MatDatepickerContent._handleUserSelection()`/`_applyPendingSelection
 * ()`/`_assignActions()` (`datepicker-base.ts`), plus `MatDatepickerInput._onInput()`/`_onBlur()`
 * (`datepicker-input-base.ts`) and `MatRangeDateSelectionModel.add()`/
 * `DefaultMatCalendarRangeStrategy.selectionFinished()` (already ported as pure functions in
 * `date-range-selection.ts` — this file just calls them).
 *
 * Deliberately NOT closures inside the render components — same rationale as
 * `qwik-material/timepicker/timepicker-runtime.ts`'s own module doc comment (which this mirrors):
 * every function here takes its state as an explicit `picker` handle argument (+ a
 * `QwikCdkInternals` context where overlay plumbing is needed), so the render components' own
 * `$()` handlers are the only real QRL boundaries — they just call these plain functions
 * directly.
 *
 * Interactive/runtime date handling always uses `DEFAULT_DATE_ADAPTER`/`MAT_NATIVE_DATE_FORMATS`
 * directly (plain module-level imports, never a `useContext()`-based hook) — same "no live locale
 * switching" simplification this port's other components already establish.
 *
 * ## Pending vs. real model (actions rows)
 *
 * Mirrors `MatDatepickerContent._assignActions()`: when an actions row IS registered
 * (`picker._actionsContent.value !== undefined`), a selection is written to `picker._pendingValue`
 * ONLY — the real `picker.value` (and the connected input's displayed text) stay untouched, and
 * the overlay stays open, until `applyDatepickerSelection`/`applyDateRangePickerSelection`
 * commits it (or `cancelDatepickerSelection`/`cancelDateRangePickerSelection` discards it by
 * simply closing). `picker._pendingValue` is reseeded from the real `value` at the START of every
 * `open()` (mirrors `this._globalModel.clone()`), so a cancelled session's stale pending edits
 * are automatically discarded the next time the picker opens — no explicit "revert" step needed.
 * When there's no actions row, every selection writes `picker.value` directly (mirrors
 * `this._model === this._globalModel`) and auto-closes once "complete" (mirrors `(!this._model ||
 * this._model.isComplete()) && !this._actionsPortal`).
 */
import {noSerialize, type QRL, type Signal} from '@qwik.dev/core';
import {isBrowser} from '@qwik.dev/core/build';
import {hasModifierKey} from '@angular-community/qwik-cdk/keycodes';
import {focusVia} from '@angular-community/qwik-cdk/a11y';
import {ensureCdkDispatchers, type QwikCdkInternals} from '@angular-community/qwik-cdk';
import {
  createBlockScrollStrategy,
  createFlexibleConnectedPositionStrategy,
  createGlobalPositionStrategy,
  createOverlayService,
  createRepositionScrollStrategy,
  type ConnectedPosition,
  type OverlayEntry,
  type OverlayRegistry,
} from '@angular-community/qwik-cdk/overlay';
import type {DateAdapter} from '../core/datetime/date-adapter';
import type {MatDateFormats} from '../core/datetime/date-formats';
import {DEFAULT_DATE_ADAPTER} from '../core/datetime/native-date-adapter';
import {MAT_NATIVE_DATE_FORMATS} from '../core/datetime/native-date-formats';
import {resolveDateAdapter} from '../core/datetime/use-date-adapter';
import {cloneJsxForReuse} from '../core/jsx-reuse';
import {DATEPICKER_INTL} from './datepicker-intl';
import {MatDatepickerContent, type MatDatepickerContentProps} from './mat-datepicker-content';
import {isRangeComplete, rangeSelectionFinished, type DateRange} from './date-range-selection';
import type {MatCalendarCellClassFunction} from './calendar-math';
import type {
  MatDatepickerCore,
  MatDatepickerHandle,
  MatDateRangePickerHandle,
} from './use-mat-datepicker';

/** Mirrors `MatDatepickerBase._setConnectedPositions()` at the default `xPosition: 'start'`/
 *  `yPosition: 'below'` — neither is exposed as an option by this port (no scenario needs a
 *  non-default value; see `use-mat-datepicker.ts`). */
const DROPDOWN_POSITIONS: ConnectedPosition[] = [
  {originX: 'start', originY: 'bottom', overlayX: 'start', overlayY: 'top'},
  {originX: 'start', originY: 'top', overlayX: 'start', overlayY: 'bottom'},
  {originX: 'end', originY: 'bottom', overlayX: 'end', overlayY: 'top'},
  {originX: 'end', originY: 'top', overlayX: 'end', overlayY: 'bottom'},
];

/** CSS animation durations — see `datepicker-content.scss` (byte-synced from upstream): dropdown
 *  enter 120ms, dialog(touch) enter 150ms, exit 100ms (both modes). Ported as plain timers (see
 *  `use-mat-datepicker.ts`'s `_entering`/`_exiting` doc comments for why real `animationstart`/
 *  `animationend` listeners aren't needed here). */
const DROPDOWN_ENTER_MS = 120;
const DIALOG_ENTER_MS = 150;
const EXIT_MS = 100;

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

/** Mirrors `_getDropdownStrategy()`. */
function buildDropdownStrategy(originEl: HTMLElement) {
  return createFlexibleConnectedPositionStrategy(originEl)
    .withTransformOriginOn('.mat-datepicker-content')
    .withFlexibleDimensions(false)
    .withViewportMargin(8)
    .withLockedPosition()
    .withPositions(DROPDOWN_POSITIONS);
}

/** Mirrors `_getDialogStrategy()`. */
function buildDialogStrategy() {
  return createGlobalPositionStrategy().centerHorizontally().centerVertically();
}

/** Mirrors `getConnectedOverlayOrigin()`: the owning form field's connected-overlay origin, or
 *  (no form field) the connected native element itself. */
function resolveOriginElement<D>(core: MatDatepickerCore<D>): HTMLElement | undefined {
  return (core._formFieldOrigin?.value ?? core._elementRef.value) as HTMLElement | undefined;
}

/** Mirrors `_destroyOverlay()`. */
function detachOverlay<D>(core: MatDatepickerCore<D>): void {
  core._overlayRef.value?.dispose();
  core._overlayRef.value = undefined;
  core._entering.value = false;
  core._exiting.value = false;
  core._contentEl.value = undefined;
}

/** Mirrors `close()`'s focus-restoration half: `this._focusedElementBeforeOpen!.focus()`, wired
 *  through `focusVia(..., 'program')` so the toggle's own `useFocusOrigin()` classifies it as
 *  `cdk-program-focused` regardless of what real input (a keydown for Escape, a click for a
 *  selection) triggered the close — confirmed live, see `datepicker.ts`'s FOCUS RESTORATION
 *  note. */
function restoreFocusAfterClose<D>(core: MatDatepickerCore<D>): void {
  const toggleEl = core._focusedElementBeforeOpen.value;
  core._focusedElementBeforeOpen.value = undefined;
  if (toggleEl && typeof toggleEl.focus === 'function') {
    focusVia(toggleEl, 'program');
  }
}

/** Mirrors `MatDatepickerBase.close()`. Shared by both the single-date and range handles — see
 *  this module's doc comment for why a structural intersection type is enough here (nothing
 *  below needs to know the value's shape). */
export function closeDatepickerPanel<D>(
  picker: MatDatepickerCore<D> & {touched: Signal<boolean>},
): void {
  if (!picker.isOpen.value) return;
  picker.isOpen.value = false;
  // Mirrors `datepicker.closedStream.subscribe(() => { this._onTouched(); ... })` on the
  // connected input — closing by ANY means (Escape, selecting, outside click, a Cancel/Apply
  // action button) marks the implicit control touched.
  picker.touched.value = true;

  const finish = () => {
    detachOverlay(picker);
    restoreFocusAfterClose(picker);
    picker.onOpenedChange$?.(false);
  };

  if (picker._animationsDisabled || !picker._contentEl.value) {
    finish();
  } else {
    picker._exiting.value = true;
    setTimeout(finish, EXIT_MS);
  }
}

/** Writes the formatted display string for `value` directly onto `el`'s DOM `.value` property —
 *  mirrors `MatDatepickerInputBase._formatValue()`. A direct ref write, not a reactive JSX prop,
 *  matching `qwik-material/input`'s own established "value via ref" pattern. Uses the GIVEN
 *  adapter/formats (never the hardcoded module singleton) — see `formatDateWithAdapter()`. */
function writeFormattedValueWithAdapter<D>(
  el: HTMLInputElement | undefined,
  a: DateAdapter<D>,
  f: MatDateFormats,
  value: D | null,
): void {
  if (!el) return;
  el.value = formatDateWithAdapter(a, f, value);
}

/** Writes the formatted display string using the hardcoded `DEFAULT_DATE_ADAPTER`/
 *  `MAT_NATIVE_DATE_FORMATS` singleton — kept for `setMatDatepickerValue()`'s existing contract
 *  (a form-library integration helper; see that function's own doc comment — out of scope for
 *  the pluggable-adapter task). */
function writeFormattedValue(el: HTMLInputElement | undefined, value: unknown): void {
  writeFormattedValueWithAdapter(el, adapter, formats, value as never);
}

/** Formats `value` for display with the GIVEN adapter/formats — the adapter-agnostic core
 *  `formatDateForDisplay()` (below) and every custom-adapter-aware call site in this file share. */
export function formatDateWithAdapter<D>(
  a: DateAdapter<D>,
  f: MatDateFormats,
  value: D | null,
): string {
  if (value == null || !a.isValid(value)) return '';
  return a.format(value, f.display.dateInput) as string;
}

/** Formats `value` for display using the hardcoded `en-US` `DEFAULT_DATE_ADAPTER`/
 *  `MAT_NATIVE_DATE_FORMATS` singleton — exported so `mat-datepicker-input.tsx`/the consumer's
 *  dev-app route can compute the SSR-correct INITIAL `value` snapshot (mirrors `MatInput`'s/
 *  `MatTimepickerInput`'s own `initialValue`/`formatTimeForDisplay` pattern) before any
 *  app-supplied adapter has been resolved (resolving a `QRL` factory is async — see
 *  `resolveDateAdapterForPicker()` below — but every initial render must be synchronous).
 *  Deviation: an app-supplied custom adapter's format is therefore NOT reflected in a
 *  pre-seeded `value`'s FIRST paint, only once the input is interacted with (typed into/
 *  blurred) or a calendar selection is made — see `datepicker/SYNC.md`. */
export function formatDateForDisplay<D>(value: D | null): string {
  return formatDateWithAdapter(adapter as unknown as DateAdapter<D>, formats, value);
}

/** Resolves the `DateAdapter`/`MatDateFormats` a picker handle was configured with (app-wide or
 *  per subtree — see `use-mat-datepicker.ts`'s `_dateAdapterFactory`/`_dateFormats`/`_locale`
 *  doc comments) into a live adapter instance, fresh, every call — never cache the result past
 *  the current async call (see `core/datetime/use-date-adapter.ts`'s own doc comment for why). */
async function resolveAdapterForPicker<D>(
  core: Pick<MatDatepickerCore<D>, '_dateAdapterFactory' | '_locale' | '_dateFormats'>,
): Promise<{adapter: DateAdapter<D>; formats: MatDateFormats}> {
  const a = await resolveDateAdapter(core._dateAdapterFactory, core._locale.value);
  return {adapter: a, formats: core._dateFormats};
}

/**
 * Imperatively sets `picker.value` from OUTSIDE the picker's own input/calendar handlers,
 * keeping the rendered native input's displayed text in sync — the SAME `writeFormattedValue`
 * call every INTERNAL selection path (`handleDatepickerUserSelect`/`applyDatepickerSelection`/
 * `handleDatepickerInput`) already makes, just reachable by a consumer. See
 * `use-mat-datepicker.ts`'s `UseMatDatepickerOptions.value` doc comment for why this exists (a
 * form library's `reset()`/`setInput()`, e.g. Formisch — see `qwik-material/README.md`'s "Using
 * with Formisch" — needs to put a date back into the picker after mount, which the hook's own
 * `value` OPTION can't do: a plain hook-call argument, unlike a `component$` prop, has no live
 * tracking to hook a resync into). Call from your OWN component's `useTask$`/event handler,
 * never from render (a signal write during render is the Qwik v2 pitfall this whole project's
 * SYNC.md files warn about repeatedly).
 */
export function setMatDatepickerValue<D>(picker: MatDatepickerHandle<D>, value: D | null): void {
  picker.value.value = value;
  writeFormattedValue(picker._elementRef.value as HTMLInputElement | undefined, value);
}

function buildOverlayAndDispatch<D>(
  core: MatDatepickerCore<D> & {touched: Signal<boolean>},
  ctx: QwikCdkInternals,
  originEl: HTMLElement,
  contentProps: MatDatepickerContentProps,
): void {
  const isDialog = core.touchUi.value;
  const idGen = makeIdGen(ctx);
  const registry = makeRegistry(ctx);
  const overlay = createOverlayService(registry, idGen, ctx.overlayDefaultConfig);
  const positionStrategy = isDialog ? buildDialogStrategy() : buildDropdownStrategy(originEl);

  core._entering.value = true;
  core._exiting.value = false;

  const overlayRef = overlay.create(MatDatepickerContent, contentProps, {
    positionStrategy,
    hasBackdrop: true,
    // Mirrors `_backdropHarnessClass` (`${this.id}-backdrop`) in addition to the mode-specific
    // transparency class — purely an Angular-testing-harness lookup hook upstream, carried over
    // for DOM fidelity even though nothing in this port's own test suite targets it by name.
    backdropClass: [
      isDialog ? 'cdk-overlay-dark-backdrop' : 'mat-overlay-transparent-backdrop',
      `${core.id}-backdrop`,
    ],
    scrollStrategy: isDialog ? createBlockScrollStrategy() : createRepositionScrollStrategy(),
    panelClass: `mat-datepicker-${isDialog ? 'dialog' : 'popup'}`,
    direction: ctx.direction.value,
    disableAnimations: core._animationsDisabled,
  });

  core._overlayRef.value = noSerialize(overlayRef);
  core.isOpen.value = true;

  const {keyboardDispatcher, outsideClickDispatcher} = ensureCdkDispatchers(ctx);
  // Mirrors `_getCloseStream()`'s Escape half (the Alt+Up-arrow half is not ported — no scenario
  // exercises it).
  keyboardDispatcher.add(overlayRef, {
    onKeydown(event) {
      if (!core.isOpen.value) return;
      if (event.key === 'Escape' && !hasModifierKey(event)) {
        event.preventDefault();
        closeDatepickerPanel(core);
      }
    },
  });
  // Mirrors `_getCloseStream()`'s `backdropClick()`/`detachments()` half: any pointer event
  // outside both the overlay pane AND the connected origin closes it.
  outsideClickDispatcher.add(overlayRef, {
    onOutsideClick() {
      if (!core.isOpen.value) return;
      closeDatepickerPanel(core);
    },
  });

  if (core._animationsDisabled) {
    core._entering.value = false;
  } else {
    setTimeout(
      () => {
        core._entering.value = false;
      },
      isDialog ? DIALOG_ENTER_MS : DROPDOWN_ENTER_MS,
    );
  }

  core.onOpenedChange$?.(true);
}

/** Mirrors `MatDatepickerContent._handleUserSelection()` for a SINGLE date (non-range) picker —
 *  see this module's doc comment for the pending-vs-real split. Async: formatting the written
 *  display text goes through whatever `DateAdapter`/`MatDateFormats` this picker was configured
 *  with (app-wide or per subtree — see `use-mat-datepicker.ts`), resolved via
 *  `resolveAdapterForPicker()`. `sameDate` below is pure arithmetic (never locale/format-
 *  dependent), so it can stay on the hardcoded module singleton regardless of which adapter is
 *  configured — see `datepicker/SYNC.md`. */
export async function handleDatepickerUserSelect<D>(
  picker: MatDatepickerHandle<D>,
  date: D | null,
): Promise<void> {
  const a = adapter as unknown as DateAdapter<D>;
  const hasActions = picker._actionsContent.value !== undefined;
  const activeModel = hasActions ? picker._pendingValue : picker.value;

  if (date != null && !a.sameDate(date, activeModel.value)) {
    activeModel.value = date;
    if (!hasActions) {
      picker.dirty.value = true;
      const resolved = await resolveAdapterForPicker(picker);
      writeFormattedValueWithAdapter(
        picker._elementRef.value as HTMLInputElement | undefined,
        resolved.adapter,
        resolved.formats,
        date,
      );
      picker.onValueChange$?.(date);
    }
  }

  if (activeModel.value != null && !hasActions) {
    closeDatepickerPanel(picker);
  }
}

/** Mirrors `MatDatepickerApply._applySelection()` for a single-date picker. See
 *  {@link handleDatepickerUserSelect}'s doc comment for why this is async. */
export async function applyDatepickerSelection<D>(picker: MatDatepickerHandle<D>): Promise<void> {
  const value = picker._pendingValue.value;
  picker.value.value = value;
  picker.dirty.value = true;
  const resolved = await resolveAdapterForPicker(picker);
  writeFormattedValueWithAdapter(
    picker._elementRef.value as HTMLInputElement | undefined,
    resolved.adapter,
    resolved.formats,
    value,
  );
  picker.onValueChange$?.(value);
  closeDatepickerPanel(picker);
}

/** Mirrors `MatDatepickerCancel` — discards the pending selection by simply closing (the pending
 *  clone is reseeded from `value` on the next `open()`; see this module's doc comment). */
export function cancelDatepickerSelection<D>(picker: MatDatepickerHandle<D>): void {
  closeDatepickerPanel(picker);
}

/**
 * Shared parse+commit logic for `handleDatepickerInput`/`handleDatepickerBlur` — mirrors
 * `MatDatepickerInput._onInput()`. Idempotent: calling it twice with the SAME typed text (e.g.
 * once from `input`, once from a blur that re-derives the same text — see
 * `handleDatepickerBlur`'s own doc comment for why it does) only fires `onValueChange$` once,
 * since `hasChanged` guards every write.
 *
 * Async — `parse()`/`isValid()` go through whichever `DateAdapter`/`MatDateFormats` this picker
 * was configured with (an app-supplied custom adapter's whole point, e.g. accepting
 * `dd.mm.yyyy` — see `datepicker/SYNC.md`), resolved fresh via `resolveAdapterForPicker()` — a
 * `QRL` factory, never a stored live instance, so this resolves correctly even on the FIRST
 * invocation after a real SSR→resume (the exact case this task's own functional spec
 * exercises). `sameDate` (arithmetic only) stays on the hardcoded module singleton — see
 * `handleDatepickerUserSelect`'s doc comment.
 */
async function parseAndCommitTypedDate<D>(
  picker: MatDatepickerHandle<D>,
  text: string,
): Promise<void> {
  const {adapter: a, formats: f} = await resolveAdapterForPicker(picker);
  const parsed = a.parse(text, f.parse.dateInput as never);
  const valid = !parsed || a.isValid(parsed);
  const validDate = a.getValidDateOrNull(parsed);
  const arithmetic = adapter as unknown as DateAdapter<D>;
  const hasChanged = !arithmetic.sameDate(validDate, picker.value.value);

  picker.parseError.value = !valid;

  if (hasChanged) {
    picker.value.value = validDate;
    picker.dirty.value = true;
    picker.onValueChange$?.(validDate);
  }
}

/** Mirrors `MatDatepickerInput._onInput()`. See {@link parseAndCommitTypedDate}'s doc comment. */
export async function handleDatepickerInput<D>(
  event: Event,
  picker: MatDatepickerHandle<D>,
): Promise<void> {
  await parseAndCommitTypedDate(picker, (event.target as HTMLInputElement).value);
}

/**
 * Mirrors `MatDatepickerInputBase._onBlur()` — reformats a valid value with whichever
 * `DateAdapter`/`MatDateFormats` this picker was configured with. See
 * {@link handleDatepickerInput}'s doc comment for the resume-safety rationale.
 *
 * Re-parses the NATIVE INPUT's own current text first (via the same
 * {@link parseAndCommitTypedDate} input uses), rather than trusting `picker.value.value` to
 * already reflect it. This is NOT redundant: upstream's real `_onBlur`/`_onInput` are both
 * perfectly synchronous, so a browser's `input` event's handler ALWAYS fully completes (any
 * model write included) before its subsequent `blur` event's handler can even start — no
 * handler-ordering question is possible there. Here, BOTH handlers are async (resolving the
 * SAME `DateAdapter` factory), which gives the event loop a real opportunity to run `blur`'s
 * handler to completion WHILE `input`'s own handler is still suspended on its own `await` —
 * confirmed live (reproducible 100% of the time, not a timing flake — simulating a fast,
 * essentially instantaneous type-then-blur, exactly what a real fast typist or any automated
 * driver does): without this, `_onBlur` reading a not-yet-updated `picker.value.value` would
 * see `null` and skip reformatting forever (nothing re-triggers it afterward). Re-deriving from
 * the native text makes blur self-sufficient regardless of which handler's chunk/promise
 * happens to settle first.
 */
export async function handleDatepickerBlur<D>(picker: MatDatepickerHandle<D>): Promise<void> {
  const el = picker._elementRef.value as HTMLInputElement | undefined;
  if (el) {
    await parseAndCommitTypedDate(picker, el.value);
  }
  const value = picker.value.value;
  if (value != null) {
    const resolved = await resolveAdapterForPicker(picker);
    writeFormattedValueWithAdapter(el, resolved.adapter, resolved.formats, value);
  }
  picker.touched.value = true;
}

/** Mirrors `MatDatepickerBase.open()` + `_openOverlay()` for a single-date picker. */
export function openDatepickerPanel<D>(
  picker: MatDatepickerHandle<D>,
  ctx: QwikCdkInternals,
): void {
  if (!isBrowser) return;
  if (picker.isOpen.value || picker.disabled.value) return;

  picker._focusedElementBeforeOpen.value = document.activeElement as HTMLElement | undefined;

  const originEl = resolveOriginElement(picker);
  if (!originEl) return;

  const hasActions = picker._actionsContent.value !== undefined;
  if (hasActions) {
    picker._pendingValue.value = picker.value.value;
  }
  const activeModel = hasActions ? picker._pendingValue : picker.value;

  // Mirrors `startAt` getter's fallback to `datepickerInput.getStartValue()`.
  const resolvedStartAt = picker.startAt.value ?? activeModel.value;

  const contentProps: MatDatepickerContentProps = {
    calendarId: picker.id,
    startAt: resolvedStartAt,
    startView: picker.startView.value,
    minDate: picker.min.value,
    maxDate: picker.max.value,
    dateFilter: picker.dateFilter as QRL<(date: unknown) => boolean> | undefined,
    dateClass: picker.dateClass as QRL<MatCalendarCellClassFunction<unknown>> | undefined,
    locale: picker._locale.value,
    isRange: false,
    selected: activeModel as unknown as Signal<unknown>,
    startDateAccessibleName: null,
    endDateAccessibleName: null,
    actionsContent: cloneJsxForReuse(picker._actionsContent.value),
    actionsRippleMemory: picker._actionsRippleMemory,
    touchUi: picker.touchUi.value,
    dialogLabelledBy: picker._formFieldLabelId,
    closeButtonLabel: DATEPICKER_INTL.closeCalendarLabel,
    entering: picker._entering,
    exiting: picker._exiting,
    animationsDisabled: picker._animationsDisabled,
    contentElRef: picker._contentEl,
    // Runtime-only callbacks, marked `noSerialize`: the content's `$()` handlers capture its
    // props, and Qwik's dev mode rejects captured plain functions (Code(Q3)) otherwise.
    onSelect: noSerialize((date: unknown) => handleDatepickerUserSelect(picker, date as D | null)),
    onClose: noSerialize(() => closeDatepickerPanel(picker)),
  };

  buildOverlayAndDispatch(picker, ctx, originEl, contentProps);
}

// ============================================================================================
// Range variants — see this module's doc comment; identical shape, range-specific value math.
// ============================================================================================

/** Mirrors `MatDatepickerContent._handleUserSelection()` for a date-range picker — routes through
 *  `rangeSelectionFinished` (ported from `DefaultMatCalendarRangeStrategy.selectionFinished()`).
 *  Async — see {@link handleDatepickerUserSelect}'s doc comment for why. */
export async function handleRangePickerUserSelect<D>(
  picker: MatDateRangePickerHandle<D>,
  date: D | null,
): Promise<void> {
  const a = adapter as unknown as DateAdapter<D>;
  const hasActions = picker._actionsContent.value !== undefined;
  const activeModel = hasActions ? picker._pendingValue : picker.value;

  if (date != null) {
    const next = rangeSelectionFinished(a, date, activeModel.value);
    activeModel.value = next;
    if (!hasActions) {
      picker.dirty.value = true;
      await writeRangeFormattedValues(picker, next);
      picker.onValueChange$?.(next);
    }
  }

  if (isRangeComplete(activeModel.value) && !hasActions) {
    closeDatepickerPanel(picker);
  }
}

async function writeRangeFormattedValues<D>(
  picker: MatDateRangePickerHandle<D>,
  range: DateRange<D>,
): Promise<void> {
  const resolved = await resolveAdapterForPicker(picker);
  writeFormattedValueWithAdapter(
    picker._startInputRef.value,
    resolved.adapter,
    resolved.formats,
    range.start,
  );
  writeFormattedValueWithAdapter(
    picker._endInputRef.value,
    resolved.adapter,
    resolved.formats,
    range.end,
  );
}

/** Mirrors `MatDatepickerApply._applySelection()` for a date-range picker. Async — see
 *  {@link handleDatepickerUserSelect}'s doc comment for why. */
export async function applyDateRangePickerSelection<D>(
  picker: MatDateRangePickerHandle<D>,
): Promise<void> {
  const value = picker._pendingValue.value;
  picker.value.value = value;
  picker.dirty.value = true;
  await writeRangeFormattedValues(picker, value);
  picker.onValueChange$?.(value);
  closeDatepickerPanel(picker);
}

/** Mirrors `MatDatepickerCancel` for a date-range picker — see
 *  {@link cancelDatepickerSelection}'s doc comment. */
export function cancelDateRangePickerSelection<D>(picker: MatDateRangePickerHandle<D>): void {
  closeDatepickerPanel(picker);
}

/** Mirrors `MatDatepickerBase.open()` + `_openOverlay()` for a date-range picker. */
export function openDateRangePickerPanel<D>(
  picker: MatDateRangePickerHandle<D>,
  ctx: QwikCdkInternals,
): void {
  if (!isBrowser) return;
  if (picker.isOpen.value || picker.disabled.value) return;

  picker._focusedElementBeforeOpen.value = document.activeElement as HTMLElement | undefined;

  const originEl = resolveOriginElement(picker);
  if (!originEl) return;

  const hasActions = picker._actionsContent.value !== undefined;
  if (hasActions) {
    picker._pendingValue.value = picker.value.value;
  }
  const activeModel = hasActions ? picker._pendingValue : picker.value;

  // Mirrors `getStartValue()`: the range's own start, if any.
  const resolvedStartAt = picker.startAt.value ?? activeModel.value.start ?? null;

  const contentProps: MatDatepickerContentProps = {
    calendarId: picker.id,
    startAt: resolvedStartAt,
    startView: picker.startView.value,
    minDate: picker.min.value,
    maxDate: picker.max.value,
    dateFilter: picker.dateFilter as QRL<(date: unknown) => boolean> | undefined,
    dateClass: picker.dateClass as QRL<MatCalendarCellClassFunction<unknown>> | undefined,
    locale: picker._locale.value,
    isRange: true,
    selected: activeModel as unknown as Signal<unknown>,
    startDateAccessibleName: picker._startInputRef.value?.placeholder || null,
    endDateAccessibleName: picker._endInputRef.value?.placeholder || null,
    actionsContent: cloneJsxForReuse(picker._actionsContent.value),
    actionsRippleMemory: picker._actionsRippleMemory,
    touchUi: picker.touchUi.value,
    dialogLabelledBy: picker._formFieldLabelId,
    closeButtonLabel: DATEPICKER_INTL.closeCalendarLabel,
    entering: picker._entering,
    exiting: picker._exiting,
    animationsDisabled: picker._animationsDisabled,
    contentElRef: picker._contentEl,
    // Runtime-only callbacks, marked `noSerialize`: the content's `$()` handlers capture its
    // props, and Qwik's dev mode rejects captured plain functions (Code(Q3)) otherwise.
    onSelect: noSerialize((date: unknown) => handleRangePickerUserSelect(picker, date as D | null)),
    onClose: noSerialize(() => closeDatepickerPanel(picker)),
  };

  buildOverlayAndDispatch(picker, ctx, originEl, contentProps);
}
