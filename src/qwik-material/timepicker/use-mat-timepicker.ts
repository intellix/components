/**
 * The controller hook behind `qwik-material/timepicker`'s public API — see
 * `SYNC.md`'s "Public API / architecture" section before touching this
 * file; summary of WHY it exists:
 *
 * Upstream's DOM contract needs THREE independent, sibling elements inside
 * one `<mat-form-field>`: the `<input matInput [matTimepicker]="picker">`,
 * the `<mat-timepicker-toggle [for]="picker">`, and the (empty, marker-only)
 * `<mat-timepicker #picker>` host — cross-referenced via a template
 * variable. `MatSelect` (the closest ported analogue) doesn't have this
 * problem because its ENTIRE DOM is one component. Qwik's context only
 * flows from a provider to ITS OWN descendants, never sideways between
 * siblings that merely share a common ancestor (`<MatFormField control=…
 * iconSuffix=…>` renders both as independent descendants of itself, not of
 * each other) — so state that all three need can't be threaded through
 * context the way `MAT_FORM_FIELD_CONTROL_STATE` connects `MatFormField` to
 * ITS OWN descendant control.
 *
 * `useMatTimepicker<D>()` is called ONCE by the CONSUMER (the route/page
 * component, which is a genuine common ancestor in scope, not in the Qwik
 * component-tree sense) and returns a plain `MatTimepickerHandle<D>` — a
 * bag of `Signal`s (never a `useStore()`, never a QRL-bearing closure
 * object) passed as an ordinary `picker` prop to `<MatTimepickerInput
 * picker={picker}>`, `<MatTimepickerToggle picker={picker}>`, and read by
 * the free functions in `timepicker-runtime.ts`. Reading `someSignal.value`
 * off an object passed down as a plain prop is reactive in Qwik regardless
 * of how many prop layers deep the SIGNAL OBJECT itself travels — this is
 * NOT the "nested JSX descriptor frozen after first render" trap
 * `core/mat-form-field-control.ts`'s doc comment describes (that trap is
 * about re-rendering a DIFFERENT JSX ELEMENT nested inside another
 * component's prop; a `Signal` is a stable, serializable object whose
 * `.value` is designed to be read reactively from anywhere it's threaded).
 *
 * `disabled`/`min`/`max`/`interval`/`options` are accepted here, not as
 * separate props on `<MatTimepickerInput>` — see SYNC.md's "why disabled/
 * min/max/interval/options live on the hook, not the input" for the full
 * "cross-sibling render-order" reasoning this avoids. They are LIVE: this
 * hook runs inside the CONSUMER's own `component$` body (never nested
 * inside another component's prop), so every one of its own re-renders
 * re-evaluates the arguments fresh — the guarded writes below keep the
 * returned signals in sync on every call, the same "guarded write during
 * render" pattern `mat-form-field.tsx` already uses for its own context
 * store.
 */
import {useContext, useSignal, type NoSerialize, type QRL, type Signal} from '@qwik.dev/core';
import {useIdGenerator} from '@angular-community/qwik-cdk/a11y';
import type {ListKeyManager, ListKeyManagerOption} from '@angular-community/qwik-cdk/a11y';
import type {OverlayRef} from '@angular-community/qwik-cdk/overlay';
import type {DateAdapter} from '../core/datetime/date-adapter';
import type {MatDateFormats} from '../core/datetime/date-formats';
import {useDateAdapterFactory, useDateFormats, useDateLocale} from '../core/datetime/use-date-adapter';
import {parseInterval, type MatTimepickerOption} from './timepicker-util';
import {MAT_TIMEPICKER_CONFIG, type MatTimepickerConfig} from './timepicker-config';

/** A generated option, as actually rendered in a given open session — adds the stable `id`
 *  minted for that session (see `timepicker-runtime.ts`'s `openTimepickerPanel`). */
export interface MatTimepickerRenderOption<D> extends MatTimepickerOption<D> {
  id: string;
}

/** `ListKeyManager` item shape for a timepicker's option list — no option is ever individually
 *  disabled (matches upstream: `MatTimepickerOption` has no `disabled` field). */
export interface TimepickerKeyItem<D> extends ListKeyManagerOption {
  option: MatTimepickerRenderOption<D>;
}

