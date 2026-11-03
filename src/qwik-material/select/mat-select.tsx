import {
  $,
  component$,
  useContext,
  useSignal,
  useTask$,
  type JSXOutput,
  type NoSerialize,
  type QRL,
} from '@qwik.dev/core';
import {QWIK_CDK} from '@angular-community/qwik-cdk';
import type {OverlayRef, ScrollStrategyDescriptor} from '@angular-community/qwik-cdk/overlay';
import {
  useIdGenerator,
  type ListKeyManager,
  type LiveAnnouncer,
} from '@angular-community/qwik-cdk/a11y';
import {useAnimationsDisabled} from '../dialog/use-animations-disabled';
import {
  type MatFormFieldControlProps,
  useOptionalFormFieldConnectedOrigin,
  useOptionalFormFieldControlState,
} from '../core/mat-form-field-control';
import {MAT_SELECT_CONFIG, MAT_SELECT_SCROLL_STRATEGY, type MatSelectConfig} from './select-config';
import {resolveSelectOptions, type MatSelectEntryDef} from './select-option-resolver';
import {
  handleSelectKeydown,
  openSelectPanel,
  type KeyManagerItem,
  type SelectRuntimeConfig,
  type SelectRuntimeSignals,
} from './select-runtime';
import {useMatFormSubmitted} from '../core/mat-form';

const MAT_SELECT_CONFIG_DEFAULTS: MatSelectConfig = {};

/**
 * Props for `<MatSelect>`. Mirrors upstream `MatSelect`
 * (`src/material/select/select.ts`), minus a few upstream knobs this port
 * intentionally doesn't carry — see `select/SYNC.md`'s deviations list
 * (`compareWith` — always strict `===`; `sortComparator` — always panel
 * order; `disableOptionCentering`/`canSelectNullableOptions` accepted via
 * `MAT_SELECT_CONFIG` only for API parity, unused).
 *
 * ## The `options` prop — this port's "SSR-correct option-definition shape"
 *
 * `options` is a PLAIN-DATA array of {@link MatSelectOptionDef}/
 * {@link MatSelectGroupDef} — NOT `<MatOption>`/`<MatOptgroup>` JSX
 * elements. `MatSelect` resolves it via {@link resolveSelectOptions} and
 * renders the actual `<MatOptgroup>`/`<MatOption>` elements itself (inside
 * the lazily-created `MatSelectPanel`) with every computed prop
 * (selected/active/multiple/...) filled in — `MatOption`/`MatOptgroup`
 * (`qwik-material/core`) are reusable RENDERER components, not something a
 * consumer of `<MatSelect>` writes directly.
 *
 * This is NOT merely the usual "Qwik can't read a `<Slot>`'s projected
 * children during SSR" constraint (which a JSX-descriptor-array prop, read
 * via `.props` without rendering, already solves elsewhere in this
 * project — see `core/mat-form-field-control.ts`'s `readControlProps` /
 * `qwik-material/grid-list/jsx-children.ts`). An EARLIER version of this
 * file tried exactly that (`options: JSXOutput[]`) and hit a DIFFERENT,
 * sharper problem: `MatSelect` needs its resolved option data again INSIDE
 * its own lazily-resumed `$()` handlers (`onTriggerClick$`/
 * `onHostKeyDown$`), not just once at render time. Confirmed live, with an
 * isolated repro: a JSX descriptor's `.type` is a reference to a
 * `component$()`-wrapped function (`MatOption`) — safe for Qwik to
 * serialize when the descriptor is an ACTUAL VNODE being rendered/diffed,
 * but NOT when it's sitting inertly inside plain prop data merely
 * introspected by a different component. `props.options` (or anything
 * memoizing a value derived from it) read from inside a `$()` handler
 * resumed after the SSR→client boundary consistently deserialized to
 * empty/undefined — even for a scenario (`preselected-value`) whose
 * INITIAL render demonstrably used it correctly (the trigger showed
 * "Banana" from the very first paint). Plain data with no embedded
 * component-function references — exactly `qwik-material/tabs`'
 * `MatTabGroup.tabs: MatTabDef[]` shape, already proven to survive this
 * exact path including its OWN `$()` handlers — does not have this
 * problem. See `select-option-resolver.ts`'s doc comment and
 * `select/SYNC.md` for the full write-up.
 *
 * Plain data fixed THAT problem, but resolving it is still not something to
 * do as a bare, unmemoized call in the render body — see the `resolved`
 * `useSignal(() => ...)` below for a second, unrelated hazard this port hit
 * (an infinite reactive loop via the shared id-generator counter) and why
 * resolution must be memoized.
 *
 * ```tsx
 * <MatFormField
 *   label={<MatLabel>Fruit</MatLabel>}
 *   control={
 *     <MatSelect
 *       value={value.value}
 *       onValueChange$={(v) => (value.value = v)}
 *       options={[
 *         {value: 'apple', label: 'Apple'},
 *         {value: 'banana', label: 'Banana'},
 *         {value: 'cherry', label: 'Cherry', disabled: true},
 *       ]}
 *     />
 *   }
 * />
 * ```
 *
 * ## Why `value` is NOT a live, reactive prop (read this before touching selection)
 *
 * `MatSelect` is routinely passed as `<MatFormField control={<MatSelect
 * value={...} .../>}>` — nested inside ANOTHER component's prop, exactly
 * the shape `form-field/SYNC.md`'s "real Qwik reactivity limitation" write-up
 * documents as frozen-after-first-render (same family of issue `MatInput`'s
 * own `value` hit — see that file's SYNC.md). So `props.value` is read
 * EXACTLY ONCE, to seed an internal signal (mirrors `MatInput` tracking its
 * live state from its own DOM ref instead of `props.value`, except
 * `MatSelect` has no native control to read from — it owns the selection
 * state itself instead, exactly matching upstream's OWN actual data flow
 * for every scenario in this parity suite: nothing ever externally
 * reassigns `[(value)]`/a bound `FormControl`'s value from OUTSIDE the
 * select after mount — every scenario's only value changes come from the
 * select's own interactions, which already flow correctly through
 * `onValueChange$` back out to the consumer). A consumer that DOES need to
 * imperatively reset the value from outside after mount is not supported
 * by this port yet — see SYNC.md.
 */
