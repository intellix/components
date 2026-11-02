import {describe, expect, it} from 'vitest';
import {
  MAT_EXPANSION_PANEL_STATE,
  MAT_EXPANSION_PANEL_STATE_DEFAULTS,
  type MatExpansionPanelState,
} from './panel-state';

describe('MAT_EXPANSION_PANEL_STATE', () => {
  it('has the expected context id string', () => {
    expect(MAT_EXPANSION_PANEL_STATE.id).toBe('qwik-material/expansion-panel-state');
  });

  it('MAT_EXPANSION_PANEL_STATE_DEFAULTS has sensible inert values', () => {
    expect(MAT_EXPANSION_PANEL_STATE_DEFAULTS.expanded).toBe(false);
    expect(MAT_EXPANSION_PANEL_STATE_DEFAULTS.disabled).toBe(false);
    expect(MAT_EXPANSION_PANEL_STATE_DEFAULTS.hideToggle).toBe(false);
    expect(MAT_EXPANSION_PANEL_STATE_DEFAULTS.togglePosition).toBeUndefined();
    expect(MAT_EXPANSION_PANEL_STATE_DEFAULTS.headerElRef.value).toBeUndefined();
    expect(MAT_EXPANSION_PANEL_STATE_DEFAULTS.hasEverOpened.value).toBe(false);
    expect(typeof MAT_EXPANSION_PANEL_STATE_DEFAULTS.setExpanded$).toBe('function');
  });

  it('DEFAULTS.setExpanded$ is a no-op that does not throw when invoked', async () => {
    await expect(MAT_EXPANSION_PANEL_STATE_DEFAULTS.setExpanded$(true)).resolves.toBeUndefined();
  });

  it('MatExpansionPanelState accepts a well-formed object', () => {
    const state: MatExpansionPanelState = {
      expanded: true,
      disabled: false,
      hideToggle: false,
      togglePosition: 'after',
      headerId: 'mat-expansion-panel-header-0',
      contentId: 'cdk-accordion-child-0',
      setExpanded$: MAT_EXPANSION_PANEL_STATE_DEFAULTS.setExpanded$,
      headerElRef: {value: undefined} as MatExpansionPanelState['headerElRef'],
      hasEverOpened: {value: true} as MatExpansionPanelState['hasEverOpened'],
    };
    expect(state.expanded).toBe(true);
    expect(state.togglePosition).toBe('after');
  });
});