/** Options for {@link useMatTimepicker}. Mirrors the union of upstream's `MatTimepicker` +
 *  `MatTimepickerInput` inputs that this port's architecture lifts onto the shared handle — see
 *  this module's doc comment. */
export interface UseMatTimepickerOptions<D> {
  /** Seed value. Read ONCE (mirrors `MatSelect`'s own `value` — see that component's doc
   *  comment for why a value nested inside another component's prop can't be re-read live). */
  value?: D | null;
  /** Interval between options — seconds, or a string with a unit (`'2h'`, `'30m'`, `'90s'`).
   *  Falls back to `MAT_TIMEPICKER_CONFIG.interval`, then upstream's own default of 30 minutes.
   *  Mutually exclusive with `options`. LIVE. */
  interval?: number | string | null;
  /** Explicit list of options, as an alternative to `interval`. Mutually exclusive with
   *  `interval`. LIVE (by reference — pass a stable array to avoid regenerating ids every
   *  render; see `timepicker-runtime.ts`). */
  options?: readonly MatTimepickerOption<D>[] | null;
  /** Minimum selectable/parseable time. LIVE. */
  min?: D | null;
  /** Maximum selectable/parseable time. LIVE. */
  max?: D | null;
  /** Disables the input and the toggle. LIVE. */
  disabled?: boolean;
  /** Whether ripples inside the panel/toggle are disabled. Falls back to
   *  `MAT_TIMEPICKER_CONFIG.disableRipple`, then `false`. LIVE. */
  disableRipple?: boolean;
  /** Classes applied to the panel (`.mat-timepicker-panel`). LIVE. */
  panelClass?: string | readonly string[];
  /** Mirrors `[aria-label]` on `<mat-timepicker>`. LIVE. */
  ariaLabel?: string;
  /** Mirrors `[aria-labelledby]` on `<mat-timepicker>`. LIVE. */
  ariaLabelledby?: string;
  /** Mirrors `(selected)`/the input's own value model — fires whenever the user selects/types/
   *  clears a value. */
  onValueChange$?: QRL<(value: D | null) => void>;
  /** Mirrors `(opened)`/`(closed)`. */
  onOpenedChange$?: QRL<(open: boolean) => void>;
}

/**
 * The shared, cross-component state bag for one `mat-timepicker` + its connected input/toggle.
 * See this module's doc comment for why this exists and why every consumer-visible field is a
 * plain `Signal`. Fields prefixed `_` are internal to `qwik-material/timepicker` (read/written
 * by `timepicker-runtime.ts` and the three render components) and not part of the supported
 * public surface, even though TypeScript can't enforce that across package boundaries.
 */
export interface MatTimepickerHandle<D> {
  /** Stable for the lifetime of this handle — mirrors `MatTimepicker.panelId` (also echoed, raw,
   *  as the `mat-timepicker-panel-id` attribute and the input's `mat-timepicker-id` attribute). */
  panelId: string;
  isOpen: Signal<boolean>;
  disabled: Signal<boolean>;
  /** Mirrors the implicit `NgControl` (`[(ngModel)]`/`[formControl]`) every connected input has
   *  upstream: `true` once the panel has closed by ANY means (mirrors `timepicker.closed.
   *  subscribe(() => this._onTouched?.())`), or once a blur happens while the panel was never
   *  opened. Drives `MatFormField`'s own `ng-touched`/`ng-untouched` host class — see
   *  `mat-timepicker-input.tsx`'s doc comment for why the consumer must ALSO pass this as a
   *  top-level `<MatFormField touched={picker.touched.value}>` prop for it to update live. */
  touched: Signal<boolean>;
  /** Mirrors the same implicit control's dirty flag — `true` once the user has typed or
   *  selected a value (mirrors the CVA `onChange` firing, which upstream's `NgControl`
   *  interprets as "dirty"). */
  dirty: Signal<boolean>;
  /** Current value — `null` when empty. Owned here; see the module doc comment. */
  value: Signal<D | null>;
  min: Signal<D | null>;
  max: Signal<D | null>;
  /** Parsed interval in seconds, or `null` when `options` should be used instead. */
  interval: Signal<number | null>;
  customOptions: Signal<readonly MatTimepickerOption<D>[] | null>;
  disableRipple: Signal<boolean>;
  panelClassList: Signal<readonly string[]>;
  ariaLabel: Signal<string | undefined>;
  ariaLabelledby: Signal<string | undefined>;
  /** Set once `handleTimepickerInput`/`handleTimepickerBlur` have run — mirrors
   *  `matTimepickerParse`/`Min`/`Max` control errors. The consumer reads these directly to
   *  decide whether to render a `<MatError>` (same "the template decides" principle
   *  `core/mat-form-control.ts` already establishes) and to compute `MatFormField`'s own
   *  `invalid` prop. */
  parseError: Signal<boolean>;
  minError: Signal<boolean>;
  maxError: Signal<boolean>;