export interface MatSelectProps<T = unknown> extends Omit<MatFormFieldControlProps, 'value'> {
  /** Plain-data option/group definitions — see the module doc comment. */
  options: ReadonlyArray<MatSelectEntryDef>;
  /** Current value. A single value, or an array when `multiple`. Read ONCE
   *  — see the module doc comment's "why value is not a live prop". */
  value?: T | ReadonlyArray<T>;
  /** Two-way-binding half of `[(value)]`/`valueChange`. */
  onValueChange$?: QRL<(value: T | T[]) => void>;
  /** Mirrors `MatSelect._onTouched()` — called whenever an open panel
   *  closes, by ANY means (matches upstream's unconditional call). Wire to
   *  `useMatFormControl()`'s `markAsTouched$` for forms integration. */
  onTouched$?: QRL<() => void>;
  /** Mirrors `(openedChange)`. */
  onOpenedChange$?: QRL<(open: boolean) => void>;
  /** Mirrors `[multiple]`. Cannot be changed dynamically — matches upstream's
   *  own `getMatSelectDynamicMultipleError()` guard (not enforced here, but
   *  no scenario relies on dynamic toggling either). */
  multiple?: boolean;
  /** Mirrors `[typeaheadDebounceInterval]`. Falls back to
   *  `MAT_SELECT_CONFIG.typeaheadDebounceInterval`, then upstream's own
   *  `ListKeyManager`/`Typeahead` default of 200ms. */
  typeaheadDebounceInterval?: number;
  placeholder?: string;
  /** Mirrors `[panelWidth]`. Falls back to `MAT_SELECT_CONFIG.panelWidth`,
   *  then `'auto'` (measures the trigger/form field). */
  panelWidth?: string | number | null;
  /** Mirrors `[hideSingleSelectionIndicator]`. Falls back to
   *  `MAT_SELECT_CONFIG.hideSingleSelectionIndicator`, then `false`. */
  hideSingleSelectionIndicator?: boolean;
  /** Mirrors `[panelClass]` — merged onto the LISTBOX div
   *  (`.mat-mdc-select-panel`), not the overlay pane. Supports the same
   *  shapes as `ngClass` minus `Set`/record-of-booleans (no scenario needs
   *  either — see SYNC.md). */
  panelClass?: string | ReadonlyArray<string>;
  /** Mirrors `[aria-label]`. */
  'aria-label'?: string;
  /** Mirrors `[aria-labelledby]`. */
  'aria-labelledby'?: string;
  /** Content for `<mat-select-trigger>` — see select.ts's header note: a
   *  bare structural DIRECTIVE upstream (`@Directive({selector:
   *  'mat-select-trigger'})`), not a component, so there's no template of
   *  its own to port — but a directive, unlike a component, does NOT
   *  replace or unwrap its host element; the literal `<mat-select-trigger>`
   *  tag itself stays in the rendered DOM (upstream's `select.html`:
   *  `<ng-content select="mat-select-trigger">` — `<ng-content>` projects
   *  the consumer's element as-is, tag included, same as any other
   *  `<ng-content>` projection). Confirmed live: a real diff
   *  (`span[0]: child count 1 != 2`, i.e. exactly ONE child — the
   *  `<mat-select-trigger>` wrapper itself — not the trigger's own inner
   *  spans unwrapped into the parent). This port therefore wraps
   *  `customTrigger` in a literal `<mat-select-trigger>` itself (see
   *  render body below) rather than asking every consumer to write that
   *  wrapper tag by hand — accepting plain content here, not a
   *  `<MatSelectTrigger>` JSX element, is still the right call (design-doc
   *  rule 4's "no extra wrapper COMPONENT" — a plain pass-through host
   *  element, like `<mat-pseudo-checkbox>`, is not the same thing). */
  customTrigger?: JSXOutput;
  tabIndex?: number;
  class?: string | ReadonlyArray<string>;
  style?: string | Record<string, string | number>;
}

