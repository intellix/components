// @vitest-environment node
import {$, component$, useSignal} from '@qwik.dev/core';
import {ssrRenderToDom, trigger} from '@qwik.dev/core/testing';
import {describe, expect, it} from 'vitest';
import {mergeHostProps} from '../core/host-props';
import {MatButton, MatIconButton} from './public-api';

/**
 * `useForwardedHostHandlers()` (core/host-props.ts): a directive hook's handlers set on a button
 * run on its host, and a button without them names no forwarded listener — server-rendered,
 * then resumed.
 */
const Hosts = component$(() => {
  const log = useSignal<string[]>([]);
  const withLeave = useSignal(false);
  const record$ = $((e: Event) => {
    log.value = [...log.value, e.type];
  });
  return (
    <>
      <MatButton class="plain">Plain</MatButton>
      <MatButton class="hooked" onMouseEnter$={record$} onFocusIn$={record$}>
        Hooked
      </MatButton>
      <MatIconButton
        class="late"
        ariaLabel="late"
        onMouseLeave$={withLeave.value ? record$ : undefined}
      >
        L
      </MatIconButton>
      {/* A directive hook's handler, merged: unset at first, so only an `undefined` key in the merge. */}
      <MatButton
        class="merged"
        {...mergeHostProps({onMouseLeave$: withLeave.value ? record$ : undefined})}
      >
        M
      </MatButton>
      <button type="button" class="arm" onClick$={() => (withLeave.value = true)}>
        arm
      </button>
      <output>{log.value.join(',')}</output>
    </>
  );
});

describe('forwarded host handlers', () => {
  it('listens only for the handlers a button was given', async () => {
    const {document} = await ssrRenderToDom(<Hosts />);
    const listeners = (selector: string, event: string) =>
      document.querySelector(selector)!.getAttribute(`q-e:${event}`)?.split('|').length ?? 0;
    // Only a forwarder listens for `keydown`: a button without `onKeyDown$` has no listener.
    expect(listeners('button.plain', 'keydown')).toBe(0);
    expect(listeners('button.hooked', 'keydown')).toBe(0);
    // The ripple loader listens for `mouseenter`/`mouseleave` on every button; the forwarder
    // adds one more listener only where a handler is set.
    const base = listeners('button.plain', 'mouseenter');
    expect(listeners('button.hooked', 'mouseenter')).toBe(base + 1);
    expect(listeners('button.hooked', 'mouseleave')).toBe(listeners('button.plain', 'mouseleave'));
  });

  it("runs a button's handlers on its host after resume", async () => {
    const {document} = await ssrRenderToDom(<Hosts />);
    await trigger(document.body, 'button.hooked', 'mouseenter');
    await trigger(document.body, 'button.hooked', 'focusin');
    await trigger(document.body, 'button.hooked', 'mouseleave');
    expect(document.querySelector('output')!.textContent).toBe('mouseenter,focusin');
  });

  it('forwards a handler passed unset at first, once it is set', async () => {
    const {document} = await ssrRenderToDom(<Hosts />);
    await trigger(document.body, 'button.late', 'mouseleave');
    expect(document.querySelector('output')!.textContent).toBe('');
    await trigger(document.body, 'button.arm', 'click');
    await trigger(document.body, 'button.late', 'mouseleave');
    expect(document.querySelector('output')!.textContent).toBe('mouseleave');
  });

  it('forwards a merged handler unset at first, once it is set', async () => {
    const {document} = await ssrRenderToDom(<Hosts />);
    await trigger(document.body, 'button.merged', 'mouseleave');
    expect(document.querySelector('output')!.textContent).toBe('');
    await trigger(document.body, 'button.arm', 'click');
    await trigger(document.body, 'button.merged', 'mouseleave');
    expect(document.querySelector('output')!.textContent).toBe('mouseleave');
  });
});
