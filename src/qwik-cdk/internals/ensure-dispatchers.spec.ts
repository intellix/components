import {describe, expect, it} from 'vitest';
import {ensureCdkDispatchers} from './ensure-dispatchers';
import type {QwikCdkInternals} from './internals';

describe('ensureCdkDispatchers', () => {
  it('creates the dispatchers when <QwikCdkRoot> has not yet run its task', () => {
    const internals = {} as QwikCdkInternals;
    const {keyboardDispatcher, outsideClickDispatcher} = ensureCdkDispatchers(internals);
    expect(keyboardDispatcher).toBeDefined();
    expect(outsideClickDispatcher).toBeDefined();
    expect(internals.keyboardDispatcher).toBe(keyboardDispatcher);
    expect(internals.dialogScrollStrategyFactory).toBeDefined();
  });

  it('reuses existing dispatchers', () => {
    const internals = {} as QwikCdkInternals;
    const first = ensureCdkDispatchers(internals);
    const second = ensureCdkDispatchers(internals);
    expect(second.keyboardDispatcher).toBe(first.keyboardDispatcher);
    expect(second.outsideClickDispatcher).toBe(first.outsideClickDispatcher);
  });
});
