import {
  $,
  component$,
  Slot,
  useContext,
  useOnDocument,
  useSignal,
  type QRL,
} from '@builder.io/qwik';
import {useFocusOrigin, useIdGenerator} from '@angular-community/qwik-cdk/a11y';
import {useAnimationsDisabled} from '../dialog/use-animations-disabled';
import {MatInternalFormField} from '../core/mat-internal-form-field';
import type {MatRadioColor} from './radio-color';
import {MAT_RADIO_CONFIG, MAT_RADIO_CONFIG_DEFAULTS} from './radio-config';
import {MAT_RADIO_GROUP_STATE, MAT_RADIO_GROUP_STATE_DEFAULTS} from './radio-group-state';

/**
 * Props for <MatRadioButton>. Renders upstream's `radio.html` template
 * inline (src/material/radio/radio.ts + radio.html): a
 * `<MatInternalFormField>` wrapping the `.mdc-radio` control (touch target,
 * native `<input type="radio">`, background circles, static ripple
 * container) and an `mdc-label` label. Reads the parent group's state via
 * MAT_RADIO_GROUP_STATE (falling back to a standalone-shaped default when
 * rendered without a <MatRadioGroup> ancestor) and MAT_RADIO_CONFIG for
 * `color`/`disabledInteractive` provider defaults.
 *
 * `checked` is a *property* on the native `<input>`, not an attribute that
 * stays in sync with it — same distinction the browser itself makes for
 * `checked`/`value`/`selected` (unlike e.g. `disabled`/`required`, which DO
 * auto-reflect to their attribute). Qwik's JSX `checked` prop already does
 * the right thing at runtime (sets `elm.checked` directly once resumed), and
 * Angular Material's own dev-app is pure CSR (no SSR) so its rendered
 * `<input>` never shows a `checked` *attribute* either, checked or not —
 * see `src/qwik-cdk-parity-tests/lib/material-parity.ts`'s `walk()` for the
 * matching normalization (reads the live `.checked` property instead of the
 * attribute for radio/checkbox inputs, so this SSR-vs-CSR architecture
 * difference — orthogonal to actual rendered behavior, which already keys
 * off the live property / `:checked` pseudo-class — doesn't show up as a
 * false-positive diff).
 */
export interface MatRadioButtonProps {
  /** The value this button represents. Compared against the group's `value`
   *  (grouped) or otherwise unused for selection (standalone). */
  value?: unknown;
  /** Initial checked state. Only meaningful for a *standalone* button (no
   *  <MatRadioGroup> ancestor) — read once as the seed for local state,
   *  mirroring upstream's `UniqueSelectionDispatcher`-synchronized `checked`
   *  Input, which this port replaces with native same-`name` browser
   *  grouping (see the doc comment on the component body below). Ignored
   *  for a grouped button, whose checked state is always derived from the
   *  group's `value`. */
  checked?: boolean;
  /** Optional id. Auto-generated (`mat-radio-N`) when omitted, matching
   *  upstream's `_uniqueId = inject(_IdGenerator).getId('mat-radio-')`. */
  id?: string;
  /** Individual name override — only used standalone; a grouped button
   *  always uses the group's `name` (upstream `ngOnInit`: `this.name =
   *  this.radioGroup.name`, unconditionally overwriting any own value). */
  name?: string;
  'aria-label'?: string;
  'aria-labelledby'?: string;
  'aria-describedby'?: string;
  /** Individually disables this button (OR'd with the group's). */
  disabled?: boolean;
  /** Whether this button stays interactive while disabled (OR'd with the group's). */
  disabledInteractive?: boolean;
  /** Marks this button's native input `required` (OR'd with the group's). */
  required?: boolean;
  /** Tabindex of the native input when not subject to roving reduction.
   *  Default 0. */
  tabIndex?: number;
  /** Label position override. Falls back to the group's, then 'after'. */
  labelPosition?: 'before' | 'after';
  /** Color override. Falls back to the group's, then config, then 'accent'. */
  color?: MatRadioColor;
  /** Fires when this button's native input becomes checked. Mirrors
   *  upstream's own per-button `change: EventEmitter<MatRadioChange>`,
   *  which fires independently of the group's `change` output — used by
   *  standalone scenarios, which have no group to route through. */
  onChange$?: QRL<(value: unknown) => void>;
  class?: string | ReadonlyArray<string>;
}

