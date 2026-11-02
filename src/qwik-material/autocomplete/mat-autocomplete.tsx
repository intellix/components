import {
  $,
  component$,
  noSerialize,
  useContext,
  useSignal,
  useTask$,
  type NoSerialize,
  type QRL,
  type Signal,
} from '@qwik.dev/core';
import {isBrowser} from '@qwik.dev/core/build';
import {QWIK_CDK} from '@angular-community/qwik-cdk';
import type {OverlayRef} from '@angular-community/qwik-cdk/overlay';
import {
  createIdGenerator,
  useIdGenerator,
  type ListKeyManager,
} from '@angular-community/qwik-cdk/a11y';
import {useAnimationsDisabled} from '../dialog/use-animations-disabled';
import {
  type MatFormFieldControlProps,
  useOptionalFormFieldConnectedOrigin,
  useOptionalFormFieldControlState,
} from '../core/mat-form-field-control';
import {composeRef, type HostRef} from '../core/host-props';
import {MAT_AUTOCOMPLETE_CONFIG, type MatAutocompleteConfig} from './autocomplete-config';
import {
  resolveAutocompleteOptions,
  type MatAutocompleteEntryDef,
  type ResolvedAutocompleteNode,
} from './autocomplete-option-resolver';
import {
  handleAutocompleteClick,
  handleAutocompleteFocus,
  handleAutocompleteInput,
  handleAutocompleteKeydown,
  syncAutocompleteOptions,
  type AutocompleteRuntimeConfig,
  type AutocompleteRuntimeSignals,
  type KeyManagerItem,
} from './autocomplete-runtime';
import {useMatFormSubmitted} from '../core/mat-form';

const MAT_AUTOCOMPLETE_CONFIG_DEFAULTS: MatAutocompleteConfig = {};

/**
 * Module-level, NON-reactive id generator for `mat-option-N`/
 * `mat-optgroup-label-N` ids minted while resolving `options` — see
 * `autocomplete-option-resolver.ts`'s doc comment for why this must NOT be
 * the shared, context-provided, REACTIVE `useIdGenerator()` counter (reading
 * +writing that counter from inside a component's own tracked render body is
 * the exact "id-generator infinite loop" hazard `mat-select.tsx`'s doc
 * comment documents). Same "simplified singleton" pattern `core/mat-
 * option.tsx`'s own `fallbackIdGen` already establishes — module-scoped, so
 * ids stay unique DOCUMENT-WIDE even across multiple `<MatAutocomplete>`
 * instances on the same page (the property that actually matters for valid
 * HTML; the exact digits don't — see that file's comment).
 */
const autocompleteOptionIdGen = createIdGenerator();

