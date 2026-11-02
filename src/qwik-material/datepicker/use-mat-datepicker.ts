/**
 * The controller hooks behind `qwik-material/datepicker`'s popup/input/toggle/range/actions
 * public API — see `SYNC.md`'s "Public API / architecture" section before touching this file.
 * Mirrors `qwik-material/timepicker`'s own `use-mat-timepicker.ts` (read that file's doc comment
 * first; this one only calls out what's different).
 *
 * Same "cross-sibling render-order" problem timepicker's own doc comment describes: upstream's
 * DOM needs independent SIBLING elements (`<input matDatepicker>`, `<mat-datepicker-toggle>`,
 * `<mat-datepicker>`) that all need to share state, which Qwik's context (provider -> OWN
 * descendants only) can't thread between siblings. `useMatDatepicker<D>()`/
 * `useMatDateRangePicker<D>()` are called ONCE by the CONSUMER and return a plain handle object
 * — a bag of `Signal`s (never a `useStore()`, never a QRL-bearing closure object) passed as an
 * ordinary `picker` prop to every one of the render components, and read by the free functions in
 * `datepicker-runtime.ts`.
 *
 * Two hooks, not one, because the VALUE shape genuinely differs (`D | null` vs. a
 * `DateRange<D>`) and every scenario in this port's contract uses one or the other, never a value
 * that could be either at runtime — mirrors upstream's own `MatDatepicker`/`MatDateRangePicker`
 * split (two concrete subclasses of the same `MatDatepickerBase`). The two handle interfaces
 * share almost every field (see {@link MatDatepickerCore}); `datepicker-runtime.ts`'s
 * close/animation/focus-restore machinery is written once, against that shared shape, and only
 * the open/select logic (which needs to know the value shape to resolve `startAt`'s
 * fallback-to-current-value and to compare/assign dates) is duplicated per hook.
 */
import {
  useSignal,
  useTask$,
  type JSXOutput,
  type NoSerialize,
  type QRL,
  type Signal,
} from '@qwik.dev/core';
import {useIdGenerator} from '@angular-community/qwik-cdk/a11y';
import type {OverlayRef} from '@angular-community/qwik-cdk/overlay';
import {useAnimationsDisabled} from '../dialog/use-animations-disabled';
import type {CalendarView} from './calendar-math';
import type {DateRange} from './date-range-selection';

/**
 * Fields shared by {@link MatDatepickerHandle} and {@link MatDateRangePickerHandle} — everything
 * `datepicker-runtime.ts`'s close/animation/focus-restore functions need, none of it dependent on
 * whether the value is a single date or a range. Fields prefixed `_` are internal to this package
 * (read/written by `datepicker-runtime.ts` and the render components), not part of the supported
 * public surface, even though TypeScript can't enforce that across package boundaries.
 */
export interface MatDatepickerCore<D> {
  /** Stable for the lifetime of this handle — mirrors `MatDatepickerBase.id` (also echoed, raw,
   *  as the calendar's own `[id]`, the toggle's/input's `data-mat-calendar` value, and — only
   *  while open — the input's `aria-owns`). */
  id: string;
  isOpen: Signal<boolean>;
  disabled: Signal<boolean>;
  startAt: Signal<D | null>;
  startView: Signal<CalendarView>;
  touchUi: Signal<boolean>;
  min: Signal<D | null>;
  max: Signal<D | null>;
  /** Mirrors `matDatepickerFilter`/`[dateFilter]` — a QRL (functions-as-props need a QRL to
   *  survive the SSR→resume boundary), read fresh off the handle at open time (never needs to be
   *  a signal — nothing subscribes to it reactively; see `mat-month-view.tsx`'s own identical
   *  `dateFilter` prop for the same reasoning). */
  dateFilter: QRL<(date: D | null) => boolean> | undefined;
  /** Classes applied to the overlay pane (`.cdk-overlay-pane`) — mirrors `[panelClass]`. Not
   *  exercised by any scenario; kept for API completeness. */
  panelClassList: readonly string[];
  onOpenedChange$: QRL<(open: boolean) => void> | undefined;

