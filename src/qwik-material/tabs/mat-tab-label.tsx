import {$, component$, type JSXOutput, type QRL} from '@builder.io/qwik';
import {useFocusOrigin} from '@angular-community/qwik-cdk/a11y';

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
  /** Mirrors `_handleClick`: always moves focus; selects only if !disabled. */
  onActivate$: QRL<(index: number, element: HTMLElement) => void>;
}

export const MatTabLabelItem = component$<MatTabLabelItemProps>(props => {
  // Mirrors `cdkMonitorElementFocus` on the same div (upstream's
  // `FocusMonitor`-driven `cdk-focused`/`cdk-keyboard-focused`/etc classes).
  const focusOrigin = useFocusOrigin();

  const onClick$ = $((_event: PointerEvent, element: HTMLElement) => {
    props.onActivate$(props.index, element);
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
      class={classes}
      role="tab"
      id={props.id}
      tabIndex={props.tabIndex}
      aria-posinset={props.posinset}
      aria-setsize={props.setsize}
      aria-controls={props.contentId}
      aria-selected={props.selected ? 'true' : 'false'}
      aria-disabled={props.disabled ? 'true' : 'false'}
      aria-label={props.ariaLabel || undefined}
      aria-labelledby={!props.ariaLabel && props.ariaLabelledby ? props.ariaLabelledby : undefined}
      {...({mattablabelwrapper: '', cdkmonitorelementfocus: ''} as Record<string, string>)}
      onClick$={onClick$}
    >
      <span class="mdc-tab__ripple" />
      <div
        class="mat-ripple mat-mdc-tab-ripple"
        {...({'mat-ripple': ''} as Record<string, string>)}
      />
      <span class="mdc-tab__content">
        <span class="mdc-tab__text-label">{props.labelTemplate ?? props.label}</span>
      </span>
      <span class="mdc-tab-indicator">
        <span class="mdc-tab-indicator__content mdc-tab-indicator__content--underline" />
      </span>
    </div>
  );
});
