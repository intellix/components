import {describe, it, expect} from 'vitest';
import {
  isBuiltinScrollStrategyDescriptor,
  resolveBuiltinScrollStrategyDescriptor,
  resolveScrollStrategyDescriptor,
  isScrollStrategyInstance,
  resolveConfiguredScrollStrategy,
} from '../public-api';
import type {ScrollStrategy} from '../public-api';

function makeFakeScrollStrategy(): ScrollStrategy {
  return {
    attach() {},
    enable() {},
    disable() {},
  };
}

describe('isBuiltinScrollStrategyDescriptor', () => {
  it('is true for the bare string forms', () => {
    expect(isBuiltinScrollStrategyDescriptor('noop')).toBe(true);
    expect(isBuiltinScrollStrategyDescriptor('block')).toBe(true);
  });

  it('is true for the object forms', () => {
    expect(isBuiltinScrollStrategyDescriptor({type: 'reposition'})).toBe(true);
    expect(isBuiltinScrollStrategyDescriptor({type: 'close', threshold: 10})).toBe(true);
  });

  it('is false for a QRL (a plain function, no "type" field)', () => {
    const qrlLike = (() => makeFakeScrollStrategy()) as any;
    expect(isBuiltinScrollStrategyDescriptor(qrlLike)).toBe(false);
  });
});

describe('resolveBuiltinScrollStrategyDescriptor', () => {
  it('builds a noop strategy from the bare string', () => {
    const strategy = resolveBuiltinScrollStrategyDescriptor('noop');
    expect(typeof strategy.enable).toBe('function');
  });

  it('builds a block strategy from the bare string', () => {
    const strategy = resolveBuiltinScrollStrategyDescriptor('block');
    expect(typeof strategy.enable).toBe('function');
  });

  it('builds a reposition strategy, forwarding config fields', () => {
    const strategy = resolveBuiltinScrollStrategyDescriptor({
      type: 'reposition',
      scrollThrottle: 20,
    });
    expect(typeof strategy.enable).toBe('function');
  });

  it('builds a close strategy, forwarding config fields', () => {
    const strategy = resolveBuiltinScrollStrategyDescriptor({type: 'close', threshold: 5});
    expect(typeof strategy.enable).toBe('function');
  });

  it('object forms without extra config fields also work', () => {
    expect(() => resolveBuiltinScrollStrategyDescriptor({type: 'noop'})).not.toThrow();
    expect(() => resolveBuiltinScrollStrategyDescriptor({type: 'block'})).not.toThrow();
  });
});

describe('resolveScrollStrategyDescriptor', () => {
  it('resolves a builtin descriptor without ever calling a QRL', async () => {
    const strategy = await resolveScrollStrategyDescriptor('block');
    expect(typeof strategy.enable).toBe('function');
  });

  it('awaits and calls a QRL (fully-custom escape hatch)', async () => {
    const custom = makeFakeScrollStrategy();
    let calls = 0;
    const qrlLike = (async () => {
      calls++;
      return custom;
    }) as any;
    const strategy = await resolveScrollStrategyDescriptor(qrlLike);
    expect(strategy).toBe(custom);
    expect(calls).toBe(1);
  });
});

describe('isScrollStrategyInstance', () => {
  it('is true for a real ScrollStrategy instance', () => {
    expect(isScrollStrategyInstance(makeFakeScrollStrategy())).toBe(true);
  });

  it('is false for a descriptor string', () => {
    expect(isScrollStrategyInstance('block')).toBe(false);
  });

  it('is false for a descriptor object (has "type", not "enable"/"disable")', () => {
    expect(isScrollStrategyInstance({type: 'block'} as any)).toBe(false);
  });

  it('is false for undefined', () => {
    expect(isScrollStrategyInstance(undefined)).toBe(false);
  });
});

describe('resolveConfiguredScrollStrategy', () => {
  it('returns the per-call instance unchanged when one is given', async () => {
    const instance = makeFakeScrollStrategy();
    const resolved = await resolveConfiguredScrollStrategy(instance, 'block');
    expect(resolved).toBe(instance);
  });

  it('resolves a per-call descriptor, ignoring the context default', async () => {
    const resolved = await resolveConfiguredScrollStrategy('noop', 'block');
    expect(typeof resolved.enable).toBe('function');
  });

  it('falls back to the context default descriptor when no per-call override is given', async () => {
    const resolved = await resolveConfiguredScrollStrategy(undefined, {
      type: 'reposition',
      scrollThrottle: 20,
    });
    expect(typeof resolved.enable).toBe('function');
  });
});