  /** @internal Set once, read once per `open()` — see `use-animations-disabled.ts`. No scenario
   *  toggles animations mid-session, so a one-time snapshot (unlike every OTHER field here, which
   *  is a live signal) is sufficient and matches `qwik-material/select`'s own "read once" choices
   *  for similarly session-scoped values. */
  _animationsDisabled: boolean;
  /** @internal The JSX for a registered `<mat-datepicker-actions>`/`<mat-date-range-picker-
   *  actions>` row, stashed by `<MatDatepicker actions={...}>`/`<MatDateRangePicker actions=
   *  {...}>` during ITS OWN render — a `Signal`, not a plain field, so the JSX subtree (which
   *  carries real `$()` QRL event handlers) survives the SSR→resume serialization boundary the
   *  same proven way `mat-form-field.tsx`'s own `controlSnapshot`/`errorElement` signals do,
   *  rather than relying on a bare mutable-object-field write to be walked correctly (untested,
   *  riskier). `undefined` means "no actions row" — selecting a date then auto-closes/
   *  auto-commits exactly like upstream with no `_actionsPortal`. */
  _actionsContent: Signal<JSXOutput | undefined>;
  /** @internal Ripple-initialized state of the actions row's buttons, kept across opens the way
   *  upstream's re-attached actions view keeps its DOM. */
  _actionsRippleMemory: Signal<Record<number, boolean>>;
  /** @internal Ref to the connected native element (the `<input>` for a single picker, the
   *  `<mat-date-range-input>` host div for a range one) — used as the FALLBACK connected-overlay
   *  origin when there's no owning `<MatFormField>` (mirrors `getConnectedOverlayOrigin()`). */
  _elementRef: Signal<Element | undefined>;
  /** @internal The form field's connected-overlay-origin ref (from
   *  `MAT_FORM_FIELD_CONNECTED_ORIGIN`), stashed by the input/range-input component on its own
   *  render — same "plain field, read later from an event handler, never during another
   *  component's render" safety argument `qwik-material/timepicker`'s own `_formFieldOrigin`
   *  doc comment makes. */
  _formFieldOrigin: Signal<Element | undefined> | undefined;
  /** @internal The form field's own floating-label id (`MAT_FORM_FIELD_CONTROL_STATE.labelId`),
   *  stashed the SAME way as `_formFieldOrigin` — mirrors `getOverlayLabelId()`, used for the
   *  content's `role="dialog"` `aria-labelledby`. */
  _formFieldLabelId: string | undefined;
  _overlayRef: Signal<NoSerialize<OverlayRef> | undefined>;
  /** @internal The `.mat-datepicker-content` element — used to know whether there's anything to
   *  animate the exit of (mirrors checking `this._componentRef` upstream). */
  _contentEl: Signal<Element | undefined>;
  /** @internal `true` for the ~120ms (dropdown)/150ms (touch) CSS enter-animation window —
   *  mirrors the `mat-datepicker-content-animating` class during `_startOpenAnimation` (ported as
   *  a timed signal flip rather than real `animationstart`/`animationend` listeners — the
   *  durations are fixed CSS constants, not derived from any runtime config, so there is nothing
   *  for a listener-based approach to buy here that a plain timer doesn't already give; see
   *  `qwik-material/dialog`'s `mat-dialog-container.tsx` for the same established pattern). */
  _entering: Signal<boolean>;
  /** @internal `true` from `close()` until the ~100ms CSS exit-animation finishes and the overlay
   *  actually detaches — mirrors `mat-datepicker-content-exit`/`-animating` during
   *  `_startExitAnimation`. */
  _exiting: Signal<boolean>;
  /** @internal The element to restore focus to once the exit animation finishes — mirrors
   *  `_focusedElementBeforeOpen`, captured via `document.activeElement` at `open()` time. */
  _focusedElementBeforeOpen: Signal<HTMLElement | undefined>;
}