function triggerAriaLabelledby(
  ariaLabel: string | undefined,
  ariaLabelledby: string | undefined,
  formFieldLabelId: string | undefined,
  valueId: string,
): string | undefined {
  if (ariaLabel) return undefined;
  let value = formFieldLabelId || '';
  if (ariaLabelledby) value += ' ' + ariaLabelledby;
  if (!value) value = valueId;
  return value;
}

function panelAriaLabelledby(
  ariaLabel: string | undefined,
  ariaLabelledby: string | undefined,
  formFieldLabelId: string | undefined,
): string | null {
  if (ariaLabel) return null;
  const labelId = formFieldLabelId || null;
  const labelExpression = labelId ? labelId + ' ' : '';
  return ariaLabelledby ? labelExpression + ariaLabelledby : labelId;
}

export const MatSelect = component$<MatSelectProps>(props => {
  const config = useContext(MAT_SELECT_CONFIG, MAT_SELECT_CONFIG_DEFAULTS);
  // `MAT_SELECT_SCROLL_STRATEGY` is a plain, serializable
  // `ScrollStrategyDescriptor` (string/object, or a `QRL` escape hatch) —
  // NOT a function factory, so neither of `useContext()`'s two
  // function-typed-default pitfalls apply here. `{type: 'reposition'}` is
  // this port's pre-existing, previously hard-coded default behaviour.
  const scrollStrategyDescriptor = useContext(
    MAT_SELECT_SCROLL_STRATEGY,
    {type: 'reposition'} as ScrollStrategyDescriptor,
  );
  const ctx = useContext(QWIK_CDK);
  const animationsDisabled = useAnimationsDisabled();
  const idGen = useIdGenerator();
  const formField = useOptionalFormFieldControlState();
  const formFieldOrigin = useOptionalFormFieldConnectedOrigin();
  const isInFormField = formField !== undefined;

  const multiple = props.multiple ?? false;
  const disabled = props.disabled ?? false;
  const formBound = props.formBound ?? false;
  const required = props.required ?? false;

  const hostRef = useSignal<HTMLElement>();
  const triggerRef = useSignal<HTMLElement>();

  const selectId = useSignal(() => props.id ?? idGen.getId('mat-select-'));
  const valueId = useSignal(() => idGen.getId('mat-select-value-'));
  const id = props.id ?? selectId.value;
  const panelId = `${id}-panel`;

  // Internal selection state — see the module doc comment's "why value is
  // not a live prop" for why this is seeded (not read live as a plain JSX
  // expression) rather than `value.value` tracking `props.value` directly.
  const value = useSignal<unknown>(() =>
    multiple ? (Array.isArray(props.value) ? [...(props.value as unknown[])] : []) : props.value,
  );
  // Re-syncs from an EXTERNAL, post-mount reassignment of `props.value` — e.g. a form library's
  // `reset()`/`setInput()` (see `qwik-material/README.md`'s "Using with Formisch"), which needs
  // to imperatively put a value back into the select from OUTSIDE after mount, the one case the
  // module doc comment's "why value is not a live prop" explicitly flagged as "not supported by
  // this port yet". Safe and correct regardless of nesting depth (`<MatFormField control={
  // <MatSelect value={x}/>}>`, same as every scenario here): unlike `MatFormField`'s own
  // *static* `readControlProps()` introspection of a control's props (a ONE-TIME plain property
  // read, by design — see `core/mat-form-field-control.ts`'s big doc comment), a `useTask$`'s
  // `track(() => props.value)` subscribes to the ACTUAL signal behind this prop and correctly
  // re-fires on every later change no matter how many component boundaries it crosses — already
  // proven by `MatInput`'s own identical `value`-sync `useTask$` (`input/mat-input.tsx`), nested
  // inside `<MatFormField control={...}>` the exact same way, and exercised live by the
  // `error-state` scenario's typed input. A no-op for every PRE-EXISTING scenario here (none
  // ever reassigns `value` from outside after mount, so this only ever re-confirms the same
  // value the selection's own `onValueChange$` round-trip already produced).
  useTask$(({track}) => {
    const next = track(() => props.value);
    value.value = multiple ? (Array.isArray(next) ? [...(next as unknown[])] : []) : next;
  });

  const panelOpen = useSignal(false);
  const activeIndex = useSignal(-1);
  // See `SelectRuntimeSignals.activeOptionHidden`'s own doc comment.
  const activeOptionHidden = useSignal(false);
  const exiting = useSignal(false);
  const overlayRef = useSignal<NoSerialize<OverlayRef>>();
  const stickyOrigin = useSignal<NoSerialize<Element>>();
  const keyManager = useSignal<NoSerialize<ListKeyManager<KeyManagerItem>>>();
  const panelEl = useSignal<Element>();
  const liveAnnouncer = useSignal<NoSerialize<LiveAnnouncer>>();
  const focused = useSignal(false);

  // `options` is plain data (no embedded component-function references) —
  // see the module doc comment for why that matters — but resolving it is
  // NOT safe to do as a plain, unmemoized local on every render, unlike
  // every other derived local in this file: `resolveSelectOptions()` calls
  // `idGen.getId(...)` once per option/group lacking an explicit `id`
  // (every scenario here), and `useIdGenerator()`'s `getId` both READS and
  // WRITES the shared, context-provided `ID_GENERATOR_COUNTER` signal
  // (`core/mat-form-field-control.ts`... no — see `qwik-cdk/a11y/
  // id-generator.ts`'s own doc comment). Calling it inline in the render
  // body subscribes `MatSelect` to that counter (by reading it) AND
  // notifies every subscriber of it (by incrementing it) on every single
  // render — including `MatSelect` ITSELF, which re-renders in response,
  // calls `resolveSelectOptions` again, increments the counter again,
  // forever: a self-perpetuating reactive loop pegging the main thread at
  // 100% CPU, starting the moment any OTHER mount-time signal write (e.g.
  // form-field's own 300ms `animations-enabled` timer) triggers this
  // component's first post-SSR re-render. Confirmed live via a CDP
  // debugger pause (minified prod stack: `vt → Rt → (anon) → E → (anon) →
  // Rt → vt → …`, Qwik's scheduler re-entering itself) and via render-count
  // instrumentation (`MatSelect` re-rendering 40+ times within the same
  // millisecond, every guarded `formField.*` write already a no-op — the
  // trigger was never the form-field ping-pong, it was this). This is
  // exactly the hazard `mat-form-field.tsx`'s own "ids must be memoized"
  // comment warns about, just reached through a helper function instead of
  // a bare `idGen.getId(...)` call. Fixed the same way: memoized via
  // `useSignal(() => ...)`, run exactly once per component instance — ids
  // don't need to be live-reactive to `props.options` (no scenario ever
  // changes the option list after mount; mirrors `value`'s own "seeded
  // once" treatment above).
  const resolved = useSignal(() => resolveSelectOptions(props.options, idGen));
  const {flat, tree} = resolved.value;

  const touched = isInFormField ? formField.touched : (props.touched ?? false);
  const dirty = isInFormField ? formField.dirty : (props.dirty ?? false);
  const invalid = isInFormField ? formField.invalid : (props.invalid ?? false);
  // Default ErrorStateMatcher: `invalid && (touched || form.submitted)` — see core/mat-form.tsx.
  const formSubmitted = useMatFormSubmitted();
  const errorState = formBound && invalid && (touched || formSubmitted);

  const empty = multiple
    ? !(Array.isArray(value.value) && (value.value as unknown[]).length)
    : value.value == null || value.value === '';

  // Mirrors `shouldLabelFloat` getter: `panelOpen || !empty || (focused && !!placeholder)`.
  const shouldLabelFloat = panelOpen.value || !empty || (focused.value && !!props.placeholder);

  // Live state into the shared context store — same established mechanism
  // `mat-input.tsx` uses (guarded writes avoid redundant notifications).
  if (formField) {
    if (formField.empty !== empty) formField.empty = empty;
    if (formField.shouldLabelFloat !== shouldLabelFloat)
      formField.shouldLabelFloat = shouldLabelFloat;
    if (formField.focused !== focused.value) formField.focused = focused.value;
  }

  const ariaDescribedBy = formField ? formField.assignedDescribedBy : props['aria-describedby'];
  const formFieldLabelId = formField?.labelId;

  const triggerValue = (() => {
    if (empty) return '';
    if (multiple) {
      const vals = Array.isArray(value.value) ? (value.value as unknown[]) : [];
      return vals
        .map(v => flat.find(o => o.value === v)?.label ?? '')
        .filter(Boolean)
        .join(', ');
    }
    return flat.find(o => o.value === value.value)?.label ?? '';
  })();

  const panelClassList = (
    Array.isArray(props.panelClass) ? props.panelClass : props.panelClass ? [props.panelClass] : []
  ) as string[];

  const overlayPanelClass = config.overlayPanelClass;

  // Mirrors `[class.mat-primary]="_parentFormField?.color === 'primary'"`
  // etc. — `undefined` (⇒ `mat-undefined`) when there's no form field.
  const color = formField?.color;

  // NOTE: `hostRef`/`triggerRef`/`formFieldOrigin` are threaded through as
  // the SIGNALS themselves (never `.value` dereferenced here) — dereferencing
  // now, during THIS render, would bake in `undefined` forever into every
  // handler closure below (refs populate client-side, after this render
  // body has already returned, and a ref write does NOT itself trigger a
  // re-render — same class of trap `useFocusOrigin()`'s doc comment and
  // every `useOn()`-based hook in this project reads `event.target`/a ref
  // signal LIVE, at invocation time, to avoid). `select-runtime.ts`'s
  // functions read `.value` themselves, at the moment they actually run
  // (inside an event handler, well after mount). Callback props
  // (`onValueChange$`/`onTouched$`/`onOpenedChange$`) are threaded through
  // as the QRLs themselves (never wrapped in a new plain closure) for the
  // same reason `select-runtime.ts`'s module doc comment explains: a QRL
  // value is safe to capture/call from anywhere, a plain function wrapping
  // one is not guaranteed to survive the same `$()` extraction.
  const cfg: SelectRuntimeConfig = {
    multiple,
    disabled,
    typeaheadDebounceInterval:
      props.typeaheadDebounceInterval ?? config.typeaheadDebounceInterval ?? 200,
    isRtl: ctx.direction.value === 'rtl',
    animationsDisabled: animationsDisabled.value,
    panelId,
    panelClass: panelClassList,
    overlayPanelClass,
    color,
    ariaLabel: props['aria-label'],
    panelAriaLabelledby: panelAriaLabelledby(
      props['aria-label'],
      props['aria-labelledby'],
      formFieldLabelId,
    ),
    hideSingleSelectionIndicator:
      props.hideSingleSelectionIndicator ?? config.hideSingleSelectionIndicator ?? false,
    panelWidth: props.panelWidth ?? config.panelWidth ?? 'auto',
    canSelectNullableOptions: config.canSelectNullableOptions ?? false,
    onValueChange$: props.onValueChange$,
    onTouched$: props.onTouched$,
    onOpenedChange$: props.onOpenedChange$,
    scrollStrategyDescriptor,
  };

  // `ctx` is passed to `select-runtime.ts`'s functions as its OWN top-level
  // argument (never nested inside `cfg`/`signals`) — see
  // `SelectRuntimeSignals`'s own doc comment for the crash this avoids.
  const signals: SelectRuntimeSignals = {
    panelOpen,
    activeIndex,
    activeOptionHidden,
    exiting,
    overlayRef,
    stickyOrigin,
    value,
    keyManager,
    panelEl,
    liveAnnouncer,
    hostRef,
    triggerRef,
    formFieldOriginRef: formFieldOrigin,
  };

  const onTriggerClick$ = $(() => {
    if (disabled) return;
    openSelectPanel(flat, tree, ctx, cfg, signals);
  });

  const onHostKeyDown$ = $((event: KeyboardEvent) => {
    handleSelectKeydown(event, flat, tree, ctx, cfg, signals);
  });

  const onHostFocus$ = $(() => {
    if (!disabled) {
      focused.value = true;
    }
  });

  const onHostBlur$ = $(() => {
    // Qwik v2 regression guard, `focused` only — NOT `onTouched$`/`cancelTypeahead` below (a
    // blur that bounces right back is still a REAL blur for "touched" purposes, matching
    // upstream; `cancelTypeahead` is idempotent either way). A REAL click on an option
    // genuinely blurs the host first (mousedown on a non-focusable `<mat-option>` — ordinary
    // browser behavior, matches upstream), then `selectOption()` (select-runtime.ts)
    // immediately re-focuses it via `hostRef.value?.focus()`, synchronously, in the SAME click
    // handler. Both this blur handler and that focus call are separate `$()` QRLs; under Qwik
    // v2, their FIRST-ever invocation can resolve out of order while their chunks load
    // (confirmed live: a fine-grained Playwright poll showed `mat-focused` present immediately
    // after a `multiple` select's first option toggle, then removed ~20ms later, with
    // `document.activeElement` never actually leaving the host the whole time — a SECOND click
    // on the same select, chunks now warm, never showed the glitch). By the time this
    // handler's CODE actually runs, the DOM's real focus state may have already moved on past
    // the stale event that queued it — checking it directly (not trusting "a blur event fired,
    // so we must be blurred") avoids clobbering a focus state that's already correct.
    if ((hostRef.value?.ownerDocument.activeElement ?? null) !== hostRef.value) focused.value = false;
    keyManager.value?.cancelTypeahead();
    if (!disabled && !panelOpen.value) {
      props.onTouched$?.();
    }
  });

  const ariaActiveDescendant =
    panelOpen.value && activeIndex.value >= 0 ? flat[activeIndex.value]?.id : undefined;

  const hostClasses = [
    'mat-mdc-select',
    disabled && 'mat-mdc-select-disabled',
    errorState && 'mat-mdc-select-invalid',
    required && 'mat-mdc-select-required',
    empty && 'mat-mdc-select-empty',
    multiple && 'mat-mdc-select-multiple',
    panelOpen.value && 'mat-select-open',
    // Mirrors `NgControlStatus` — applies automatically to ANY element with
    // a `[formControl]`/`[ngModel]`/`[formControlName]` binding, including
    // `<mat-select>` itself (same mechanism `mat-input.tsx`'s own classes
    // mirror; see angular-parity.spec.ts's big comment).
    formBound && (touched ? 'ng-touched' : 'ng-untouched'),
    formBound && (dirty ? 'ng-dirty' : 'ng-pristine'),
    formBound && (invalid ? 'ng-invalid' : 'ng-valid'),
    props.class,
  ].filter(Boolean) as string[];

  return (
    <mat-select
      ref={hostRef}
      role="combobox"
      aria-haspopup="listbox"
      id={id}
      class={hostClasses}
      style={props.style}
      tabIndex={disabled ? -1 : (props.tabIndex ?? 0)}
      aria-controls={panelOpen.value ? panelId : undefined}
      aria-expanded={panelOpen.value ? 'true' : 'false'}
      aria-label={props['aria-label'] || undefined}
      aria-labelledby={triggerAriaLabelledby(
        props['aria-label'],
        props['aria-labelledby'],
        formFieldLabelId,
        valueId.value,
      )}
      aria-required={required ? 'true' : 'false'}
      aria-disabled={disabled ? 'true' : 'false'}
      aria-invalid={errorState ? 'true' : 'false'}
      aria-activedescendant={ariaActiveDescendant}
      aria-describedby={ariaDescribedBy}
      // Mirrors `hideSingleSelectionIndicator` written as a BARE, static HTML attribute directly
      // on a consumer's `<mat-select>` (e.g. `paginator.html`'s page-size select) — unlike a
      // genuine `[hideSingleSelectionIndicator]="expr"` property binding (which, upstream, would
      // only set the `@Input`, never touch the DOM attribute), Angular leaves a literal, static
      // template attribute in the rendered DOM verbatim. This port has no way to distinguish
      // "bound statically" from "bound dynamically" (both resolve to the same
      // `cfg.hideSingleSelectionIndicator` boolean), so it echoes the attribute whenever that
      // resolved value is true — a reasonable approximation, since every current consumer of a
      // true value (`mat-paginator`) writes it as the bare static form upstream too. See
      // `qwik-material/paginator/SYNC.md`.
      {...{hidesingleselectionindicator: cfg.hideSingleSelectionIndicator ? '' : undefined}}
      onKeyDown$={onHostKeyDown$}
      onFocus$={onHostFocus$}
      onBlur$={onHostBlur$}
    >
      <div
        ref={triggerRef}
        {...{'cdk-overlay-origin': ''}}
        class="mat-mdc-select-trigger"
        onClick$={onTriggerClick$}
      >
        <div class="mat-mdc-select-value" id={valueId.value}>
          {empty ? (
            <span class="mat-mdc-select-placeholder mat-mdc-select-min-line">
              {props.placeholder}
            </span>
          ) : (
            <span class="mat-mdc-select-value-text">
              {props.customTrigger ? (
                <mat-select-trigger>{props.customTrigger}</mat-select-trigger>
              ) : (
                <span class="mat-mdc-select-min-line">{triggerValue}</span>
              )}
            </span>
          )}
        </div>

        <div class="mat-mdc-select-arrow-wrapper">
          <div class="mat-mdc-select-arrow">
            <svg
              viewBox="0 0 24 24"
              width="24px"
              height="24px"
              focusable="false"
              aria-hidden="true"
            >
              <path d="M7 10l5 5 5-5z" />
            </svg>
          </div>
        </div>
      </div>
    </mat-select>
  );
});
