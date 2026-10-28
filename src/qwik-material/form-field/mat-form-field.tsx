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

  // ── Control introspection (static half of the contract) ──
  // Read directly off the `control` prop's JSX descriptor, WITHOUT
  // rendering it — see the module doc comment / core/mat-form-field-control.ts.
  const controlProps = readControlProps(props.control);
  const disabled = controlProps?.disabled ?? false;
  const required = controlProps?.required ?? false;
  const controlType = controlProps?.controlType ?? 'mat-input';
  const formBound = controlProps?.formBound ?? false;
  const touched = controlProps?.touched ?? false;
  const dirty = controlProps?.dirty ?? false;
  // Mirrors the DEFAULT `ErrorStateMatcher` exactly: invalid && touched
  // (upstream: `control.invalid && (control.touched || form.submitted)` —
  // no `<form>`/submit concept in this port, so just `touched`).
  const errorState = formBound && touched && (controlProps?.invalid ?? false);
  const initialEmpty = !controlProps?.value;
  // Control's OWN shouldLabelFloat (upstream's `MatInput.shouldLabelFloat`
  // getter): `(focused && !disabled) || !empty`. `focused` is always false
  // at this point (no scenario starts focused) — recomputed reactively via
  // the context store below once real focus/blur events fire.
  const initialControlShouldFloat = !initialEmpty;

  // ── Reactive (post-mount) control state — see
  // core/mat-form-field-control.ts's doc comment for why this is a plain
  // useStore() of booleans, seeded here (correct for the very first SSR
  // render) and written to afterwards only by the control's own lazy
  // onFocus$/onBlur$ handlers (never a mount task). ──
  // `assignedId`/`assignedDescribedBy` are seeded with placeholders here
  // and overwritten below, synchronously, before the control ever renders
  // (both depend on ids computed further down — hints/errors need to be
  // processed first for `assignedDescribedBy`) — never left stale, since
  // this is all one synchronous pass before `<Slot/>`/the control runs.
  const controlState = useStore<MatFormFieldControlState>({
    focused: false,
    empty: initialEmpty,
    shouldLabelFloat: initialControlShouldFloat,
    assignedId: '',
    assignedDescribedBy: undefined,
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
  const generatedControlId = useSignal(() => idGen.getId('mat-input-'));
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
  controlState.assignedId = controlId;
  controlState.assignedDescribedBy = finalDescribedBy;

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
  // mount-only task: it is a no-op at mount for every scenario here (no
  // outline scenario starts floated — see `outline-basic`'s own note) and
  // only does real work once a real focus event flips `shouldLabelFloat`,
  // by which point the label ref is populated (client-side). ──
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
    formBound && (errorState ? 'ng-invalid' : 'ng-valid'),
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
      for={controlId}
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
      <div class={wrapperClasses} onClick$={onWrapperClick$}>
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
            {props.control}
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