/** Options for {@link useMatDatepicker}. Mirrors the union of upstream's `MatDatepicker` +
 *  `MatDatepickerInput` inputs this port's architecture lifts onto the shared handle — see this
 *  module's doc comment. */
export interface UseMatDatepickerOptions<D> {
  /** Seed value, ALSO live-resynced on every later change (same pattern as `MatSelect`'s own
   *  `value` — see `select/mat-select.tsx`'s `useTask$` and its SYNC.md's 2026-11-02 update):
   *  needed so a consumer can imperatively put a value back into the picker from OUTSIDE after
   *  mount (a form library's `reset()`/`setInput()` — see `qwik-material/README.md`'s "Using
   *  with Formisch"). A no-op for every scenario that never reassigns this after mount (every
   *  one of this port's own `/qwik-parity/mat-datepicker/*` scenarios). */
  value?: D | null;
  /** The date to open the calendar to initially — LIVE (falls back to the current `value` at open
   *  time when omitted, mirroring `startAt`'s own upstream getter; see `datepicker-runtime.ts`). */
  startAt?: D | null;
  /** LIVE. Default `'month'`. */
  startView?: CalendarView;
  /** LIVE. Default `false`. */
  touchUi?: boolean;
  /** LIVE. */
  min?: D | null;
  /** LIVE. */
  max?: D | null;
  /** Mirrors `matDatepickerFilter`. Re-read fresh on every render (see
   *  `MatDatepickerCore.dateFilter`'s own doc comment) — pass a stable QRL. */
  dateFilter?: QRL<(date: D | null) => boolean>;
  /** Disables the input, toggle, and the picker itself (collapsing upstream's 3-way
   *  input/toggle/picker `disabled` fallback chain into one flag — no scenario in this port's
   *  contract needs them independent; see SYNC.md). LIVE. */
  disabled?: boolean;
  panelClass?: string | readonly string[];
  /** Mirrors `(selected)`/the input's own value model — fires whenever the user picks/types/
   *  clears a value, or (with an actions row) presses Apply. */
  onValueChange$?: QRL<(value: D | null) => void>;
  /** Mirrors `(opened)`/`(closed)`. */
  onOpenedChange$?: QRL<(open: boolean) => void>;
}

/** The shared, cross-component state bag for one single-date `mat-datepicker` + its connected
 *  input/toggle. See this module's doc comment for why this exists and why every consumer-visible
 *  field is a plain `Signal`. */
export interface MatDatepickerHandle<D> extends MatDatepickerCore<D> {
  /** Current committed value — `null` when empty. */
  value: Signal<D | null>;
  /** Mirrors the implicit `NgControl` (`[(ngModel)]`/`[formControl]`) a connected input has
   *  upstream once one is actually present (`typed-date-blur`'s `[formControl]` — see
   *  `datepicker-input.tsx`'s own `formBound` doc comment for why every OTHER scenario's bare
   *  `[matDatepicker]` has NO such control, hence no `ng-*` classes): `true` once the picker has
   *  closed by ANY means, or a blur happened while it was never opened. */
  touched: Signal<boolean>;
  /** `true` once the user has typed or picked a value. */
  dirty: Signal<boolean>;
  /** Set by `handleDatepickerInput`/cleared by a successful parse — mirrors the
   *  `matDatepickerParse` control error. The consumer reads this directly to decide whether to
   *  render a `<MatError>` (same "the template decides" principle `core/mat-form-control.ts`
   *  already establishes) and to compute `MatFormField`'s own `invalid` prop. */
  parseError: Signal<boolean>;

  onValueChange$: QRL<(value: D | null) => void> | undefined;

  /** @internal The value an actions row is free to discard — a clone of `value` seeded fresh on
   *  every `open()` (mirrors `_assignActions`'s `this._globalModel.clone()`), committed back onto
   *  `value` only by Apply. Selections are written here INSTEAD OF `value` for as long as
   *  `_actionsContent` is present — see `applyDatepickerSelection`/`cancelDatepickerSelection` in
   *  `datepicker-runtime.ts`. */
  _pendingValue: Signal<D | null>;
}

