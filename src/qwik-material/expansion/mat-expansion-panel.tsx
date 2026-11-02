import {
  component$,
  Slot,
  useContext,
  useContextProvider,
  useSignal,
  useTask$,
  useVisibleTask$,
  type QRL,
} from '@qwik.dev/core';
import {isBrowser} from '@qwik.dev/core/build';
import {useCdkAccordionItem} from '@angular-community/qwik-cdk/accordion';
import {focusVia, useIdGenerator} from '@angular-community/qwik-cdk/a11y';
import {useAnimationsDisabled} from '../dialog/use-animations-disabled';
import {MAT_ACCORDION_STATE, type MatAccordionTogglePosition} from './accordion-state';
import {type MatExpansionConfig, MAT_EXPANSION_CONFIG} from './expansion-config';
import {MAT_EXPANSION_PANEL_STATE, type MatExpansionPanelState} from './panel-state';

/**
 * Props for `<MatExpansionPanel>`. Controlled component (design spec: "API
 * stays migration-friendly") — the consumer owns `expanded` via a signal +
 * `onExpandedChange$`, mirroring upstream's two-way-bindable `expanded`
 * `@Input`/`@Output` pair (`[(expanded)]`).
 *
 * Its header/title/description/action-row/lazy-content are passed as
 * `q:slot`-tagged children, not plain nested JSX: upstream's template
 * (`expansion-panel.html`) projects the header BEFORE a content wrapper
 * that itself wraps the body content and THEN the action row — reordering
 * by selector that Qwik's `<Slot>` only supports via named slots authored
 * at each child's call site (same approach as `qwik-material/card`'s
 * `MatCardHeader`/`MatCardTitleGroup` and `qwik-material/list`'s
 * `MatListItem` — see their own doc comments). Consumer example:
 *
 * ```tsx
 * <MatExpansionPanel expanded={expanded.value} onExpandedChange$={(v) => (expanded.value = v)}>
 *   <MatExpansionPanelHeader q:slot="header">
 *     <MatPanelTitle q:slot="title">Personal data</MatPanelTitle>
 *   </MatExpansionPanelHeader>
 *   <p>Body content — default slot.</p>
 *   <MatActionRow q:slot="actionRow">
 *     <button type="button">Cancel</button>
 *   </MatActionRow>
 * </MatExpansionPanel>
 * ```
 */
export interface MatExpansionPanelProps {
  /** Current expanded state. Default false. */
  expanded?: boolean;
  /** Fires on every expansion-state change (the two-way-binding half of
   *  `[(expanded)]`). */
  onExpandedChange$?: QRL<(expanded: boolean) => void>;
  /** Fires after the panel opens. */
  onOpened$?: QRL<() => void>;
  /** Fires after the panel closes. */
  onClosed$?: QRL<() => void>;
  /** Fires once the body's expansion transition finishes (or immediately,
   *  if animations are disabled). */
  onAfterExpand$?: QRL<() => void>;
  /** Fires once the body's collapse transition finishes. */
  onAfterCollapse$?: QRL<() => void>;
  /** Whether the panel can be toggled at all. Default false. */
  disabled?: boolean;
  /** Whether the expansion indicator should be hidden. Falls back to the
   *  owning `MatAccordion`'s `hideToggle`, then `MatExpansionConfig`'s,
   *  then false. */
  hideToggle?: boolean;
  /** Position of the expansion indicator. Falls back to the owning
   *  `MatAccordion`'s `togglePosition`; `undefined` (no class) for a
   *  standalone panel that sets neither. */
  togglePosition?: MatAccordionTogglePosition;
  class?: string | ReadonlyArray<string>;
  id?: string;
}

const CONFIG_DEFAULTS: MatExpansionConfig = {};

/**
 * Qwik port of `MatExpansionPanel` (`src/material/expansion/expansion-panel.ts`
 * + `expansion-panel.html`), layered on `qwik-cdk/accordion`'s
 * `useCdkAccordionItem()` for expanded/disabled state + the
 * unique-selection auto-close.
 */
