import {$, component$, useSignal, useTask$, type JSXOutput, type QRL} from '@qwik.dev/core';
import {useFocusOrigin} from '@angular-community/qwik-cdk/a11y';
import {useAnimationsDisabled} from '../dialog/use-animations-disabled';
import {handleRippleEvent, rippleAnimationConfig} from '../core/ripple/ripple-dom';
import {cloneJsxForReuse} from '../core/jsx-reuse';

/**
 * Internal per-tab header item — `src/material/tabs/tab-header.html`'s
 * `@for` body (a `.mdc-tab` div wearing the `matTabLabelWrapper`/
 * `cdkMonitorElementFocus` directives) + the ink-bar `<span
 * class="mdc-tab-indicator">` that `InkBarItem.ngOnInit` appends as the
 * element's last child (see `../../material/tabs/ink-bar.ts`): rendered
 * directly here instead, since it's deterministic and always present
 * (angular-parity.spec.ts note 2) — no need to mirror the imperative
 * `document.createElement`. The transient FLIP-animation inline `transform`
 * on `.mdc-tab-indicator__content--underline` is skipped entirely: it's set
 * and cleared SYNCHRONOUSLY within the same click handler, never observable
 * after even one animation frame (note 2), so no parity snapshot can ever
 * see it.
 *
 * Not exported from the public API — only `MatTabGroup` renders these, from
 * its `tabs` prop (see that component's doc comment for why tabs are a
 * data array rather than nested `<MatTab>` children).
 */
export interface MatTabLabelItemProps {
  index: number;
  id: string;
  contentId: string;
  selected: boolean;
  disabled: boolean;
  /** Roving tabindex — 0 for the one focusable tab, -1 for every other. */
  tabIndex: number;
  posinset: number;
  setsize: number;
  ariaLabel?: string;
  ariaLabelledby?: string;
  labelClass?: string | ReadonlyArray<string>;
  label?: string;
  labelTemplate?: JSXOutput;
  /** Mirrors `tab-group.html`'s `[matRippleDisabled]="tab.disabled || disableRipple"`
   *  — pre-combined by the caller (mirrors the `disabledFlags` precomputation
   *  `MatTabGroup` already does for this same per-tab `disabled`). */
  rippleDisabled: boolean;
  /** Mirrors `_handleClick`: always moves focus; selects only if !disabled. */
  onActivate$: QRL<(index: number, element: HTMLElement) => void>;
}

