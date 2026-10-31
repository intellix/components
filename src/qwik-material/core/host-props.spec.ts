import {describe, it, expect, vi} from 'vitest';
import type {QRL, Signal} from '@builder.io/qwik';
import {callHostHandler, extraHostAttrs, mergeHostProps, type HostHandler} from './host-props';

/** A plain function, cast to the `QRL<...>` shape these helpers expect —
 *  sufficient for testing the merge/compose LOGIC, which only ever calls a
 *  handler as a function; it never relies on any other QRL-specific
 *  behaviour (lazy chunk loading, serialization, …). */
function qrl<T extends (...args: never[]) => unknown>(fn: T): QRL<T> {
  return fn as unknown as QRL<T>;
}

function fakeSignal<T>(value: T): Signal<T> {
  return {value} as Signal<T>;
}

describe('mergeHostProps', () => {
  it('returns an equivalent (defensive-copy) bag for a single part', () => {
    const merged = mergeHostProps({class: ['a'], id: 'x'});
    expect(merged.class).toEqual(['a']);
    expect(merged.id).toBe('x');
  });

  it('skips undefined/null parts', () => {
    expect(mergeHostProps(undefined, null, {id: 'x'})).toEqual({id: 'x'});
  });

  it('concatenates classes across parts, flattening strings and arrays', () => {
    const merged = mergeHostProps({class: 'a'}, {class: ['b', 'c']}, {class: undefined});
    expect(merged.class).toEqual(['a', 'b', 'c']);
  });

  it('composes same-named event handlers into one array (both run, in argument order)', async () => {
    const calls: string[] = [];
    const a = qrl(() => void calls.push('a'));
    const b = qrl(() => void calls.push('b'));
    const merged = mergeHostProps({onClick$: a}, {onClick$: b});
    expect(Array.isArray(merged.onClick$)).toBe(true);
    const handlers = merged.onClick$ as unknown as Array<() => void>;
    for (const h of handlers) h();
    expect(calls).toEqual(['a', 'b']);
  });

  it('flattens nested handler arrays from a part that already composed multiple', () => {
    const calls: string[] = [];
    const a = qrl(() => void calls.push('a'));
    const b = qrl(() => void calls.push('b'));
    const c = qrl(() => void calls.push('c'));
    const merged = mergeHostProps({onClick$: [a, b] as unknown as HostHandler}, {onClick$: c});
    const handlers = merged.onClick$ as unknown as Array<() => void>;
    expect(handlers).toHaveLength(3);
    for (const h of handlers) h();
    expect(calls).toEqual(['a', 'b', 'c']);
  });

  it('returns a single handler unwrapped (not a 1-element array) when only one part sets it', () => {
    const a = qrl(() => {});
    const merged = mergeHostProps({onClick$: a}, {class: 'x'});
    expect(merged.onClick$).toBe(a);
  });

  it('merges arbitrary attributes with later-defined-wins semantics', () => {
    const merged = mergeHostProps(
      {'aria-haspopup': 'menu', 'aria-expanded': 'false'},
      {'aria-expanded': 'true', 'aria-controls': undefined},
    );
    expect(merged['aria-haspopup']).toBe('menu');
    // Later part's defined value wins.
    expect(merged['aria-expanded']).toBe('true');
    // An undefined value from a later part never clobbers an earlier real one.
    expect(merged['aria-controls']).toBeUndefined();
  });

  it('keeps a mentioned-but-undefined key PRESENT on the merged object, not just undefined-valued', () => {
    // Regression test: Qwik's client-side reconciler only reliably removes
    // an attribute whose JSX prop key is a stable, always-present object
    // key that transitions to `undefined` across renders — a key that's
    // sometimes fully ABSENT from the spread object and sometimes present
    // (e.g. a naive merge that does `if (value !== undefined) merged[key]
    // = value`) can leave a stale attribute in the live DOM (confirmed live:
    // `aria-controls` surviving a menu close through `useMatMenuTrigger()`
    // before this was fixed). `'key' in merged` must stay true even when
    // every contributing part's value for it is `undefined`.
    const merged = mergeHostProps({'aria-controls': undefined});
    expect('aria-controls' in merged).toBe(true);
    expect(merged['aria-controls']).toBeUndefined();
  });

  it('composes refs so every part that needs the live element gets it', () => {
    const sigA = fakeSignal<Element | undefined>(undefined);
    let elForB: Element | undefined;
    const refB = (el: Element) => {
      elForB = el;
    };
    const merged = mergeHostProps({ref: sigA}, {ref: refB});
    const el = {} as Element;
    expect(typeof merged.ref).toBe('function');
    (merged.ref as (el: Element) => void)(el);
    expect(sigA.value).toBe(el);
    expect(elForB).toBe(el);
  });

  it('returns a single ref as-is when only one part sets it', () => {
    const sigA = fakeSignal<Element | undefined>(undefined);
    const merged = mergeHostProps({ref: sigA}, {class: 'x'});
    expect(merged.ref).toBe(sigA);
  });

  it('shallow-merges object styles, later wins per key', () => {
    const merged = mergeHostProps({style: {color: 'red', top: '0'}}, {style: {color: 'blue'}});
    expect(merged.style).toEqual({color: 'blue', top: '0'});
  });
});

describe('callHostHandler', () => {
  it('no-ops for null/undefined', async () => {
    await expect(
      callHostHandler(undefined, new Event('click'), {} as Element),
    ).resolves.toBeUndefined();
  });

  it('invokes a single handler', async () => {
    const spy = vi.fn();
    await callHostHandler(qrl(spy), new Event('click'), {} as Element);
    expect(spy).toHaveBeenCalledTimes(1);
  });

  it('invokes every handler in a (possibly nested) array, in order', async () => {
    const calls: string[] = [];
    const a = qrl(() => void calls.push('a'));
    const b = qrl(() => void calls.push('b'));
    const c = qrl(() => void calls.push('c'));
    await callHostHandler([a, [b, c]] as unknown as HostHandler, new Event('click'), {} as Element);
    expect(calls).toEqual(['a', 'b', 'c']);
  });
});

describe('extraHostAttrs', () => {
  it('drops known keys and undefined values', () => {
    const extra = extraHostAttrs(
      {id: 'x', class: 'y', 'aria-haspopup': 'menu', 'aria-controls': undefined},
      new Set(['id', 'class']),
    );
    expect(extra).toEqual({'aria-haspopup': 'menu'});
  });
});