  onValueChange$: QRL<(value: D | null) => void> | undefined;
  onOpenedChange$: QRL<(open: boolean) => void> | undefined;

  /** @internal Ref to the connected `<input>` — created here so `MatTimepickerInput` can use
   *  this signal directly as its `ref`, with no separate local signal needed. */
  _inputRef: Signal<HTMLInputElement | undefined>;
  /** @internal The form field's connected-overlay-origin ref (from
   *  `MAT_FORM_FIELD_CONNECTED_ORIGIN`), stashed by `MatTimepickerInput` on its own render.
   *  Plain field, not a signal — see this module's doc comment: only ever READ from inside a
   *  later event handler, never during another component's render, so there is no
   *  render-order hazard in assigning it here. */
  _formFieldOrigin: Signal<Element | undefined> | undefined;
  /** @internal The form field's own floating-label id (`MAT_FORM_FIELD_CONTROL_STATE.labelId`),
   *  stashed the SAME way as `_formFieldOrigin` — mirrors `MatTimepickerInput.getLabelId()`,
   *  used by `openTimepickerPanel` to fall back the panel's `aria-labelledby` the same way
   *  upstream's `_getAriaLabelledby()` does. */
  _formFieldLabelId: string | undefined;
  _activeIndex: Signal<number>;
  _renderOptions: Signal<readonly MatTimepickerRenderOption<D>[]>;
  _optionsCacheKey: Signal<string | null>;
  _cachedTimeOptions: Signal<readonly MatTimepickerOption<D>[]>;
  _overlayRef: Signal<NoSerialize<OverlayRef> | undefined>;
  _keyManager: Signal<NoSerialize<ListKeyManager<TimepickerKeyItem<D>>> | undefined>;
  _panelEl: Signal<Element | undefined>;
  _exiting: Signal<boolean>;
  /** @internal The last value that was both present and valid — mirrors
   *  `MatTimepickerInput._lastValidDate`, used to restore a previously-valid DATE while only
   *  replacing its time-of-day (see `assignUserSelection` in `timepicker-runtime.ts`). */
  _lastValidValue: Signal<D | null>;

  /** @internal The `DateAdapter` factory resolved once, at hook-creation time, from
   *  `MAT_DATE_ADAPTER_FACTORY` context — see `use-mat-datepicker.ts`'s identical field for the
   *  full rationale (a QRL, never a live instance). */
  _dateAdapterFactory: QRL<(locale: string) => DateAdapter<D>>;
  /** @internal The `MatDateFormats` bag resolved once from `MAT_DATE_FORMATS` context. */
  _dateFormats: MatDateFormats;
  /** @internal The locale resolved from `MAT_DATE_LOCALE` context. */
  _locale: Signal<string>;
}

function toClassList(value: string | readonly string[] | undefined): readonly string[] {
  if (value == null) return [];
  if (typeof value === 'string') return [value];
  return value;
}

/**
 * Creates (or, on a re-render, re-syncs) the shared state for one timepicker. See this module's
 * doc comment for the full architecture rationale and usage shape:
 *
 * ```tsx
 * const picker = useMatTimepicker<Date>({value: value.value, onValueChange$: v => (value.value = v)});
 *
 * <MatFormField
 *   label={<MatLabel>Pick a time</MatLabel>}
 *   control={<MatTimepickerInput picker={picker} />}
 *   iconSuffix={<MatTimepickerToggle picker={picker} />}
 * />
 * ```
 */
