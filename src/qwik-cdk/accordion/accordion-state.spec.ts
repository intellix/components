import {describe, expect, it} from 'vitest';
import {CDK_ACCORDION_STATE, CDK_ACCORDION_STATE_DEFAULTS} from './accordion-state';

describe('CDK_ACCORDION_STATE', () => {
  it('has the expected context id string', () => {
    expect(CDK_ACCORDION_STATE.id).toBe('qwik-cdk/accordion-state');
  });

  it('CDK_ACCORDION_STATE_DEFAULTS is multi:true (a standalone item can never auto-close) with null broadcasts', () => {
    expect(CDK_ACCORDION_STATE_DEFAULTS.multi).toBe(true);
    expect(CDK_ACCORDION_STATE_DEFAULTS.opened.value).toBeNull();
    expect(CDK_ACCORDION_STATE_DEFAULTS.openCloseAll.value).toBeNull();
  });
});
