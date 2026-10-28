import {$, component$, Slot, useContext} from '@builder.io/qwik';
import {useFocusOrigin} from '@angular-community/qwik-cdk/a11y';
import {type MatExpansionConfig, MAT_EXPANSION_CONFIG} from './expansion-config';
import {MAT_EXPANSION_PANEL_STATE, MAT_EXPANSION_PANEL_STATE_DEFAULTS} from './panel-state';

/**
 * Props for `<MatExpansionPanelHeader>`. Must be rendered with
 * `q:slot="header"` inside a `<MatExpansionPanel>` — see that component's
 * doc comment. Reads the panel's state via `MAT_EXPANSION_PANEL_STATE`
 * context (no direct props/children relationship, same reason as the
 * slot-based projection).
 */
export interface MatExpansionPanelHeaderProps {
  /** Height while the owning panel is expanded. Falls back to
   *  `MatExpansionConfig.expandedHeight`. */
  expandedHeight?: string;
  /** Height while the owning panel is collapsed. Falls back to
   *  `MatExpansionConfig.collapsedHeight`. */
  collapsedHeight?: string;
  /** Tab index when the panel isn't disabled (disabled always renders
   *  `-1`, regardless of this). Default 0. */
  tabIndex?: number;
  class?: string | ReadonlyArray<string>;
}

const CONFIG_DEFAULTS: MatExpansionConfig = {};

function hasModifierKey(event: KeyboardEvent): boolean {
  return event.altKey || event.ctrlKey || event.metaKey || event.shiftKey;
}

/**
 * Qwik port of `MatExpansionPanelHeader`
 * (`src/material/expansion/expansion-panel-header.ts` +
 * `expansion-panel-header.html`).
 */
export const MatExpansionPanelHeader = component$<MatExpansionPanelHeaderProps>(props => {
  const config = useContext(MAT_EXPANSION_CONFIG, CONFIG_DEFAULTS);
  const panel = useContext(MAT_EXPANSION_PANEL_STATE, {
    value: MAT_EXPANSION_PANEL_STATE_DEFAULTS,
  });

  // `useFocusOrigin()`'s lazy focusin/pointerdown listeners double as the
  // upstream `FocusMonitor` subscription that gives a focused header
  // `cdk-focused`/`cdk-keyboard-focused`/etc — including when the header
  // itself is disabled (tabindex="-1" only removes it from the Tab order,
  // it doesn't block mouse/programmatic focus — see angular-parity.spec.ts's
  // "disabled" behavior note).
  const focusOrigin = useFocusOrigin();

  const expandedHeight = props.expandedHeight ?? config.expandedHeight;
  const collapsedHeight = props.collapsedHeight ?? config.collapsedHeight;

  const onClick$ = $(() => {
    const ctx = panel.value;
    if (!ctx.disabled) {
      ctx.setExpanded$(!ctx.expanded);
    }
  });

  const onKeyDown$ = $((event: KeyboardEvent) => {
    if ((event.key === ' ' || event.key === 'Enter') && !hasModifierKey(event)) {
      event.preventDefault();
      const ctx = panel.value;
      if (!ctx.disabled) {
        ctx.setExpanded$(!ctx.expanded);
      }
    }
    // Every other key is left to bubble, unhandled, to MatAccordion's own
    // keydown listener (arrow-key/Home/End navigation) — mirrors
    // upstream's `_keydown()` default case delegating to
    // `panel.accordion._handleHeaderKeydown(event)`.
  });

  const ctx = panel.value;
  const isExpanded = ctx.expanded;
  const showToggle = !ctx.hideToggle && !ctx.disabled;
  const height = isExpanded ? expandedHeight : collapsedHeight;

  const classes = [
    'mat-expansion-panel-header',
    'mat-focus-indicator',
    isExpanded && 'mat-expanded',
    ctx.togglePosition === 'after' && 'mat-expansion-toggle-indicator-after',
    ctx.togglePosition === 'before' && 'mat-expansion-toggle-indicator-before',
    focusOrigin.value && 'cdk-focused',
    focusOrigin.value === 'touch' && 'cdk-touch-focused',
    focusOrigin.value === 'keyboard' && 'cdk-keyboard-focused',
    focusOrigin.value === 'mouse' && 'cdk-mouse-focused',
    focusOrigin.value === 'program' && 'cdk-program-focused',
    props.class,
  ].filter(Boolean) as string[];

  return (
    <mat-expansion-panel-header
      ref={ctx.headerElRef}
      id={ctx.headerId}
      class={classes}
      role="button"
      tabIndex={ctx.disabled ? -1 : (props.tabIndex ?? 0)}
      aria-controls={ctx.contentId}
      aria-expanded={isExpanded ? 'true' : 'false'}
      aria-disabled={ctx.disabled ? 'true' : 'false'}
      style={height ? {height} : undefined}
      onClick$={onClick$}
      onKeyDown$={onKeyDown$}
    >
      <span
        class={
          ['mat-content', !showToggle && 'mat-content-hide-toggle'].filter(Boolean) as string[]
        }
      >
        <Slot name="title" />
        <Slot name="description" />
        <Slot />
      </span>
      {showToggle && (
        <span class="mat-expansion-indicator">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 -960 960 960"
            aria-hidden="true"
            focusable="false"
          >
            <path d="M480-345 240-585l56-56 184 184 184-184 56 56-240 240Z" />
          </svg>
        </span>
      )}
    </mat-expansion-panel-header>
  );
});
