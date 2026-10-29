import {
  $,
  component$,
  useContext,
  useContextProvider,
  useSignal,
  useStore,
  useTask$,
  useVisibleTask$,
  type JSXOutput,
  type QRL,
} from '@builder.io/qwik';
import {useIdGenerator} from '@angular-community/qwik-cdk/a11y';
import {useAnimationsDisabled} from '../dialog/use-animations-disabled';
import {
  MAT_FORM_FIELD_CONNECTED_ORIGIN,
  MAT_FORM_FIELD_CONTROL_STATE,
  readControlProps,
  type MatFormFieldControlState,
} from '../core/mat-form-field-control';
import {
  MAT_FORM_FIELD_CONFIG,
  MAT_FORM_FIELD_CONFIG_DEFAULTS,
  type MatFormFieldAppearance,
  type MatFormFieldColor,
  type MatFormFieldFloatLabelType,
  type MatFormFieldSubscriptSizing,
} from './form-field-config';
import {MatIdScope} from './id-scope';

/**
 * Props for `<MatFormField>`. See `SYNC.md` for the full architecture
 * writeup; summary:
 *
 * `MatFormField` cannot use Angular-style content projection
 * (`<ng-content select="...">`) to discover its label/hint/error/prefix/
 * suffix/control content, because Qwik's SSR renders a parent's OWN host
 * attributes BEFORE any `<Slot>`-projected child has run its render
 * function — a child can never retroactively change what its already-
 * rendered ancestor serialized, confirmed empirically (see "SSR ordering"
 * below). So every piece of projected content is a NAMED PROP holding a
 * JSX value (same "named prop, not inspected `<Slot>` content" pattern
 * `qwik-material/list`'s `MatListItem` sections already established), and
 * the one piece that ALSO needs live reactive data out of its control
 * (`focused`/`empty`/`shouldLabelFloat`) uses a tiny context store the
 * control writes into via its own lazy event handlers — see
 * `core/mat-form-field-control.ts`'s doc comment for the full contract.
 *
 * ```tsx
 * <MatFormField
 *   label={<MatLabel>Email</MatLabel>}
 *   control={<MatInput placeholder="pat@example.com" value={value.value}
 *                        onInput$={(_, el) => (value.value = el.value)} />}
 * />
 * ```
 */
export interface MatFormFieldProps {
  appearance?: MatFormFieldAppearance;
  floatLabel?: MatFormFieldFloatLabelType;
  hideRequiredMarker?: boolean;
  subscriptSizing?: MatFormFieldSubscriptSizing;
  color?: MatFormFieldColor;
  /** Mirrors `[hintLabel]` — rendered as a `<mat-hint>` the form field
   *  manufactures itself (distinct from `hintStart`/`hintEnd`, which the
   *  consumer supplies as explicit `<MatHint>` elements). */
  hintLabel?: string;
  /** From `<MatLabel>…</MatLabel>` — presence drives `_hasFloatingLabel()`. */
  label?: JSXOutput;
  /** From `<MatIconPrefix>…</MatIconPrefix>` (or `<MatPrefix>` —  same
   *  category). */
  iconPrefix?: JSXOutput;
  /** From `<MatTextPrefix>…</MatTextPrefix>`. */
  textPrefix?: JSXOutput;
  /** From `<MatIconSuffix>…</MatIconSuffix>` (or `<MatSuffix>`). */
  iconSuffix?: JSXOutput;
  /** From `<MatTextSuffix>…</MatTextSuffix>`. */
  textSuffix?: JSXOutput;
  /** From a default-aligned (or explicit `align="start"`) `<MatHint>`. */
  hintStart?: JSXOutput;
  /** From an `align="end"` `<MatHint>`. */
  hintEnd?: JSXOutput;
  /** From one or more `<MatError>` elements. Only actually rendered when
   *  `control`'s `invalid` + `touched` fields both hold (mirrors upstream's
   *  `_getSubscriptMessageType()`); the consumer still decides WHETHER to
   *  pass one at all (mirrors the Angular scenario's own
   *  `@if (nameControl.invalid) { <mat-error>...</mat-error> }`). */
  errors?: JSXOutput | JSXOutput[];
  /** The form field's control — typically `<MatInput .../>`. See
   *  `core/mat-form-field-control.ts` for the `MatFormFieldControlProps`
   *  contract any control's own props should satisfy. */
  control?: JSXOutput;
  /**
   * Live counterparts of the SAME fields on `control`'s own props
   * (`MatFormFieldControlProps.touched`/`.dirty`/`.invalid`) — pass these
   * whenever `formBound` is true AND any of them can change after mount
   * (i.e. whenever the consumer's own `useMatFormControl()` value can
   * become touched/dirty/invalid later). The copy nested inside `control`
   * is read exactly once, at first render; THESE top-level props are what
   * stays live afterward. See `core/mat-form-field-control.ts`'s doc
   * comment and `SYNC.md`'s "touched/dirty/invalid: control-prop AND
   * context-store" section for why both copies exist.
   */
  touched?: boolean;
  dirty?: boolean;
  invalid?: boolean;
  class?: string | ReadonlyArray<string>;
  style?: string | Record<string, string | number>;
  id?: string;
}