/** The shared, cross-component state bag for one `mat-date-range-picker` + its connected
 *  `mat-date-range-input`/toggle. See {@link MatDatepickerHandle}'s own doc comment — identical
 *  except for the value shape. */
export interface MatDateRangePickerHandle<D> extends MatDatepickerCore<D> {
  value: Signal<DateRange<D>>;
  touched: Signal<boolean>;
  dirty: Signal<boolean>;
  /** Not used by this port (no scenario types an unparseable range) — kept for structural
   *  symmetry with {@link MatDatepickerHandle}; always `false`. */
  parseError: Signal<boolean>;

  onValueChange$: QRL<(value: DateRange<D>) => void> | undefined;

  /** @internal See {@link MatDatepickerHandle._pendingValue} — same role, range-shaped. */
  _pendingValue: Signal<DateRange<D>>;
  /** @internal Refs to the two projected native elements (`input[matStartDate]`/
   *  `input[matEndDate]`) — used to read their placeholder-derived accessible names at open time
   *  (see `datepicker-runtime.ts`'s simplified stand-in for `_computeAriaAccessibleName`, documented
   *  in SYNC.md) and to write the formatted display text into each side directly. */
  _startInputRef: Signal<HTMLInputElement | undefined>;
  _endInputRef: Signal<HTMLInputElement | undefined>;
}

/** Options for {@link useMatDateRangePicker}. See {@link UseMatDatepickerOptions} — identical
 *  except for the value shape. */
export interface UseMatDateRangePickerOptions<D> {
  value?: DateRange<D>;
  startAt?: D | null;
  startView?: CalendarView;
  touchUi?: boolean;
  min?: D | null;
  max?: D | null;
  dateFilter?: QRL<(date: D | null) => boolean>;
  disabled?: boolean;
  panelClass?: string | readonly string[];
  onValueChange$?: QRL<(value: DateRange<D>) => void>;
  onOpenedChange$?: QRL<(open: boolean) => void>;
}

function toClassList(value: string | readonly string[] | undefined): readonly string[] {
  if (value == null) return [];
  if (typeof value === 'string') return [value];
  return value;
}

/** The common signal set + guarded live re-sync shared by both hooks below — see this module's
 *  doc comment for why the live re-sync (rather than a one-time seed) matters for every field
 *  except `value`/`panelClass`. */
function useDatepickerCoreSignals<D>(options: {
  startAt?: D | null;
  startView?: CalendarView;
  touchUi?: boolean;
  min?: D | null;
  max?: D | null;
  disabled?: boolean;
  panelClass?: string | readonly string[];
  idPrefix: string;
}): MatDatepickerCore<D> {
  const idGen = useIdGenerator();
  const id = useSignal(() => idGen.getId(options.idPrefix)).value;
  const animationsDisabled = useAnimationsDisabled().value;

  const isOpen = useSignal(false);
  const disabled = useSignal(options.disabled ?? false);
  const startAt = useSignal<D | null>(() => options.startAt ?? null);
  const startView = useSignal<CalendarView>(() => options.startView ?? 'month');
  const touchUi = useSignal(options.touchUi ?? false);
  const min = useSignal<D | null>(options.min ?? null);
  const max = useSignal<D | null>(options.max ?? null);

  const elementRef = useSignal<Element>();
  const overlayRef = useSignal<NoSerialize<OverlayRef>>();
  const contentEl = useSignal<Element>();
  const entering = useSignal(false);
  const exiting = useSignal(false);
  const focusedBeforeOpen = useSignal<HTMLElement>();

  const nextDisabled = options.disabled ?? false;
  if (disabled.value !== nextDisabled) disabled.value = nextDisabled;
  const nextStartAt = options.startAt ?? null;
  if (startAt.value !== nextStartAt) startAt.value = nextStartAt;
  const nextStartView = options.startView ?? 'month';
  if (startView.value !== nextStartView) startView.value = nextStartView;
  const nextTouchUi = options.touchUi ?? false;
  if (touchUi.value !== nextTouchUi) touchUi.value = nextTouchUi;
  const nextMin = options.min ?? null;
  if (min.value !== nextMin) min.value = nextMin;
  const nextMax = options.max ?? null;
  if (max.value !== nextMax) max.value = nextMax;

  return {
    id,
    isOpen,
    disabled,
    startAt,
    startView,
    touchUi,
    min,
    max,
    dateFilter: undefined, // overwritten by each hook below
    panelClassList: toClassList(options.panelClass),
    onOpenedChange$: undefined, // overwritten by each hook below
    _animationsDisabled: animationsDisabled,
    _actionsContent: useSignal<JSXOutput | undefined>(undefined),
    _actionsRippleMemory: useSignal<Record<number, boolean>>({}),
    _elementRef: elementRef,
    _formFieldOrigin: undefined,
    _formFieldLabelId: undefined,
    _overlayRef: overlayRef,
    _contentEl: contentEl,
    _entering: entering,
    _exiting: exiting,
    _focusedElementBeforeOpen: focusedBeforeOpen,
  };
}

