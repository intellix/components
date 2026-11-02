import {describe, expect, it} from 'vitest';
import {MAT_ACCORDION_STATE, type MatAccordionState} from './accordion-state';

describe('MAT_ACCORDION_STATE', () => {
  it('has the expected context id string', () => {
    expect(MAT_ACCORDION_STATE.id).toBe('qwik-material/accordion-state');
  });

  it('MatAccordionState accepts a well-formed object', () => {
    const state: MatAccordionState = {
      multi: true,
      displayMode: 'flat',
      togglePosition: 'before',
      hideToggle: false,
    };
    expect(state.multi).toBe(true);
    expect(state.displayMode).toBe('flat');
  });
});