function ensureIdCache(
  idCache: Signal<NoSerialize<Map<string, string>> | undefined>,
): Map<string, string> {
  if (!idCache.value) {
    idCache.value = noSerialize(new Map());
  }
  return idCache.value as Map<string, string>;
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

/**
 * Props for `<MatAutocomplete>`. Mirrors upstream's `matInput` + `mat-
 * autocomplete` + `matAutocomplete` trigger directive COMBINED into one
 * component — see the module doc comment below the interface for why this
 * port doesn't split "the native input" from "the autocomplete behavior"
 * into two separate pieces the way upstream's two independent Angular
 * directives can.
 *
 * Extends {@link MatFormFieldControlProps} (same contract `MatInput`
 * implements) so `<MatFormField control={<MatAutocomplete .../>}>` can
 * introspect it at SSR time — see that interface's own doc comment.
 *
 * ## Why `MatAutocomplete` renders BOTH the `<input>` and the empty
 * `<mat-autocomplete>` placeholder itself, as one component
 *
 * Upstream genuinely layers TWO independent Angular directives onto the
 * SAME native `<input>` element — `matInput` (`MatInput`, providing
 * `MatFormFieldControl`) and `matAutocomplete` (`MatAutocompleteTrigger`,
 * the combobox behavior) — with a THIRD, separate component
 * (`<mat-autocomplete>`) declared as a plain sibling. `qwik-material/form-
 * field`'s `<MatFormField>` has no `<Slot>`-based children mechanism at all
 * (confirmed by reading `mat-form-field.tsx`: its `.mat-mdc-form-field-
 * infix` div renders exactly `{labelContent}{controlSnapshot.value}` —
 * the control's OWN rendered output and nothing else) — there is nowhere
 * for a THIRD sibling element to be declared independently inside the
 * infix the way Angular's template can. Since `MatAutocomplete`'s render
 * output is read directly as `control`'s JSX descriptor (`readControlProps`
 * — see `core/mat-form-field-control.ts`), and a `component$` is free to
 * return a `<>Fragment</>` of SEVERAL top-level siblings, THIS component
 * renders `<>{<input .../>}{<mat-autocomplete /></>}</>` itself — the
 * empty placeholder lands as the infix's LAST child, directly after the
 * input, exactly matching the contract (`src/dev-app/qwik-parity/
 * autocomplete.ts`'s own "EMPTY HOST" header note). This does NOT violate
 * design-doc rule 4 ("no extra wrapper elements") — nothing is WRAPPED;
 * both elements are genuine, independent DOM siblings, exactly as upstream
 * renders them.
 *
 * ```tsx
 * <MatFormField
 *   label={<MatLabel>Fruit</MatLabel>}
 *   control={
 *     <MatAutocomplete
 *       value={value.value}
 *       onValueChange$={(v) => (value.value = v as string)}
 *       options={filteredFruits}
 *       onInput$={(_, el) => (filteredFruits.value = filterFruits(el.value))}
 *       onFocus$={(_, el) => (filteredFruits.value = filterFruits(el.value))}
 *     />
 *   }
 * />
 * ```
 *
 * `onInput$`/`onFocus$` are the SAME "fire with the raw native element"
 * contract `MatInput` already establishes — the CONSUMER owns filtering
 * entirely (mirrors `src/dev-app/qwik-parity/autocomplete.ts`'s own
 * FILTERING header note: every scenario keeps its own `options`/
 * `filtered…` array and a plain `filter…(val)` method, wired from the raw
 * element, never an internal concern of this component). `options` is
 * therefore a DELIBERATELY reactive plain-data prop — see
 * `autocomplete-option-resolver.ts`'s doc comment for the full "why plain
 * data, and why it's safe to re-resolve on every render" write-up.
 *
 * ## Why `onValueChange$` doesn't fire on every keystroke when
 * `requireSelection` is set
 *
 * Mirrors upstream `_handleInput`'s own guard EXACTLY (`if (!requireSelection)
 * this._onChange(value)`) — see `src/dev-app/qwik-parity/autocomplete.ts`'s
 * CRITICAL GOTCHA note for why this is load-bearing, not incidental: with
 * `requireSelection`, the "model" value stays frozen (at whatever the last
 * real selection/reset committed) while the user types, and only a genuine
 * selection or the reset-on-invalid-close path calls `onValueChange$` at
 * all. Every scenario here wires its OWN filtering through `onInput$`/
 * `onFocus$` (never `onValueChange$`), so this distinction only affects a
 * consumer-rendered "Value: …" display — exactly what `require-selection`'s
 * own `<p>Value: …}` paragraph exercises.
 */
export interface MatAutocompleteProps extends Omit<MatFormFieldControlProps, 'value'> {
  /**
   * Plain-data option/group definitions — see the module doc comment.
   * DELIBERATELY reactive (unlike `qwik-material/select`'s `options`) —
   * the consumer writes a freshly-filtered array into this SIGNAL on every
   * keystroke.
   *
   * **Must be the `Signal` itself** (`options={filteredFruits}`), never
   * `.value` (`options={filteredFruits.value}`) — a hard requirement this
   * port's `select`/`chips`/`form-field` ports didn't have, because none
   * of them need `MatFormField`'s `control` prop to carry genuinely LIVE
   * data. `MatFormField` reads its own `control` prop EXACTLY ONCE
   * (`controlSnapshot = useSignal(() => props.control)` in
   * `mat-form-field.tsx` — confirmed by its own doc comment: freezing the
   * REFERENCE, not just the nested prop values, is a deliberate fix for a
   * real Qwik 1.20 core crash) — so a plain array value nested inside
   * `<MatFormField control={<MatAutocomplete options={...} />}>` is
   * captured once, at first render, and NEVER updates again, no matter how
   * many times the consumer's own route re-renders with a fresh filtered
   * array. A `Signal` sidesteps this the same way `select-runtime.ts`'s
   * `value`/`activeIndex` signals already do for `MatSelectPanel`: the
   * SIGNAL OBJECT reference is what gets frozen into the snapshot, but
   * that object is still the exact same live, mutable signal the consumer
   * keeps writing to — reading `.value` off it (in render, in the
   * `useTask$` below, and in every `$()` handler) always sees the CURRENT
   * value, unaffected by the outer props snapshot being stale. See
   * `autocomplete-option-resolver.ts`'s doc comment for the complementary
   * "why re-resolving on every read is safe" half of this design.
   */
  options: Signal<ReadonlyArray<MatAutocompleteEntryDef>>;
  /** Current value. Read ONCE to seed internal state — mirrors
   *  `qwik-material/select`'s own "`value` is not a live reactive prop"
   *  deviation (see that package's SYNC.md): nothing in this port's
   *  scenarios ever reassigns the model value from OUTSIDE after mount:
   *  every change already flows back out through `onValueChange$`. */
  value?: unknown;
  /** Two-way-binding half of `[(ngModel)]`/the CVA's `_onChange`. */
  onValueChange$?: QRL<(value: unknown) => void>;
  /** Mirrors `_onTouched()` (the autocomplete's own CVA touched callback —
   *  fires unconditionally on native `blur`, regardless of panel state). */
  onTouched$?: QRL<() => void>;
  /** Mirrors `(opened)`/`(closed)`, collapsed into one boolean callback. */
  onOpenedChange$?: QRL<(open: boolean) => void>;
  /** Fires on the native `input` event with the live element — the
   *  CONSUMER's own filtering hook. Mirrors `MatInput.onInput$`. */
  onInput$?: QRL<(event: Event, el: HTMLInputElement) => void>;
  onFocus$?: QRL<(event: FocusEvent, el: HTMLInputElement) => void>;
  onBlur$?: QRL<(event: FocusEvent, el: HTMLInputElement) => void>;
  /** Mirrors `[autoActiveFirstOption]`. Falls back to
   *  `MAT_AUTOCOMPLETE_CONFIG.autoActiveFirstOption`, then `false`. */
  autoActiveFirstOption?: boolean;
  /** Mirrors `[requireSelection]`. Falls back to
   *  `MAT_AUTOCOMPLETE_CONFIG.requireSelection`, then `false`. */
  requireSelection?: boolean;
  /** Mirrors `[displayWith]`. */
  displayWith$?: QRL<(value: unknown) => string>;
  /** Mirrors `[panelWidth]`. No `MAT_AUTOCOMPLETE_CONFIG` fallback — matches
   *  upstream, which has no global default for this either (only ever a
   *  per-instance `@Input`). Falls back to measuring the connected element. */
  panelWidth?: string | number | null;
  /** Mirrors `[hideSingleSelectionIndicator]`. Falls back to
   *  `MAT_AUTOCOMPLETE_CONFIG.hideSingleSelectionIndicator`, then `false`. */
  hideSingleSelectionIndicator?: boolean;
  /** Mirrors `<mat-autocomplete [class]>` — merged onto the LISTBOX div
   *  (`.mat-mdc-autocomplete-panel`), not the overlay pane. */
  panelClass?: string | ReadonlyArray<string>;
  /** Mirrors `<mat-autocomplete aria-label>`. */
  'aria-label'?: string;
  /** Mirrors `<mat-autocomplete aria-labelledby>`. */
  'aria-labelledby'?: string;
  /**
   * Plain `aria-label` on the rendered `<input>` ITSELF — unrelated to `aria-label` above
   * (which targets the separate `<mat-autocomplete>` panel's own `@Input aria-label`, per
   * upstream's `autocomplete.ts`). `MatAutocompleteTrigger` is a directive with no `aria-label`
   * input of its own, so a consumer's `<input matInput [matAutocomplete]="auto" aria-label="…">`
   * is just a plain native attribute Angular passes through untouched — same category as
   * `placeholder`/`name`/`type` below. See `autocomplete-simple`'s docs example.
   */
  inputAriaLabel?: string;
  type?: string;
  name?: string;
  maxLength?: number;
  tabIndex?: number;
  class?: string | ReadonlyArray<string>;
  style?: string | Record<string, string | number>;
  /** An external ref, composed with this component's own internal `inputRef` — see
   *  `MatInputProps.ref`'s doc comment (`input/mat-input.tsx`) for the rationale (a form
   *  library's field-registration ref, e.g. Formisch's `field.props.ref`). */
  ref?: HostRef<HTMLInputElement>;
}

export const MatAutocomplete = component$<MatAutocompleteProps>(props => {
  const config = useContext(MAT_AUTOCOMPLETE_CONFIG, MAT_AUTOCOMPLETE_CONFIG_DEFAULTS);
  const ctx = useContext(QWIK_CDK);
  const animationsDisabled = useAnimationsDisabled();
  const idGen = useIdGenerator();
  const formField = useOptionalFormFieldControlState();
  const formFieldOrigin = useOptionalFormFieldConnectedOrigin();
  const isInFormField = formField !== undefined;

  const disabled = props.disabled ?? false;
  const required = props.required ?? false;
  const readOnly = props.readOnly ?? false;
  const formBound = props.formBound ?? false;

  const inputRef = useSignal<HTMLElement>();

  // Fallback id for standalone usage — mirrors `MatInput`'s own
  // `useIdGenerator()` fallback (`_uid`). Memoized once — see
  // `mat-form-field.tsx`'s "ids must be memoized" comment.
  const autoId = useSignal(() => idGen.getId('mat-input-'));
  const id = formField ? formField.assignedId : (props.id ?? autoId.value);
  const ariaDescribedBy = formField ? formField.assignedDescribedBy : props['aria-describedby'];
  const formFieldLabelId = formField?.labelId;

  // The panel's own id (`mat-autocomplete-N`, used directly — NO "-panel"
  // suffix, see autocomplete.ts's IDS note) — memoized once, independent of
  // the control's own `id` above.
  const panelId = useSignal(() => idGen.getId('mat-autocomplete-'));

  const touched = isInFormField ? formField.touched : (props.touched ?? false);
  const dirty = isInFormField ? formField.dirty : (props.dirty ?? false);
  const invalid = isInFormField ? formField.invalid : (props.invalid ?? false);
  // Default ErrorStateMatcher: `invalid && (touched || form.submitted)` — see core/mat-form.tsx.
  const formSubmitted = useMatFormSubmitted();
  const errorState = formBound && invalid && (touched || formSubmitted);
  const emptySignal = useSignal(() => !props.value);

  // Runtime state — see `autocomplete-runtime.ts`'s own doc comments.
  const overlayAttached = useSignal(false);
  const activeIndex = useSignal(-1);
  const selectedValue = useSignal<unknown>(() => props.value);
  const overlayRef = useSignal<NoSerialize<OverlayRef>>();
  const keyManager = useSignal<NoSerialize<ListKeyManager<KeyManagerItem>>>();
  const treeSignal = useSignal<readonly ResolvedAutocompleteNode[]>(() => []);
  const panelEl = useSignal<Element>();
  const valueOnAttach = useSignal('');
  const idCache = useSignal<NoSerialize<Map<string, string>>>();

  const signals: AutocompleteRuntimeSignals = {
    overlayAttached,
    activeIndex,
    selectedValue,
    overlayRef,
    keyManager,
    treeSignal,
    panelEl,
    valueOnAttach,
    inputRef,
    formFieldOriginRef: formFieldOrigin,
    formField,
    emptySignal,
  };

  const cfg: AutocompleteRuntimeConfig = {
    disabled,
    readOnly,
    autoActiveFirstOption: props.autoActiveFirstOption ?? config.autoActiveFirstOption ?? false,
    requireSelection: props.requireSelection ?? config.requireSelection ?? false,
    hideSingleSelectionIndicator:
      props.hideSingleSelectionIndicator ?? config.hideSingleSelectionIndicator ?? false,
    panelId: panelId.value,
    panelClass: (Array.isArray(props.panelClass)
      ? props.panelClass
      : props.panelClass
        ? [props.panelClass]
        : []) as string[],
    overlayPanelClass: config.overlayPanelClass,
    hasBackdrop: config.hasBackdrop ?? false,
    backdropClass: config.backdropClass,
    color: formField?.color,
    ariaLabel: props['aria-label'],
    panelAriaLabelledby: panelAriaLabelledby(
      props['aria-label'],
      props['aria-labelledby'],
      formFieldLabelId,
    ),
    panelWidth: props.panelWidth ?? undefined,
    animationsDisabled: animationsDisabled.value,
    isRtl: ctx.direction.value === 'rtl',
    displayWith$: props.displayWith$,
    onValueChange$: props.onValueChange$,
    onTouched$: props.onTouched$,
    onOpenedChange$: props.onOpenedChange$,
  };

  // Reactively re-syncs the ALREADY-OPEN panel whenever `props.options`
  // changes — see `autocomplete-runtime.ts`'s `syncAutocompleteOptions` doc
  // comment. A no-op (both at SSR and at every render where the overlay
  // isn't attached) via that function's own early return.
  useTask$(({track}) => {
    const options = track(() => props.options.value);
    if (!isBrowser) return;
    const cache = ensureIdCache(idCache);
    const {flat, tree} = resolveAutocompleteOptions(options, cache, autocompleteOptionIdGen);
    syncAutocompleteOptions(flat, tree, cfg, signals);
  });

  // Resolved fresh every render — needed for `aria-activedescendant` (the
  // active option's OWN id) and for deriving `panelOpen` below. Cheap and
  // id-stable across refilters — see `autocomplete-option-resolver.ts`'s
  // doc comment.
  const {flat} = resolveAutocompleteOptions(
    props.options.value,
    ensureIdCache(idCache),
    autocompleteOptionIdGen,
  );
  // Mirrors `MatAutocompleteTrigger.panelOpen` getter: `_overlayAttached &&
  // autocomplete.showPanel` — ALWAYS derived, never a separate stored flag,
  // so it can never drift from the current (possibly just-refiltered-to-
  // empty) option count.
  const panelOpen = overlayAttached.value && flat.length > 0;
  const activeOptionId =
    panelOpen && activeIndex.value >= 0 ? flat[activeIndex.value]?.id : undefined;

  // Mirrors `_floatLabel()`/`_resetLabel()` — forces the form field's label
  // to stay floated for as long as the overlay is ATTACHED (not merely
  // "visibly showing options" — matches upstream's own `_overlayAttached`-
  // driven timing, independent of `showPanel`). See
  // `MatFormFieldControlState.floatOverride`'s own doc comment. Driven
  // directly off `overlayAttached` (not a separate copy) so it can never
  // drift; guarded so the write is a no-op once settled (same pattern as
  // every other context-store write in this file/`mat-input.tsx`).
  if (formField && formField.floatOverride !== overlayAttached.value) {
    formField.floatOverride = overlayAttached.value;
  }

  const handleFocus$ = $((event: FocusEvent) => {
    if (disabled) return;
    if (formField) {
      formField.focused = true;
      formField.shouldLabelFloat = true;
    }
    const cache = ensureIdCache(idCache);
    const {flat: liveFlat, tree: liveTree} = resolveAutocompleteOptions(
      props.options.value,
      cache,
      autocompleteOptionIdGen,
    );
    handleAutocompleteFocus(liveFlat, liveTree, ctx, cfg, signals);
    props.onFocus$?.(event, inputRef.value as HTMLInputElement);
  });

  const handleBlur$ = $((event: FocusEvent) => {
    const el = inputRef.value as HTMLInputElement | undefined;
    const liveEmpty = !el?.value;
    emptySignal.value = liveEmpty;
    if (formField) {
      // Qwik v2 regression guard, `focused` only — see `mat-select.tsx`'s matching
      // `onHostBlur$` comment for the full root-cause writeup (same race, same fix):
      // `selectAutocompleteOption`'s own doc comment already documents the REAL browser blur a
      // mousedown-on-a-non-focusable-option causes, followed by an explicit synchronous
      // re-focus; under Qwik v2 the two `$()` QRLs involved (this handler and that `.focus()`
      // call's own resulting focus handler) can resolve out of order on their first-ever
      // invocation, so by the time this handler's code actually runs, the input may already be
      // focused again — checking the live DOM state directly avoids clobbering it with a stale
      // event's effects. Deliberately NOT applied to `onTouched$`/`empty`/`shouldLabelFloat`
      // below: a blur that bounces right back is still a REAL blur for "touched" purposes
      // (matches upstream — confirmed live, Angular shows `ng-touched` even when this exact
      // click-then-immediately-refocus happens), and `empty`/`shouldLabelFloat` just reflect
      // the input's current value, which is correct either way.
      if (document.activeElement !== el) formField.focused = false;
      formField.empty = liveEmpty;
      formField.shouldLabelFloat = !liveEmpty;
    }
    props.onTouched$?.();
    props.onBlur$?.(event, el as HTMLInputElement);
  });

  const handleInput$ = $((event: Event) => {
    const el = inputRef.value as HTMLInputElement | undefined;
    const rawValue = el?.value ?? '';
    emptySignal.value = !rawValue;
    const cache = ensureIdCache(idCache);
    const {flat: liveFlat, tree: liveTree} = resolveAutocompleteOptions(
      props.options.value,
      cache,
      autocompleteOptionIdGen,
    );
    handleAutocompleteInput(rawValue, liveFlat, liveTree, ctx, cfg, signals);
    props.onInput$?.(event, el as HTMLInputElement);
  });

  const handleClick$ = $(() => {
    if (disabled) return;
    const cache = ensureIdCache(idCache);
    const {flat: liveFlat, tree: liveTree} = resolveAutocompleteOptions(
      props.options.value,
      cache,
      autocompleteOptionIdGen,
    );
    handleAutocompleteClick(liveFlat, liveTree, ctx, cfg, signals);
  });

  const handleKeyDown$ = $((event: KeyboardEvent) => {
    const cache = ensureIdCache(idCache);
    const {flat: liveFlat, tree: liveTree} = resolveAutocompleteOptions(
      props.options.value,
      cache,
      autocompleteOptionIdGen,
    );
    handleAutocompleteKeydown(event, liveFlat, liveTree, ctx, cfg, signals);
  });

  const classes = [
    'mat-mdc-input-element',
    isInFormField && 'mat-mdc-form-field-input-control',
    isInFormField && 'mdc-text-field__input',
    'mat-mdc-autocomplete-trigger',
    'cdk-text-field-autofill-monitored',
    formBound && (touched ? 'ng-touched' : 'ng-untouched'),
    formBound && (dirty ? 'ng-dirty' : 'ng-pristine'),
    formBound && (invalid ? 'ng-invalid' : 'ng-valid'),
    props.class,
  ].filter(Boolean) as string[];

  const readonlyAttr: 'true' | undefined = readOnly ? 'true' : undefined;
  const ariaInvalid: 'true' | 'false' | undefined =
    emptySignal.value && required ? undefined : errorState ? 'true' : 'false';

  // `value` is a frozen, ONE-TIME snapshot rendered via a plain attribute
  // spread — same technique `mat-input.tsx` uses and for the same reason
  // (see that file's own doc comment): Qwik's SSR serializer never writes
  // `value` as an attribute via the normal JSX `value` prop path for a
  // native `<input>`. Live updates (selection commits / the require-
  // Selection reset) go straight through the DOM property via a ref inside
  // `autocomplete-runtime.ts`, never through this prop again.
  const initialValue = useSignal(() => {
    const v = props.value;
    return v != null ? String(v) : '';
  });

  return (
    <>
      <input
        ref={composeRef([inputRef, props.ref])}
        id={id}
        class={classes}
        style={props.style}
        type={props.type}
        name={props.name || undefined}
        maxLength={props.maxLength}
        placeholder={props.placeholder}
        aria-label={props.inputAriaLabel}
        disabled={disabled || undefined}
        required={required || undefined}
        tabIndex={props.tabIndex}
        {...{readonly: readonlyAttr}}
        {...{value: initialValue.value || undefined}}
        {...{autocomplete: 'off'}}
        role="combobox"
        aria-autocomplete="list"
        aria-haspopup="listbox"
        aria-expanded={panelOpen ? 'true' : 'false'}
        aria-controls={panelOpen ? panelId.value : undefined}
        aria-activedescendant={activeOptionId}
        aria-describedby={ariaDescribedBy}
        aria-invalid={ariaInvalid}
        aria-required={required ? 'true' : 'false'}
        onFocus$={handleFocus$}
        onBlur$={handleBlur$}
        onInput$={handleInput$}
        onClick$={handleClick$}
        onKeyDown$={handleKeyDown$}
      />
      <mat-autocomplete class="mat-mdc-autocomplete" />
    </>
  );
});