export const MatRadioButton = component$<MatRadioButtonProps>(props => {
  const config = useContext(MAT_RADIO_CONFIG, MAT_RADIO_CONFIG_DEFAULTS);
  const stateSignal = useContext(MAT_RADIO_GROUP_STATE, {value: MAT_RADIO_GROUP_STATE_DEFAULTS});
  const state = stateSignal.value;
  const standalone = state.standalone;

  const idGen = useIdGenerator();
  // Computed once, lazily — mirrors upstream's `_uniqueId = inject(_IdGenerator)
  // .getId('mat-radio-')` field initializer.
  const autoId = useSignal(() => idGen.getId('mat-radio-'));
  const id = props.id ?? autoId.value;
  const inputId = `${id}-input`;

  // Standalone-only local checked state, seeded once from `checked`. A
  // standalone button has no shared reactive ancestor with its same-`name`
  // siblings (unlike a grouped button, whose `checked` is recomputed from
  // the group's `value` on every render of every child), so the browser's
  // own native same-`name` unchecking of a sibling's *input* needs no help
  // — but this button's own *rendered host class* (`mat-mdc-radio-checked`)
  // is derived from this signal, not from the live DOM, so it would stay
  // stale forever unless something tells this instance to re-render.
  // Upstream solves the equivalent problem with `UniqueSelectionDispatcher`
  // (a cross-component bus explicitly flipping `this.checked = false` on
  // every other same-`name` button); this port uses a `useOnDocument()`
  // 'change' listener below as the Qwik-native equivalent of that bus — the
  // native 'change' event already bubbles to `document` for free, so no
  // actual registry object is needed, just a lazy, event-delegated handler
  // (not `useVisibleTask$` — see qwik-cdk/a11y/focus-origin/focus-origin.ts
  // for why that distinction matters here too). See radio-group-state.ts's
  // standalone doc comment.
  const localChecked = useSignal(() => props.checked ?? false);

  const checked = standalone ? localChecked.value : state.value === props.value;

  const effectiveDisabled = (props.disabled ?? false) || state.disabled;
  const effectiveRequired = (props.required ?? false) || state.required;
  const effectiveDisabledInteractive =
    (props.disabledInteractive ?? config.disabledInteractive ?? false) || state.disabledInteractive;
  const effectiveColor: MatRadioColor = props.color ?? state.color ?? config.color ?? 'accent';
  const effectiveLabelPosition = props.labelPosition ?? state.labelPosition ?? 'after';
  const effectiveName = standalone ? props.name : state.name;

  const noopAnimations = useAnimationsDisabled();
  // Upstream `ngAfterViewInit(): this._focusMonitor.monitor(this._elementRef,
  // true)` — monitors the HOST element (`<mat-radio-button>`), not the inner
  // input; `focusin` bubbles from the input up to this host for free. See
  // button-toggle's analogous use of this lazy, useOn()-based hook (no
  // useVisibleTask$ — qwik-cdk/a11y/focus-origin/focus-origin.ts).
  const focusOrigin = useFocusOrigin();

  // Roving tabindex — upstream `_updateTabIndex()` (radio.ts lines 745-795),
  // simplified to its actual condition (no imperative DOM write needed; a
  // declarative `tabIndex` JSX prop on <input> is forced through
  // `setAttribute` by Qwik's runtime regardless of updates, so it never goes
  // stale — see this file's top doc comment for why `checked` is different):
  // disabled, or standalone (no group), or nothing in the group selected
  // yet → use this button's own tabIndex; otherwise 0 if this IS the
  // selected one, else -1.
  const ownTabIndex = props.tabIndex ?? 0;
  const hasGroupSelection = !standalone && state.value !== undefined && state.value !== null;
  const tabIndexValue =
    standalone || effectiveDisabled || !hasGroupSelection
      ? ownTabIndex
      : checked
        ? ownTabIndex
        : -1;

  const hostClasses = [
    'mat-mdc-radio-button',
    effectiveColor === 'primary' && 'mat-primary',
    effectiveColor === 'accent' && 'mat-accent',
    effectiveColor === 'warn' && 'mat-warn',
    checked && 'mat-mdc-radio-checked',
    effectiveDisabled && 'mat-mdc-radio-disabled',
    effectiveDisabledInteractive && 'mat-mdc-radio-disabled-interactive',
    noopAnimations.value && '_mat-animation-noopable',
    focusOrigin.value && 'cdk-focused',
    focusOrigin.value === 'touch' && 'cdk-touch-focused',
    focusOrigin.value === 'keyboard' && 'cdk-keyboard-focused',
    focusOrigin.value === 'mouse' && 'cdk-mouse-focused',
    focusOrigin.value === 'program' && 'cdk-program-focused',
    props.class,
  ].filter(Boolean) as string[];

  const inputRef = useSignal<HTMLInputElement>();

  // Companion to the comment on `localChecked` above: when this is a
  // standalone button, listen document-wide for a *different* same-`name`
  // radio becoming checked (native 'change' events bubble to `document`
  // for free) and reset this button's own local signal — the Qwik-native
  // substitute for upstream's `UniqueSelectionDispatcher.listen()`. No-op
  // for a grouped button (its `checked` already comes from context, not
  // this signal) — checked unconditionally rather than behind `if
  // (standalone)` so this hook call site stays unconditional; the
  // standalone check happens inside the handler itself, which is cheap and
  // only ever runs after a real 'change' event fires somewhere.
  useOnDocument(
    'change',
    $((event: Event) => {
      if (!stateSignal.value.standalone) return;
      const target = event.target;
      if (!(target instanceof HTMLInputElement) || target === inputRef.value) return;
      if (target.type !== 'radio' || !target.name || target.name !== props.name) return;
      // Guard against a stale invocation: by the time this (possibly
      // deferred) handler runs, `target` may have been natively unchecked
      // again by a *later* same-`name` click — in which case there's
      // nothing to react to.
      if (target.checked) {
        localChecked.value = false;
      }
    }),
  );

  // Native 'change' only fires when the browser just transitioned THIS
  // input to checked (click on an unchecked radio, or native arrow-key
  // navigation moving selection within the shared `name` group) — so unlike
  // upstream's `_onInputInteraction`, there is no need to separately guard
  // on `!checked`. There IS a need to guard against staleness, though:
  // rapid clicks on different same-`name` radios, fired before handler
  // chunks load, can have their *handler invocations* resume out of order
  // even though the native DOM already settled synchronously on the last
  // click. If THIS input is no longer actually checked by the time this
  // (possibly deferred) handler finally runs, a *later* click already
  // superseded it — applying this one now would fight live DOM state a
  // more recent native change already set correctly.
  const onNativeChange$ = $((event: Event) => {
    // Upstream always stops propagation here — otherwise the native
    // 'change' event bubbles past this component.
    event.stopPropagation();
    const target = event.target as HTMLInputElement;
    if (!target.checked) return;
    const live = stateSignal.value;
    if (live.standalone) {
      localChecked.value = true;
    } else {
      live.onChange$(props.value, event.timeStamp);
    }
    props.onChange$?.(props.value);
  });

  // Upstream `_onInputClick`: when disabled-but-interactive, prevent the
  // native click's default action (which would otherwise check the input —
  // its `disabled` *attribute* is deliberately withheld in this mode) so
  // the radio visually/functionally stays put. This CANNOT be done from an
  // `onClick$` QRL handler: Qwik's event dispatch always resolves the
  // handler chunk via a (micro)task-deferred `import()`, even when already
  // cached, so by the time a handler body could call `event.preventDefault()`
  // the browser's synchronous native click → checked-toggle default action
  // has already run. `preventdefault:click` is declarative and evaluated
  // by qwikloader's dispatcher *before* it resolves/invokes any handler —
  // exactly the upstream Renderer2-attached-outside-Angular-zone native
  // listener's timing. Known statically at render time (no runtime toggle
  // needed): render it only when this button is disabled-interactive.
  const preventClickDefault = effectiveDisabled && effectiveDisabledInteractive;

  // Upstream `_onTouchTargetClick`: replicates the input's own "become
  // checked" interaction (clicking this larger overlay doesn't naturally
  // check the smaller native input it sits beside) and focuses the input
  // afterward unless disabled (unless disabledInteractive).
  const onTouchTargetClick$ = $((event: Event) => {
    const live = stateSignal.value;
    const liveDisabled = (props.disabled ?? false) || live.disabled;
    const liveChecked = live.standalone ? localChecked.value : live.value === props.value;
    if (!liveChecked && !liveDisabled) {
      if (live.standalone) {
        localChecked.value = true;
      } else {
        live.onChange$(props.value, event.timeStamp);
      }
      props.onChange$?.(props.value);
    }
    const liveDisabledInteractive =
      (props.disabledInteractive ?? config.disabledInteractive ?? false) ||
      live.disabledInteractive;
    if (!liveDisabled || liveDisabledInteractive) {
      inputRef.value?.focus();
    }
  });

  return (
    <mat-radio-button id={id} class={hostClasses}>
      <MatInternalFormField labelPosition={effectiveLabelPosition}>
        <div
          class={
            ['mdc-radio', effectiveDisabled && 'mdc-radio--disabled'].filter(Boolean) as string[]
          }
        >
          {/* Render this element first so the input is on top. */}
          <div
            class="mat-mdc-radio-touch-target"
            aria-hidden="true"
            onClick$={onTouchTargetClick$}
          />
          <input
            ref={inputRef}
            class="mdc-radio__native-control"
            type="radio"
            id={inputId}
            checked={checked}
            disabled={(effectiveDisabled && !effectiveDisabledInteractive) || undefined}
            name={effectiveName}
            value={props.value != null ? String(props.value) : undefined}
            required={effectiveRequired || undefined}
            aria-invalid="false"
            aria-label={props['aria-label']}
            aria-labelledby={props['aria-labelledby']}
            aria-describedby={props['aria-describedby']}
            aria-disabled={effectiveDisabled && effectiveDisabledInteractive ? 'true' : undefined}
            tabIndex={tabIndexValue}
            preventdefault:click={preventClickDefault}
            onChange$={onNativeChange$}
          />
          <div class="mdc-radio__background" aria-hidden="true">
            <div class="mdc-radio__outer-circle" />
            <div class="mdc-radio__inner-circle" />
          </div>
          {/* `mat-ripple` mirrors Angular's bare directive-selector attribute
              (static, no value) left on the rendered DOM; the directive's
              host class `mat-ripple` is included directly since its own
              click-driven ripple animation itself is out of scope (static
              containers only — see button-toggle's SYNC.md deviation #7 for
              the same rationale). The nested `.mat-ripple-element
              .mat-radio-persistent-ripple` div is a literal, always-present
              template element upstream (NOT a transient animated ripple) —
              its visibility is purely CSS-driven by the ancestor's checked
              state. */}
          <div
            {...({'mat-ripple': ''} as Record<string, string>)}
            class="mat-ripple mat-radio-ripple mat-focus-indicator"
            aria-hidden="true"
          >
            <div class="mat-ripple-element mat-radio-persistent-ripple" />
          </div>
        </div>
        <label class="mdc-label" for={inputId}>
          <Slot />
        </label>
      </MatInternalFormField>
    </mat-radio-button>
  );
});