export function useMatTimepicker<D>(
  options: UseMatTimepickerOptions<D> = {},
): MatTimepickerHandle<D> {
  const config = useContext(MAT_TIMEPICKER_CONFIG, {} as MatTimepickerConfig);
  const idGen = useIdGenerator();
  const panelId = useSignal(() => idGen.getId('mat-timepicker-panel-')).value;
  // Resolved ONCE here, render-legal — see `MatTimepickerHandle`'s own `_dateAdapterFactory`/
  // `_dateFormats`/`_locale` doc comments and `use-mat-datepicker.ts`'s identical pattern.
  const dateAdapterFactory = useDateAdapterFactory() as QRL<(locale: string) => DateAdapter<D>>;
  const dateFormats = useDateFormats();
  const locale = useDateLocale();

  const isOpen = useSignal(false);
  const disabled = useSignal(options.disabled ?? false);
  const touched = useSignal(false);
  const dirty = useSignal(false);
  const value = useSignal<D | null>(() => options.value ?? null);
  const min = useSignal<D | null>(options.min ?? null);
  const max = useSignal<D | null>(options.max ?? null);
  const interval = useSignal<number | null>(() =>
    parseInterval(options.interval ?? config.interval ?? null),
  );
  const customOptions = useSignal<readonly MatTimepickerOption<D>[] | null>(
    options.options ?? null,
  );
  const disableRipple = useSignal(options.disableRipple ?? config.disableRipple ?? false);
  const panelClassList = useSignal<readonly string[]>(() => toClassList(options.panelClass));
  const ariaLabel = useSignal<string | undefined>(options.ariaLabel);
  const ariaLabelledby = useSignal<string | undefined>(options.ariaLabelledby);
  const parseError = useSignal(false);
  const minError = useSignal(false);
  const maxError = useSignal(false);

  const inputRef = useSignal<HTMLInputElement>();
  const activeIndex = useSignal(-1);
  const renderOptions = useSignal<readonly MatTimepickerRenderOption<D>[]>([]);
  const optionsCacheKey = useSignal<string | null>(null);
  const cachedTimeOptions = useSignal<readonly MatTimepickerOption<D>[]>([]);
  const overlayRef = useSignal<NoSerialize<OverlayRef>>();
  const keyManager = useSignal<NoSerialize<ListKeyManager<TimepickerKeyItem<D>>>>();
  const panelEl = useSignal<Element>();
  const exiting = useSignal(false);
  const lastValidValue = useSignal<D | null>(() => options.value ?? null);

  // ── Guarded live re-sync, every time the CONSUMER re-renders (this hook runs inside their
  // own render body — see the module doc comment for why that makes re-syncing here safe and
  // sufficient, unlike re-reading a value nested inside another component's prop). ──
  const nextDisabled = options.disabled ?? false;
  if (disabled.value !== nextDisabled) disabled.value = nextDisabled;
  const nextMin = options.min ?? null;
  if (min.value !== nextMin) min.value = nextMin;
  const nextMax = options.max ?? null;
  if (max.value !== nextMax) max.value = nextMax;
  const nextInterval = parseInterval(options.interval ?? config.interval ?? null);
  if (interval.value !== nextInterval) interval.value = nextInterval;
  const nextOptions = options.options ?? null;
  if (customOptions.value !== nextOptions) customOptions.value = nextOptions;
  const nextDisableRipple = options.disableRipple ?? config.disableRipple ?? false;
  if (disableRipple.value !== nextDisableRipple) disableRipple.value = nextDisableRipple;
  if (ariaLabel.value !== options.ariaLabel) ariaLabel.value = options.ariaLabel;
  if (ariaLabelledby.value !== options.ariaLabelledby)
    ariaLabelledby.value = options.ariaLabelledby;

  return {
    panelId,
    isOpen,
    disabled,
    touched,
    dirty,
    value,
    min,
    max,
    interval,
    customOptions,
    disableRipple,
    panelClassList,
    ariaLabel,
    ariaLabelledby,
    parseError,
    minError,
    maxError,
    onValueChange$: options.onValueChange$,
    onOpenedChange$: options.onOpenedChange$,
    _inputRef: inputRef,
    _formFieldOrigin: undefined,
    _formFieldLabelId: undefined,
    _activeIndex: activeIndex,
    _renderOptions: renderOptions,
    _optionsCacheKey: optionsCacheKey,
    _cachedTimeOptions: cachedTimeOptions,
    _overlayRef: overlayRef,
    _keyManager: keyManager,
    _panelEl: panelEl,
    _exiting: exiting,
    _lastValidValue: lastValidValue,
    _dateAdapterFactory: dateAdapterFactory,
    _dateFormats: dateFormats,
    _locale: locale,
  };
}