export const MatExpansionPanel = component$<MatExpansionPanelProps>(props => {
  const config = useContext(MAT_EXPANSION_CONFIG, CONFIG_DEFAULTS);
  // MatAccordion provides this; absent (undefined) for a standalone panel —
  // see accordion-state.ts's doc comment for why that distinction matters.
  const accordion = useContext(MAT_ACCORDION_STATE, {value: undefined});
  const animationsDisabled = useAnimationsDisabled();

  const idGen = useIdGenerator();
  // Lazy initializer — runs exactly once, mirroring upstream's
  // `_headerId = inject(_IdGenerator).getId(...)` field initializer.
  const headerId = useSignal(() => idGen.getId('mat-expansion-panel-header-'));

  // `props` is passed straight through (not destructured first) so the
  // reactive tasks `useCdkAccordionItem` registers always read the LIVE
  // current prop values — see that hook's own doc comment.
  const item = useCdkAccordionItem(props);

  const disabled = props.disabled ?? false;
  const expanded = props.expanded ?? false;
  // Upstream: `this._hideToggle || (this.accordion && this.accordion.hideToggle)`,
  // with `_hideToggle` itself defaulting from `MAT_EXPANSION_PANEL_DEFAULT_OPTIONS`
  // at construction, overridden by an explicit `[hideToggle]` input.
  const ownHideToggle = props.hideToggle ?? config.hideToggle ?? false;
  const hideToggle = ownHideToggle || (accordion.value?.hideToggle ?? false);
  // Upstream: `this._togglePosition || (this.accordion && this.accordion.togglePosition)`.
  const togglePosition = props.togglePosition ?? accordion.value?.togglePosition;
  // Upstream `_hasSpacing()`: only true inside a 'default'-display-mode accordion.
  const hasSpacing =
    accordion.value !== undefined ? expanded && accordion.value.displayMode === 'default' : false;

  const headerElRef = useSignal<HTMLElement>();
  const hasEverOpened = useSignal(expanded);
  const bodyWrapperRef = useSignal<HTMLElement>();
  const contentRegionRef = useSignal<HTMLElement>();

  const state: MatExpansionPanelState = {
    expanded,
    disabled,
    hideToggle,
    togglePosition,
    headerId: headerId.value,
    contentId: item.id,
    setExpanded$: item.setExpanded$,
    headerElRef,
    hasEverOpened,
  };
  const stateSignal = useSignal<MatExpansionPanelState>(state);
  stateSignal.value = state;
  useContextProvider(MAT_EXPANSION_PANEL_STATE, stateSignal);

  // Lazy content (`<MatExpansionPanelContent q:slot="...">`, if the
  // consumer uses it) renders once the panel opens for the first time and
  // then stays rendered — mirrors `ngAfterContentInit`'s
  // `opened.pipe(startWith(null), filter(() => expanded && !portal), take(1))`.
  useTask$(({track}) => {
    if (track(() => props.expanded ?? false)) {
      hasEverOpened.value = true;
    }
  });

  // "Closing a panel while focus was inside its body moves focus back to
  // the header, via FocusMonitor.focusVia(header, 'program')" — mirrors
  // `panel.closed.pipe(filter(() => panel._containsFocus()))` in
  // `MatExpansionPanelHeader`'s constructor, reframed as a reactive task on
  // the SAME `expanded` transition (true → false) that drives `closed`.
  const wasExpanded = useSignal(expanded);
  useTask$(({track}) => {
    const isExpanded = track(() => props.expanded ?? false);
    const closedJustNow = wasExpanded.value && !isExpanded;
    wasExpanded.value = isExpanded;
    if (!closedJustNow || !isBrowser) return;
    const contentEl = contentRegionRef.value;
    const headerEl = headerElRef.value;
    if (!contentEl || !headerEl) return;
    const active = document.activeElement;
    if (active === contentEl || (active && contentEl.contains(active))) {
      focusVia(headerEl, 'program');
    }
  });

  // `mat-expansion-panel-animations-enabled` is added ~200ms after init,
  // one time, forever — mirrors `_setupAnimationEvents()`'s `setTimeout`
  // (only when animations are enabled). This is a rare, explicitly-sanctioned
  // exception to "no per-instance useVisibleTask$" (design doc): there is no
  // user interaction to lazily hang this on — upstream flips the class
  // unconditionally after a delay, with zero clicks. Kept cheap: one timer,
  // one classList-equivalent signal flip, plus (free, same task) the
  // `transitionend` listener backing `onAfterExpand$`/`onAfterCollapse$`.
  const animationsEnabled = useSignal(false);
  useVisibleTask$(({cleanup}) => {
    if (animationsDisabled.value) return;
    const timer = setTimeout(() => {
      animationsEnabled.value = true;
    }, 200);
    cleanup(() => clearTimeout(timer));

    const wrapper = bodyWrapperRef.value;
    if (!wrapper) return;
    const onTransitionEnd = (event: TransitionEvent) => {
      if (event.target !== wrapper || event.propertyName !== 'grid-template-rows') return;
      if (props.expanded) {
        props.onAfterExpand$?.();
      } else {
        props.onAfterCollapse$?.();
      }
    };
    wrapper.addEventListener('transitionend', onTransitionEnd);
    cleanup(() => wrapper.removeEventListener('transitionend', onTransitionEnd));
  });

  const classes = [
    'mat-expansion-panel',
    expanded && 'mat-expanded',
    hasSpacing && 'mat-expansion-panel-spacing',
    animationsEnabled.value && 'mat-expansion-panel-animations-enabled',
    props.class,
  ].filter(Boolean) as string[];

  return (
    <mat-expansion-panel id={props.id} class={classes}>
      <Slot name="header" />
      <div
        ref={bodyWrapperRef}
        class="mat-expansion-panel-content-wrapper"
        inert={!expanded || undefined}
      >
        <div
          ref={contentRegionRef}
          class="mat-expansion-panel-content"
          role="region"
          id={item.id}
          aria-labelledby={headerId.value}
        >
          <div class="mat-expansion-panel-body">
            <Slot />
          </div>
          <Slot name="actionRow" />
        </div>
      </div>
    </mat-expansion-panel>
  );
});