export const MatTabLabelItem = component$<MatTabLabelItemProps>(props => {
  // Mirrors `cdkMonitorElementFocus` on the same div (upstream's
  // `FocusMonitor`-driven `cdk-focused`/`cdk-keyboard-focused`/etc classes).
  const focusOrigin = useFocusOrigin();
  const animationsDisabled = useAnimationsDisabled();
  const rippleContainerRef = useSignal<HTMLElement>();
  const hostRef = useSignal<HTMLElement>();

  // Qwik v2 regression, TWO layers deep:
  //
  // (1) A plain `tabIndex={props.tabIndex}` JSX prop only gets re-applied
  //     to the DOM when THIS component happens to re-render, and
  //     `useFocusOrigin()`'s `focusin` listener (above) causes exactly
  //     such an unrelated re-render — on EVERY roving-tabindex move, not
  //     just a real click: `MatTabGroup.onKeyDown$`/`onActivate$` write
  //     the new `focusIndex` signal and SYNCHRONOUSLY call `.focus()` on
  //     the target tab in the very same handler, so the native `focusin`
  //     (and this component's own deferred reaction to it) can resolve
  //     before the PARENT's re-render has had a chance to pass the new
  //     `tabIndex` prop down. Same category as `qwik-material/radio/
  //     mat-radio-button.tsx`'s `checkedSig` fix (see its big doc comment)
  //     — tracking `props.tabIndex` from a `useTask$` and writing it
  //     imperatively, decoupled from this component's general re-render
  //     cycle, fixes this layer.
  // (2) Mirroring `checkedSig` EXACTLY — i.e. also reading the tracked
  //     signal back with a BARE `tabIndexSig.value` JSX expression, so
  //     SSR still gets it (the task's own property write has no effect on
  //     the serialized HTML — a mock server element, same gap
  //     `mat-checkbox.tsx`'s `checked`/`indeterminate` comment documents)
  //     — surfaces a SECOND, different v2 bug specific to `tabIndex`
  //     (`checked` is immune: it's one of a handful of names core
  //     special-cases as a boolean DOM property, see `isBooleanAttr`,
  //     which never reaches the code path below). A bare `sig.value` JSX
  //     attribute expression gets hoisted into its own dedicated
  //     subscription, bypassing the component's regular per-render
  //     attribute diff for that one prop — but the diff's OWN "remove
  //     attributes no longer in this render's props" cleanup pass doesn't
  //     know about that hoisted prop, and v2 never normalizes its
  //     case-mismatched bookkeeping for it either (SSR serializes the
  //     literal JSX casing `tabIndex="0"`; the browser parses/stores HTML
  //     attribute names as lowercase `tabindex`; that normalization only
  //     happens inside the very attribute-diff loop the hoisted prop now
  //     bypasses). Confirmed live: ANY unrelated re-render of this
  //     component (e.g. `focusOrigin` again, or `aria-selected` changing)
  //     removes the `tabindex` attribute outright. Fixed by reading the
  //     signal into a plain local first and using THAT identifier in JSX
  //     — syntactically no longer a bare `sig.value` access, so the
  //     optimizer does not hoist it, and it goes through the regular
  //     per-render diff on every render (always included, always
  //     correctly cased) like any other plain prop — while still being
  //     correct on every one of those renders because the underlying
  //     SIGNAL itself (not a per-render recompute) is what the `useTask$`
  //     keeps correctly in sync, decoupled from unrelated re-renders.
  const tabIndexSig = useSignal(() => props.tabIndex);
  useTask$(({track}) => {
    const value = track(() => props.tabIndex);
    tabIndexSig.value = value;
    const el = hostRef.value;
    if (el) el.tabIndex = value;
  });
  const tabIndexValue = tabIndexSig.value;

  const onClick$ = $((_event: PointerEvent, element: HTMLElement) => {
    props.onActivate$(props.index, element);
  });

  // Upstream `tab-group.html`: `[matRippleTrigger]="tabNode"` — `#tabNode`
  // is this very element (this component's own host div), not just the
  // inner `.mat-mdc-tab-ripple` div. ONE shared `$()` reference wired to
  // all six pointer events — see `core/ripple/ripple-renderer.ts`'s module
  // doc comment for why that's required, not just tidy (cross-chunk QRL
  // ordering on a cold chunk).
  const rippleEvent$ = $((event: MouseEvent | TouchEvent) => {
    handleRippleEvent(event, rippleContainerRef.value, {
      rippleDisabled: props.rippleDisabled,
      rippleConfig: {animation: rippleAnimationConfig(animationsDisabled.value)},
    });
  });

  const classes = [
    'mdc-tab',
    'mat-mdc-tab',
    'mat-focus-indicator',
    props.selected && 'mdc-tab--active',
    // Same condition as `mdc-tab--active` — the ink bar's active class
    // lives on this same host element (angular-parity.spec.ts note 2).
    props.selected && 'mdc-tab-indicator--active',
    props.disabled && 'mat-mdc-tab-disabled',
    focusOrigin.value && 'cdk-focused',
    focusOrigin.value === 'touch' && 'cdk-touch-focused',
    focusOrigin.value === 'keyboard' && 'cdk-keyboard-focused',
    focusOrigin.value === 'mouse' && 'cdk-mouse-focused',
    focusOrigin.value === 'program' && 'cdk-program-focused',
    props.labelClass,
  ].filter(Boolean) as string[];

  return (
    <div
      ref={hostRef}
      class={classes}
      role="tab"
      id={props.id}
      tabIndex={tabIndexValue}
      aria-posinset={props.posinset}
      aria-setsize={props.setsize}
      aria-controls={props.contentId}
      aria-selected={props.selected ? 'true' : 'false'}
      aria-disabled={props.disabled ? 'true' : 'false'}
      aria-label={props.ariaLabel || undefined}
      aria-labelledby={!props.ariaLabel && props.ariaLabelledby ? props.ariaLabelledby : undefined}
      {...({mattablabelwrapper: '', cdkmonitorelementfocus: ''} as Record<string, string>)}
      onClick$={onClick$}
      onMouseDown$={rippleEvent$}
      onMouseUp$={rippleEvent$}
      onMouseLeave$={rippleEvent$}
      onTouchStart$={rippleEvent$}
      onTouchEnd$={rippleEvent$}
      onTouchCancel$={rippleEvent$}
    >
      <span class="mdc-tab__ripple" />
      <div
        ref={rippleContainerRef}
        class="mat-ripple mat-mdc-tab-ripple"
        {...({'mat-ripple': ''} as Record<string, string>)}
      />
      <span class="mdc-tab__content">
        {/* `cloneJsxForReuse`: this item re-renders on its own selected/focus-state signal
            changes (roving tabindex, ripple, focus-origin tracking) — rendering the SAME static
            `props.labelTemplate` JSXOutput object again on that re-render corrupts it, the same
            documented Qwik v2 issue menu-panel.tsx/mat-menu-item.tsx already work around (see
            qwik-material/menu/SYNC.md). Confirmed live: a custom `labelTemplate` tab's icon text
            went empty after switching tabs (the second render of the OTHER, now-selected tab's
            label). */}
        <span class="mdc-tab__text-label">
          {props.labelTemplate ? cloneJsxForReuse(props.labelTemplate) : props.label}
        </span>
      </span>
      <span class="mdc-tab-indicator">
        <span class="mdc-tab-indicator__content mdc-tab-indicator__content--underline" />
      </span>
    </div>
  );
});