function toArray<T>(value: T | T[] | undefined): T[] {
  if (value === undefined) return [];
  return Array.isArray(value) ? value : [value];
}

/**
 * Reads `node`'s own explicit `id` prop, if any, WITHOUT rendering it —
 * used to decide whether `MatFormField`'s generated fallback id for this
 * slot is actually needed (an explicit id always wins). This never
 * CLONES the node (see `id-scope.tsx`'s doc comment for why a clone-
 * based approach was tried first and abandoned: it was found, via a real
 * hung-browser repro, to silently freeze the slot's projected children at
 * whatever they were the first time `MatFormField` happened to re-render
 * for an unrelated reason). The generated id itself is handed to the
 * rendered node via `<MatIdScope>` (hints/errors) or the
 * `MAT_FORM_FIELD_CONTROL_STATE` store (`assignedId`/`assignedDescribedBy`
 * — the control), both context-based, both confirmed immune to the same
 * issue.
 */
function explicitId(node: JSXOutput): string | undefined {
  return readControlProps(node)?.id;
}

const SETTLE_SELECTED_FILTER = (v: unknown): v is JSXOutput => v !== undefined && v !== null;

export const MatFormField = component$<MatFormFieldProps>(props => {
  const config = useContext(MAT_FORM_FIELD_CONFIG, MAT_FORM_FIELD_CONFIG_DEFAULTS);
  const animationsDisabled = useAnimationsDisabled();
  const idGen = useIdGenerator();

  const appearance = props.appearance ?? config.appearance ?? 'fill';
  const hasOutline = appearance === 'outline';
  const floatLabel = props.floatLabel ?? config.floatLabel ?? 'auto';
  const alwaysFloat = floatLabel === 'always';
  const hideRequiredMarker = props.hideRequiredMarker ?? config.hideRequiredMarker ?? false;
  const subscriptSizing = props.subscriptSizing ?? config.subscriptSizing ?? 'fixed';
  const color = props.color ?? config.color ?? 'primary';
  const hintLabel = props.hintLabel ?? '';

  const hasFloatingLabel = props.label != null;
  const hasIconPrefix = props.iconPrefix != null;
  const hasTextPrefix = props.textPrefix != null;
  const hasIconSuffix = props.iconSuffix != null;
  const hasTextSuffix = props.textSuffix != null;

  // `props.control` is snapshotted ONCE, at this component's own first render, and that SAME
  // frozen reference is used both for the static `readControlProps()` read below AND for the
  // actual render further down ({controlSnapshot.value}) — `props.control` itself is never
  // read again after this line.
  //
  // This is deliberate, not an oversight: a genuine Qwik 1.20 CORE bug (confirmed live by
  // instrumenting node_modules/@builder.io/qwik's own dist, not inferred) means rendering
  // `{props.control}` directly is unsafe whenever a CONSUMER reconstructs that JSX element
  // fresh on every one of ITS OWN re-renders (the common, idiomatic way to write it — e.g.
  // `control={<MatChipGrid rows={rowsSignal} .../>}` written inline in a route's return JSX).
  // Qwik's optimizer compiles a directly-forwarded prop like `{props.control}` into a
  // `_fnSignal`-wrapped binding so that updating it does NOT require a full `MatFormField`
  // re-render — confirmed load-bearing elsewhere in this file's own architecture (see the
  // module doc comment: "a prop directly on an element returned from a component's own JSX
  // tree... updates correctly"). When that binding's value changes to a NEW element whose
  // underlying component (chips' `MatChipGrid`/`ChipGridRows`/`MatChipRow`, in the case that
  // surfaced this) hasn't had its render QRL resolved client-side yet, Qwik's core
  // (`executeSignalOperation` in packages/qwik/src/core — look for
  // "Rendering promises in JSX signals is not supported") takes a "fully replace the old
  // element" path whose `promises` array (collected from `createElm()`) is LITERALLY never
  // awaited — the dist ships the maintainer's own `// TODO(misko): hook this up` left
  // unfinished. `insertBefore`/`removeNode` run immediately regardless, and the replacement
  // element can be observed briefly disconnected from the DOM (confirmed via direct
  // `isConnected` checks around that exact call) before the dangling promise resolves —
  // usually self-healing within ~1ms, but not always: if anything else touches the DOM in
  // that window, the replacement can be permanently orphaned. This reproduced at roughly the
  // same 1-in-15-to-30 rate `chips/SYNC.md`'s Deviation 8 originally documented, confirmed via
  // 40+ repeated runs of a throwaway Playwright repro against the instrumented dist.
  //
  // The actual fix: avoid ever handing that binding a NEW element reference after mount.
  // `props.control`'s nested prop VALUES were already documented as "read once, never again"
  // for everything that matters (`disabled`/`required`/`controlType`/`formBound` — see
  // `controlProps` below; anything that must change later already goes through a top-level
  // prop or `MAT_FORM_FIELD_CONTROL_STATE`, never through re-reading `control` itself) — so
  // freezing the REFERENCE too changes nothing for any already-supported use case, and
  // confirmed via the SAME repro (0/40, then the real `grid-input`/`grid-disabled` parity
  // specs repeated 20×) that it removes the failure mode entirely: Qwik's `_fnSignal` binding
  // for `control` never fires again after the first render, so the broken replace path is
  // simply never reached. This also means CONSUMERS no longer need to do anything special —
  // reconstructing `control` inline on every render, the natural way to write it, is fine.
  const controlSnapshot = useSignal<JSXOutput | undefined>(() => props.control);

  // ── Control introspection (static half of the contract) ──
  // Read directly off the `control` prop's JSX descriptor, WITHOUT
  // rendering it — see the module doc comment / core/mat-form-field-control.ts.
  const controlProps = readControlProps(controlSnapshot.value);
  const disabled = controlProps?.disabled ?? false;
  const required = controlProps?.required ?? false;
  const controlType = controlProps?.controlType ?? 'mat-input';
  const formBound = controlProps?.formBound ?? false;
  // Prefer the LIVE top-level prop; fall back to the nested `control`-prop
  // snapshot (correct only for the very first render — see this file's
  // module doc comment in core/mat-form-field-control.ts for why the
  // nested copy never updates after mount). Consumers that never need
  // these to change (every scenario except error-state) simply never pass
  // the top-level props, and the nested snapshot is all there is — which
  // is fine, since it's permanently correct for a value that never changes.
  const touched = props.touched ?? controlProps?.touched ?? false;
  const dirty = props.dirty ?? controlProps?.dirty ?? false;
  // RAW validity (upstream's `NgControlStatus` — `ng-valid`/`ng-invalid`
  // mirror the control's `.valid`/`.invalid` status DIRECTLY, independent
  // of touched/dirty; confirmed live on error-state: both fields are
  // `ng-untouched ng-pristine ng-invalid` from the very FIRST render,
  // before any interaction — do not gate this by touched).
  const invalid = props.invalid ?? controlProps?.invalid ?? false;
  // `errorState` (upstream's `_errorStateTracker.errorState`, the DEFAULT
  // `ErrorStateMatcher`'s formula: `control.invalid && (control.touched ||
  // form.submitted)` — no `<form>`/submit concept in this port, so just
  // `touched`) is a SEPARATE, touched-GATED concept that drives
  // mat-form-field-invalid/mdc-text-field--invalid/visible `<mat-error>`
  // — never the plain `ng-valid`/`ng-invalid` classes above.
  const errorState = formBound && touched && invalid;
  const initialEmpty = !controlProps?.value;
  // Control's OWN shouldLabelFloat (upstream's `MatInput.shouldLabelFloat`
  // getter): `(focused && !disabled) || !empty`. `focused` is always false
  // at this point (no scenario starts focused) — recomputed reactively via
  // the context store below once real focus/blur events fire.
  const initialControlShouldFloat = !initialEmpty;

  // Backs `MAT_FORM_FIELD_CONNECTED_ORIGIN` — see that context's own doc
  // comment (core/mat-form-field-control.ts). A plain ref signal: written
  // once the wrapper div mounts, read (not subscribed-to) by a control like
  // `MatSelect` only inside its own lazy `open()` handler — no reactivity
  // concerns, unlike `controlState` below.
  const wrapperRef = useSignal<Element>();
  useContextProvider(MAT_FORM_FIELD_CONNECTED_ORIGIN, wrapperRef);

  // ── Reactive (post-mount) control state — see
  // core/mat-form-field-control.ts's doc comment for why this is a plain
  // useStore() of booleans, seeded here (correct for the very first SSR
  // render) and written to afterwards only by the control's own lazy
  // onFocus$/onBlur$ handlers (never a mount task). ──
  // `assignedId`/`labelId`/`assignedDescribedBy` are seeded with
  // placeholders here and overwritten below, synchronously, before the
  // control ever renders (all depend on ids computed further down —
  // hints/errors need to be processed first for `assignedDescribedBy`) —
  // never left stale, since this is all one synchronous pass before
  // `<Slot/>`/the control runs.
  const controlState = useStore<MatFormFieldControlState>({
    focused: false,
    empty: initialEmpty,
    shouldLabelFloat: initialControlShouldFloat,
    assignedId: '',
    labelId: undefined,
    color,
    assignedDescribedBy: undefined,
    touched,
    dirty,
    invalid,
  });
  useContextProvider(MAT_FORM_FIELD_CONTROL_STATE, controlState);

  // `_shouldLabelFloat()`: only meaningful when there's a floating label at
  // all; otherwise always floating ("always") or the control's own report.
  const shouldLabelFloat = hasFloatingLabel && (controlState.shouldLabelFloat || alwaysFloat);
  const hidePlaceholder = hasFloatingLabel && !shouldLabelFloat;

  // ── ids ──
  // Lazy initializers (run once, memoized for the lifetime of this
  // component instance) — mirror upstream's field-initializer `_labelId`/
  // `_hintLabelId` `_IdGenerator` calls. Exact numeric values don't need to
  // match upstream's allocation ORDER (the parity harness squashes digits
  // — see angular-parity.spec.ts's header comment) — only that each
  // `for`/`aria-describedby` reference points at the matching element's
  // own id.
  //
  // CRITICAL: every one of these MUST be memoized (`useSignal(() => ...)`),
  // never a bare `idGen.getId(...)` call inline in the render body. A bare
  // call mints a FRESH id on every re-render (e.g. the 300ms
  // animations-enabled timer firing, or a later focus/blur) — found, via a
  // real hung-browser repro (the page's JS spun at 100% CPU and stopped
  // responding to CDP commands entirely), to cause the control's `id` /
  // the label's `for` / `aria-describedby` to keep changing out from under
  // the live DOM after mount, apparently feeding back into more
  // re-renders. Fixed by generating every fallback id exactly once per
  // component instance and reusing it thereafter — matches upstream's own
  // field-initializer semantics (`readonly _labelId = idGen.getId(...)`
  // literally cannot re-run either).
  const labelId = useSignal(() => idGen.getId('mat-mdc-form-field-label-'));
  const hintLabelId = useSignal(() => idGen.getId('mat-mdc-hint-'));
  // The generated-id PREFIX mirrors whichever control actually owns it
  // upstream (`MatInput._uid = idGenerator.getId('mat-input-')` vs.
  // `MatSelect._uid = idGenerator.getId('mat-select-')`, etc.) — even
  // though, per this port's "id ownership" deviation (see this field's own
  // doc comment below), the FORM FIELD is the one minting the fallback, not
  // the control itself. `controlType` (already computed above from the
  // control's own `controlType` prop — `MatInput` passes `'mat-input'`,
  // `MatSelect` passes `'mat-select'`) is reused as the lookup key so a
  // future control type just needs to add itself here once.
  const generatedControlId = useSignal(() =>
    idGen.getId(controlType === 'mat-select' ? 'mat-select-' : 'mat-input-'),
  );
  const generatedHintStartId = useSignal(() => idGen.getId('mat-mdc-hint-'));
  const generatedHintEndId = useSignal(() => idGen.getId('mat-mdc-hint-'));
  // Errors are the one slot whose CONTENT (not just count) can legitimately
  // change across renders (error-state: "Email is required" swapped for
  // "Enter a valid email") — cached per ARRAY INDEX (slot), not per
  // render, so a slot that stays populated keeps the same id while a
  // genuinely different error occupying that slot still gets a fresh one
  // the first time it appears. Plain mutation (not a reactive write) is
  // intentional: this is stable storage across this instance's re-renders,
  // never read for its own reactivity.
  const errorIdCache = useSignal<string[]>(() => []);

  const controlId = controlProps?.id ?? generatedControlId.value;

  const errorsArray = toArray(props.errors).filter(SETTLE_SELECTED_FILTER);
  const hasErrors = errorsArray.length > 0;
  // Upstream `_getSubscriptMessageType()`.
  const showErrors = hasErrors && errorState;

  // Each error's id: its own explicit `id` prop if set, else a per-slot
  // (array index) cached fallback — see `errorIdCache`'s own comment for
  // why index-keyed, not per-render. Wrapped in `<MatIdScope>` at render
  // time (not cloned) — see `id-scope.tsx`.
  const errorIds = errorsArray.map((node, i) => {
    const explicit = explicitId(node);
    if (explicit) return explicit;
    if (!errorIdCache.value[i]) {
      errorIdCache.value[i] = idGen.getId('mat-mdc-error-');
    }
    return errorIdCache.value[i];
  });
  const hintStartId = props.hintStart
    ? (explicitId(props.hintStart) ?? generatedHintStartId.value)
    : undefined;
  const hintEndId = props.hintEnd
    ? (explicitId(props.hintEnd) ?? generatedHintEndId.value)
    : undefined;

  // Upstream `_syncDescribedByIds`.
  const describedByIds: string[] = [];
  const userDescribedBy = controlProps?.['aria-describedby'];
  if (userDescribedBy) describedByIds.push(...userDescribedBy.split(' '));
  if (showErrors) {
    describedByIds.push(...errorIds);
  } else {
    if (hintStartId) describedByIds.push(hintStartId);
    else if (hintLabel) describedByIds.push(hintLabelId.value);
    if (hintEndId) describedByIds.push(hintEndId);
  }
  const finalDescribedBy = describedByIds.length ? describedByIds.join(' ') : undefined;

  // The control reads these off the SAME context store it already
  // consumes for focused/empty/shouldLabelFloat — see
  // core/mat-form-field-control.ts's `assignedId` doc comment for why
  // this (not cloning the control's JSX to inject props) is the fix for
  // the same staleness bug the hints/errors fix (`MatIdScope`) addresses.
  //
  // GUARDED assignment — found live, via a MutationObserver-confirmed
  // repro: writing to a useStore() field EVERY render (even re-assigning
  // the SAME value) still notifies subscribers, and MatInput reads
  // `assignedId`/`assignedDescribedBy` during ITS OWN render — so an
  // unconditional write here re-triggered MatInput on EVERY MatFormField
  // re-render (e.g. the unrelated `focused`/`shouldLabelFloat` flips a
  // focus event causes), which in turn caused the live `<input>` element
  // to be replaced (losing focus — confirmed: `document.activeElement`
  // reverted to `<body>` within the SAME event, before any `blur` step
  // ever ran, on the error-state scenario specifically — the only one
  // whose control reads `assignedId`/`assignedDescribedBy` from a value
  // that otherwise never changes while focused=true). Skipping the write
  // when the value hasn't actually changed avoids the spurious
  // notification entirely.
  if (controlState.assignedId !== controlId) controlState.assignedId = controlId;
  const ownLabelId = hasFloatingLabel ? labelId.value : undefined;
  if (controlState.labelId !== ownLabelId) controlState.labelId = ownLabelId;
  if (controlState.assignedDescribedBy !== finalDescribedBy) {
    controlState.assignedDescribedBy = finalDescribedBy;
  }
  // Same guarded-write treatment, same reason, for the touched/dirty/
  // invalid trio: these are the fields `error-state`'s LIVE top-level
  // `MatFormField` props (`touched`/`dirty`/`invalid` above) feed into the
  // control via this store — see core/mat-form-field-control.ts's doc
  // comment. Writing on every render (even re-writing the SAME value)
  // would re-trigger the control unnecessarily.
  if (controlState.touched !== touched) controlState.touched = touched;
  if (controlState.dirty !== dirty) controlState.dirty = dirty;
  if (controlState.invalid !== invalid) controlState.invalid = invalid;

  // ── Line ripple (fill only) — mirrors MatFormFieldLineRipple.activate()/
  // deactivate()/_handleTransitionEnd(). Modeled as 2 independent booleans
  // (not a single enum) because the real transitions are independent adds
  // ("activate" never touches the deactivating class; "deactivate" never
  // touches the active class) — see the big LINE-RIPPLE comment in
  // angular-parity.spec.ts for the exact quirk this reproduces: a
  // never-focused field is permanently `deactivating`-only (upstream's
  // ngAfterViewInit calls _updateFocusState() once, and `_isFocused` starts
  // `null`, not `false`, so the "went inactive" branch runs despite nothing
  // ever having been active). ──
  const rippleActive = useSignal(false);
  const rippleDeactivating = useSignal(!controlState.focused);
  useTask$(({track}) => {
    const focused = track(() => controlState.focused);
    if (focused) {
      rippleDeactivating.value = false;
      rippleActive.value = true;
    } else {
      rippleDeactivating.value = true;
      // `active` is intentionally left untouched here — deactivate() never
      // clears it; only the transitionend handler below does, together
      // with `deactivating`.
    }
  });
  const onLineRippleTransitionEnd$: QRL<(event: TransitionEvent) => void> = $(event => {
    if (event.propertyName === 'opacity' && rippleDeactivating.value) {
      rippleActive.value = false;
      rippleDeactivating.value = false;
    }
  });

  // ── Outline notch width — mirrors `_refreshOutlineNotchWidth`/
  // `_setNotchWidth` (`NOTCH_ELEMENT_PADDING` 8 + `NOTCH_ELEMENT_BORDER` 1 =
  // 9). Measured lazily (Element.scrollWidth, an integer, not the
  // sub-pixel-sensitive getBoundingClientRect prefix-offset calc — see
  // angular-parity.spec.ts's WIDTH note for why that one's avoided) each
  // time `shouldLabelFloat` flips, via a ref to form-field's OWN rendered
  // `<label>` (upstream's label lives in `MatFormField`'s own template too
  // — no cross-component ref needed). A plain reactive useTask$, not a
  // mount-only task: it is a no-op at mount for every scenario here that
  // does NOT start floated (no `outline-basic`-style scenario starts
  // floated) and only does real work once a real focus event flips
  // `shouldLabelFloat`, by which point the label ref is populated
  // (client-side). ──
  const labelRef = useSignal<Element>();
  const notchRef = useSignal<Element>();
  useTask$(({track}) => {
    // Track the STORE FIELD directly (not the derived `shouldLabelFloat`
    // local below) — `track()` only establishes a live subscription for
    // signals/store fields actually dereferenced INSIDE its callback; a
    // callback that just returns an already-computed outer primitive
    // establishes no subscription at all and would never re-run reactively.
    const controlFloat = track(() => controlState.shouldLabelFloat);
    const floating = hasFloatingLabel && (controlFloat || alwaysFloat);
    const notch = notchRef.value as HTMLElement | undefined;
    if (!notch || !hasOutline) return;
    const label = labelRef.value as HTMLElement | undefined;
    if (!floating || !label) {
      notch.style.width = '';
      return;
    }
    const labelWidth = label.scrollWidth;
    if (!labelWidth) {
      notch.style.width = '';
      return;
    }
    notch.style.width = `calc(${labelWidth}px * var(--mat-mdc-form-field-floating-label-scale, 0.75) + 9px)`;
  });
  // A control that starts ALREADY floating (e.g. a chip-grid seeded with existing chips —
  // see chips/SYNC.md) needs the SAME measurement to happen once more, correctly, on the
  // client: the `useTask$` above runs for the first time during SSR, where `notchRef`/
  // `labelRef` are never populated (no real DOM to measure `scrollWidth` against on the
  // server) — and since `controlState.shouldLabelFloat` is ALREADY `true` on that very first
  // run, it never "flips" again to give that task a reason to re-run once a real DOM exists.
  // `initialControlShouldFloat` is known statically (from the control's own props) BEFORE any
  // hook runs, and is stable for the lifetime of this component instance, so calling
  // `useVisibleTask$` conditionally on it is safe (this instance either always or never calls
  // it, never a different count across ITS OWN re-renders — the only thing Qwik's hook-order
  // rule actually requires). This keeps the eager cost scoped to exactly the controls that
  // need it; the other 16+ form-field scenarios (none start floated) never pay it, matching
  // design doc rule 6/expansion's own "mount-driven-timing exception" precedent (the
  // `mat-form-field-animations-enabled` timer just below is the SAME kind of exception, just
  // unconditional since every form-field needs it once).
  if (hasOutline && initialControlShouldFloat && hasFloatingLabel) {
    // eslint-disable-next-line qwik/no-use-visible-task
    useVisibleTask$(() => {
      const notch = notchRef.value as HTMLElement | undefined;
      const label = labelRef.value as HTMLElement | undefined;
      if (!notch || !label) return;
      const labelWidth = label.scrollWidth;
      if (!labelWidth) return;
      notch.style.width = `calc(${labelWidth}px * var(--mat-mdc-form-field-floating-label-scale, 0.75) + 9px)`;
    });
  }

  // ── `mat-form-field-animations-enabled`, ~300ms after mount, once,
  // forever — mirrors `ngAfterViewInit`'s `setTimeout`. Explicitly
  // sanctioned mount-driven-timing exception to "no per-instance
  // useVisibleTask$" (design doc rule 6/expansion's own precedent): there
  // is no user interaction to lazily hang a zero-click, unconditional,
  // time-based class flip on. Does NOT push any control state — the
  // coordinator's guidance (and the empirical "SSR ordering" check — see
  // core/mat-form-field-control.ts) is specifically about not using a
  // mount task for THAT; this timer is form-field's own, self-contained
  // state, matching upstream's own unconditional eagerness exactly. ──
  const animationsEnabled = useSignal(false);
  useVisibleTask$(() => {
    if (animationsDisabled.value) return;
    const timer = setTimeout(() => {
      animationsEnabled.value = true;
    }, 300);
    return () => clearTimeout(timer);
  });

  const hostClasses = [
    'mat-mdc-form-field',
    `mat-mdc-form-field-type-${controlType}`,
    alwaysFloat && 'mat-mdc-form-field-label-always-float',
    hasIconPrefix && 'mat-mdc-form-field-has-icon-prefix',
    hasIconSuffix && 'mat-mdc-form-field-has-icon-suffix',
    errorState && 'mat-form-field-invalid',
    disabled && 'mat-form-field-disabled',
    appearance === 'fill' && 'mat-form-field-appearance-fill',
    hasOutline && 'mat-form-field-appearance-outline',
    hidePlaceholder && 'mat-form-field-hide-placeholder',
    color !== 'accent' && color !== 'warn' && 'mat-primary',
    color === 'accent' && 'mat-accent',
    color === 'warn' && 'mat-warn',
    formBound && (touched ? 'ng-touched' : 'ng-untouched'),
    formBound && (dirty ? 'ng-dirty' : 'ng-pristine'),
    // Mirrors `AbstractControl.valid`/`.invalid` BOTH reporting `false` while the control's
    // status is `DISABLED` (`_shouldForward('valid')`/`_shouldForward('invalid')` are two
    // INDEPENDENT host bindings upstream, unlike this port's single ternary — disabled is the
    // one case where neither ever applies). Confirmed live via `qwik-material/timepicker`'s own
    // `disabled` parity scenario (the first control port to combine `formBound` + `disabled`):
    // Angular's `<mat-form-field>` carries `ng-pristine ng-untouched` but NEITHER `ng-valid` nor
    // `ng-invalid` while disabled.
    formBound && !disabled && (invalid ? 'ng-invalid' : 'ng-valid'),
    animationsEnabled.value && 'mat-form-field-animations-enabled',
    controlState.focused && 'mat-focused',
    props.class,
  ].filter(Boolean) as string[];

  const wrapperClasses = [
    'mat-mdc-text-field-wrapper',
    'mdc-text-field',
    !hasOutline && 'mdc-text-field--filled',
    hasOutline && 'mdc-text-field--outlined',
    !hasFloatingLabel && 'mdc-text-field--no-label',
    disabled && 'mdc-text-field--disabled',
    controlState.focused && 'mdc-text-field--focused',
    errorState && 'mdc-text-field--invalid',
  ].filter(Boolean) as string[];

  const lineRippleClasses = [
    'mdc-line-ripple',
    rippleActive.value && 'mdc-line-ripple--active',
    rippleDeactivating.value && 'mdc-line-ripple--deactivating',
  ].filter(Boolean) as string[];

  const subscriptClasses = [
    'mat-mdc-form-field-subscript-wrapper',
    'mat-mdc-form-field-bottom-align',
    subscriptSizing === 'dynamic' && 'mat-mdc-form-field-subscript-dynamic-size',
  ].filter(Boolean) as string[];

  // Mirrors `_MatInternalFormField`'s/`_control.onContainerClick` behavior:
  // a click anywhere in the text-field wrapper that ISN'T already on the
  // control itself focuses it. No parity scenario exercises this (every
  // interaction step uses a direct `.focus()`/`.fill()` on the control —
  // see angular-parity.spec.ts), kept for fidelity/real-world use.
  const onWrapperClick$: QRL<(event: Event) => void> = $(event => {
    const target = event.target as Element | null;
    if (target?.closest('input, textarea')) return;
    const wrapper = (event.currentTarget as Element) ?? null;
    const control = wrapper?.querySelector<HTMLElement>('input, textarea');
    control?.focus();
  });

  const labelContent = hasFloatingLabel && (
    <label
      {...{matformfieldfloatinglabel: ''}}
      class={
        [
          'mdc-floating-label',
          'mat-mdc-floating-label',
          shouldLabelFloat && 'mdc-floating-label--float-above',
        ].filter(Boolean) as string[]
      }
      id={labelId.value}
      // `controlType === 'mat-select'` ALSO implies `disableAutomaticLabeling`
      // even when the control didn't explicitly set it — `MatSelect` must
      // pass `controlType="mat-select"` anyway (see that prop's own doc
      // comment: it's the only way `MatFormField` can tell which control
      // this is, since the `mat-input-`-fallback id-prefix branch needs the
      // SAME check), so bundling the label-`for` suppression into that
      // single required prop avoids asking consumers for a SECOND one.
      for={
        controlProps?.disableAutomaticLabeling || controlType === 'mat-select'
          ? undefined
          : controlId
      }
      ref={labelRef}
    >
      {props.label}
      {!hideRequiredMarker && required && (
        <span
          aria-hidden="true"
          class="mat-mdc-form-field-required-marker mdc-floating-label--required"
        />
      )}
    </label>
  );

  return (
    <mat-form-field id={props.id} class={hostClasses} style={props.style}>
      <div class={wrapperClasses} onClick$={onWrapperClick$} ref={wrapperRef}>
        {!hasOutline && !disabled && <div class="mat-mdc-form-field-focus-overlay" />}
        <div class="mat-mdc-form-field-flex">
          {hasOutline && (
            // `matFormFieldNotchedOutlineOpen` is an upstream @Input()
            // PROPERTY binding (`[matFormFieldNotchedOutlineOpen]=...`),
            // never reflected as a DOM attribute — only the bare
            // `matFormFieldNotchedOutline` selector attribute (Material's
            // own template writing its own selector, same category as
            // `matFormFieldLineRipple`/`matFormFieldFloatingLabel`) is
            // real DOM. `mdc-notched-outline--upgraded` vs `--no-label`
            // mirrors `ngAfterViewInit`'s `querySelector('.mdc-floating-label')`
            // check.
            <div
              {...{matformfieldnotchedoutline: ''}}
              class={
                [
                  'mdc-notched-outline',
                  hasFloatingLabel
                    ? 'mdc-notched-outline--upgraded'
                    : 'mdc-notched-outline--no-label',
                  shouldLabelFloat && 'mdc-notched-outline--notched',
                ].filter(Boolean) as string[]
              }
            >
              <div class="mat-mdc-notch-piece mdc-notched-outline__leading" />
              <div class="mat-mdc-notch-piece mdc-notched-outline__notch" ref={notchRef}>
                {labelContent}
              </div>
              <div class="mat-mdc-notch-piece mdc-notched-outline__trailing" />
            </div>
          )}

          {hasIconPrefix && <div class="mat-mdc-form-field-icon-prefix">{props.iconPrefix}</div>}
          {hasTextPrefix && <div class="mat-mdc-form-field-text-prefix">{props.textPrefix}</div>}

          <div class="mat-mdc-form-field-infix">
            {!hasOutline && labelContent}
            {controlSnapshot.value}
          </div>

          {hasTextSuffix && <div class="mat-mdc-form-field-text-suffix">{props.textSuffix}</div>}
          {hasIconSuffix && <div class="mat-mdc-form-field-icon-suffix">{props.iconSuffix}</div>}
        </div>

        {!hasOutline && (
          <div
            {...{matformfieldlineripple: ''}}
            class={lineRippleClasses}
            onTransitionEnd$={onLineRippleTransitionEnd$}
          />
        )}
      </div>

      <div aria-atomic="true" aria-live="polite" class={subscriptClasses}>
        {showErrors ? (
          <div class="mat-mdc-form-field-error-wrapper">
            {errorsArray.map((node, i) => (
              <MatIdScope key={errorIds[i]} id={errorIds[i]}>
                {node}
              </MatIdScope>
            ))}
          </div>
        ) : (
          <div class="mat-mdc-form-field-hint-wrapper">
            {hintLabel && (
              // Manufactured directly by `MatFormField` itself (upstream:
              // `<mat-hint [id]="_hintLabelId">{{hintLabel}}</mat-hint>` in
              // its OWN template) — carries the same classes `<MatHint>`
              // itself would apply (Angular directive selectors match ANY
              // element with that tag name, including ones written in
              // ANOTHER component's own template) since no `align` is set
              // (defaults to 'start', which adds no extra class).
              <mat-hint
                id={hintLabelId.value}
                class={['mat-mdc-form-field-hint', 'mat-mdc-form-field-bottom-align']}
              >
                {hintLabel}
              </mat-hint>
            )}
            {props.hintStart && (
              <MatIdScope id={hintStartId as string}>{props.hintStart}</MatIdScope>
            )}
            <div class="mat-mdc-form-field-hint-spacer" />
            {props.hintEnd && <MatIdScope id={hintEndId as string}>{props.hintEnd}</MatIdScope>}
          </div>
        )}
      </div>
    </mat-form-field>
  );
});