/**
 * Creates (or, on a re-render, re-syncs) the shared state for one single-date datepicker. See
 * this module's doc comment for the full architecture rationale and `SYNC.md` for the usage
 * example mirroring upstream's `<input [matDatepicker]>` + `<mat-datepicker-toggle>` +
 * `<mat-datepicker>`.
 */
export function useMatDatepicker<D>(
  options: UseMatDatepickerOptions<D> = {},
): MatDatepickerHandle<D> {
  const core = useDatepickerCoreSignals<D>({...options, idPrefix: 'mat-datepicker-'});
  const value = useSignal<D | null>(() => options.value ?? null);
  const pendingValue = useSignal<D | null>(() => options.value ?? null);
  const touched = useSignal(false);
  const dirty = useSignal(false);
  const parseError = useSignal(false);

  // Live-resync from an external, post-mount reassignment of `options.value` — see this
  // interface field's own doc comment above. `track()` subscribes to the actual signal behind
  // this option regardless of how many component boundaries it crosses (same mechanism, same
  // proof, as `MatSelect`'s identical fix).
  useTask$(({track}) => {
    value.value = track(() => options.value) ?? null;
  });

  return {
    ...core,
    dateFilter: options.dateFilter,
    onOpenedChange$: options.onOpenedChange$,
    value,
    touched,
    dirty,
    parseError,
    onValueChange$: options.onValueChange$,
    _pendingValue: pendingValue,
  };
}

/**
 * Creates (or, on a re-render, re-syncs) the shared state for one date-range datepicker. See
 * {@link useMatDatepicker} — identical except for the value shape.
 */
export function useMatDateRangePicker<D>(
  options: UseMatDateRangePickerOptions<D> = {},
): MatDateRangePickerHandle<D> {
  const core = useDatepickerCoreSignals<D>({...options, idPrefix: 'mat-datepicker-'});
  const seed = (): DateRange<D> => options.value ?? {start: null, end: null};
  const value = useSignal<DateRange<D>>(seed);
  const pendingValue = useSignal<DateRange<D>>(seed);
  const touched = useSignal(false);
  const dirty = useSignal(false);
  const parseError = useSignal(false);
  const startInputRef = useSignal<HTMLInputElement>();
  const endInputRef = useSignal<HTMLInputElement>();

  return {
    ...core,
    dateFilter: options.dateFilter,
    onOpenedChange$: options.onOpenedChange$,
    value,
    touched,
    dirty,
    parseError,
    onValueChange$: options.onValueChange$,
    _pendingValue: pendingValue,
    _startInputRef: startInputRef,
    _endInputRef: endInputRef,
  };
}
