/**
 * MatExpansion scenario port from src/material/expansion/expansion.spec.ts
 * + accordion.spec.ts.
 *
 * Upstream is almost entirely TestBed component-rendering + fakeAsync
 * timer-flushing (the ~200ms `mat-expansion-panel-animations-enabled`
 * delay, CSS-transition-driven `afterExpand`/`afterCollapse`) and
 * `@ContentChildren`/`FocusKeyManager` interaction — this package's vitest
 * can't reliably render/interact with real DOM (`createDOM()` hangs; see
 * `qwik-material/button-toggle`'s own scenario-port comment for the same
 * finding). Restructured:
 *
 *   - Live sanity tests: typeof + context ids + prop shapes.
 *   - describe.skip DOM-rendered: structure, toggling, keyboard nav, lazy
 *     content, focus-return-on-close — deferred to the Playwright specs
 *     below (verified via a real browser instead of vitest).
 *
 * Real DOM + behavior assertions live in
 * src/qwik-cdk-parity-tests/specs/material-expansion/angular-parity.spec.ts
 * (the authoritative Angular-vs-Qwik DOM diffing gate).
 */
import {describe, it, expect} from 'vitest';
import {
  MatAccordion,
  MatActionRow,
  MatExpansionPanel,
  MatExpansionPanelContent,
  MatExpansionPanelHeader,
  MatPanelDescription,
  MatPanelTitle,
  MAT_EXPANSION_CONFIG,
  type MatAccordionProps,
  type MatExpansionPanelHeaderProps,
  type MatExpansionPanelProps,
} from './public-api';

describe('qwik-material/expansion surface — sanity', () => {
  it('every component is exported and function-shaped', () => {
    expect(typeof MatAccordion).toBe('function');
    expect(typeof MatExpansionPanel).toBe('function');
    expect(typeof MatExpansionPanelHeader).toBe('function');
    expect(typeof MatPanelTitle).toBe('function');
    expect(typeof MatPanelDescription).toBe('function');
    expect(typeof MatActionRow).toBe('function');
    expect(typeof MatExpansionPanelContent).toBe('function');
  });

  it('MAT_EXPANSION_CONFIG carries the expected context id + empty config accepts {}', () => {
    expect(MAT_EXPANSION_CONFIG.id).toBe('qwik-material/expansion-config');
    expect({}).toBeDefined();
  });

  it('MatAccordionProps accepts the full surface', () => {
    const props: MatAccordionProps = {
      multi: true,
      displayMode: 'flat',
      togglePosition: 'before',
      hideToggle: true,
      class: 'my-accordion',
      id: 'faq',
    };
    expect(props.multi).toBe(true);
  });

  it('MatExpansionPanelProps accepts the full surface, including the two-way-binding QRLs', () => {
    const props: MatExpansionPanelProps = {
      expanded: true,
      onExpandedChange$: undefined,
      onOpened$: undefined,
      onClosed$: undefined,
      onAfterExpand$: undefined,
      onAfterCollapse$: undefined,
      disabled: false,
      hideToggle: false,
      togglePosition: 'after',
      class: 'my-panel',
      id: 'panel-1',
    };
    expect(props.expanded).toBe(true);
  });

  it('MatExpansionPanelHeaderProps accepts the full surface', () => {
    const props: MatExpansionPanelHeaderProps = {
      expandedHeight: '64px',
      collapsedHeight: '32px',
      tabIndex: 0,
      class: 'my-header',
    };
    expect(props.expandedHeight).toBe('64px');
  });
});

describe.skip('MatExpansion DOM-rendered scenarios — verified via Playwright', () => {
  it('MatExpansionPanel renders mat-expansion-panel > [header slot] + content-wrapper(inert when collapsed) > content(role=region) > body + action-row', () => {});
  it('Clicking/Space/Enter-ing an enabled header toggles the panel; a disabled header still gains FocusMonitor classes but never toggles', () => {});
  it('mat-expansion-panel-animations-enabled is added to every panel ~200ms after mount, once, forever (when animations are enabled)', () => {});
  it('MatAccordion with multi=false auto-closes the previously-open panel when a sibling opens; multi=true never does', () => {});
  it('MatAccordion arrow-key/Home/End navigation moves focus between headers with origin "program" (never "keyboard", even though a real keydown triggered it), wrapping on ArrowUp/ArrowDown but not Home/End', () => {});
  it('Closing a panel while focus was inside its body returns focus to the header as cdk-focused cdk-program-focused', () => {});
  it('MatExpansionPanelContent renders nothing until the panel opens for the first time, then stays rendered even after the panel closes again', () => {});
  it("togglePosition falls back from the panel's own prop to the owning MatAccordion's; a standalone panel with neither gets no indicator-position class at all", () => {});
  it('mat-expansion-panel-spacing is only added inside a default-display-mode accordion while expanded; never in a flat-display-mode accordion', () => {});
});
