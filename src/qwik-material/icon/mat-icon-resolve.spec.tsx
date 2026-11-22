// @vitest-environment node
import {$, component$, Slot, useSignal} from '@qwik.dev/core';
import {ssrRenderToDom, trigger} from '@qwik.dev/core/testing';
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';
import {
  addSvgIcon,
  MatIcon,
  trustIconResourceUrl,
  useMatIconRegistryProvider,
  useOptionalIconRegistry,
} from './public-api';
import {_clearIconFetchCacheForTests} from './icon-fetch';

/**
 * `<MatIcon svgIcon>` server-rendered, then resumed: the resolved `<svg>` is in the HTML only,
 * a later `svgIcon` resolves in the browser, and a registry's `resolver$` resolves icons the
 * store never registered — on the server and in the browser.
 */
const STAR = 'M12 2l10 20H2z';
const HEART = 'M12 21s-8-5-8-12';
const LATE = 'M1 1h2v2H1z';
const SVGS: Record<string, string> = {
  '/icons/star.svg': `<svg viewBox="0 0 24 24"><path d="${STAR}"/></svg>`,
  '/icons/heart.svg': `<svg viewBox="0 0 24 24"><path d="${HEART}"/></svg>`,
  '/icons/late.svg': `<svg viewBox="0 0 24 24"><path d="${LATE}"/></svg>`,
};
/** What the resolver knows, by icon name — module scope, so no QRL captures it. */
const RESOLVABLE: Record<string, string> = {star: '/icons/star.svg', heart: '/icons/heart.svg'};

const Toggle = component$(() => {
  const name = useSignal('star');
  return (
    <>
      <MatIcon class="toggled" svgIcon={name.value} />
      <button
        type="button"
        class="toggle"
        onClick$={() => (name.value = name.value === 'star' ? 'heart' : 'star')}
      >
        Toggle
      </button>
    </>
  );
});

/** An icon whose class and color change (not its `svgIcon`). */
const Restyled = component$(() => {
  const on = useSignal(false);
  return (
    <>
      <MatIcon
        class={on.value ? 'restyled on' : 'restyled'}
        color={on.value ? 'warn' : undefined}
        svgIcon="star"
      />
      <button type="button" class="restyle" onClick$={() => (on.value = !on.value)}>
        Restyle
      </button>
    </>
  );
});

const Seeded = component$(() => {
  useMatIconRegistryProvider({
    icons: [
      {name: 'star', url: trustIconResourceUrl('/icons/star.svg')},
      {name: 'heart', url: trustIconResourceUrl('/icons/heart.svg')},
    ],
  });
  return <Slot />;
});

const Resolved = component$(() => {
  useMatIconRegistryProvider({
    resolver$: $((name: string, namespace: string) =>
      namespace === '' && RESOLVABLE[name] ? trustIconResourceUrl(RESOLVABLE[name]) : null,
    ),
  });
  return <Slot />;
});

/** Registers `late` on a click — an icon rendered before then re-renders once it is. */
const RegisterLate = component$(() => {
  const registry = useOptionalIconRegistry()!;
  return (
    <>
      <MatIcon class="late" svgIcon="late" />
      <button
        type="button"
        class="register"
        onClick$={() => addSvgIcon(registry, 'late', trustIconResourceUrl('/icons/late.svg'))}
      >
        Register
      </button>
    </>
  );
});

const stateOf = (document: Document) =>
  Array.from(document.querySelectorAll('script[type="qwik/state"]'))
    .map(script => script.textContent)
    .join('');

beforeEach(() => {
  _clearIconFetchCacheForTests();
  vi.spyOn(console, 'error').mockImplementation(() => {});
  vi.stubGlobal('fetch', async (url: string) => {
    const svg = SVGS[new URL(url, 'http://localhost').pathname];
    return svg
      ? new Response(svg, {headers: {'content-type': 'image/svg+xml'}})
      : new Response(null, {status: 404});
  });
});
afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('<MatIcon svgIcon> from a seeded registry', () => {
  it('has its <svg> in the HTML, not in the state', async () => {
    const {document} = await ssrRenderToDom(
      <Seeded>
        <Toggle />
      </Seeded>,
    );
    const icon = document.querySelector('mat-icon.toggled')!;
    expect(icon.querySelector('svg path')?.getAttribute('d')).toBe(STAR);
    expect(icon.getAttribute('svgicon')).toBe('star');
    expect(icon.getAttribute('data-mat-icon-name')).toBe('star');
    expect(stateOf(document)).not.toContain(STAR);
  });

  it('resolves a new svgIcon in the browser', async () => {
    const {document} = await ssrRenderToDom(
      <Seeded>
        <Toggle />
      </Seeded>,
    );
    const path = () => document.querySelector('mat-icon.toggled svg path')?.getAttribute('d');
    await trigger(document.body, 'button.toggle', 'click');
    await expect.poll(path).toBe(HEART);
    expect(document.querySelector('mat-icon.toggled')!.getAttribute('svgicon')).toBe('heart');
    await trigger(document.body, 'button.toggle', 'click');
    await expect.poll(path).toBe(STAR);
  });

  it('keeps the same element and markup when it re-renders for another class or color', async () => {
    const {document} = await ssrRenderToDom(
      <Seeded>
        <Restyled />
      </Seeded>,
    );
    const icon = document.querySelector('mat-icon.restyled')!;
    const markup = icon.innerHTML;
    expect(icon.querySelector('svg path')?.getAttribute('d')).toBe(STAR);
    await trigger(document.body, 'button.restyle', 'click');
    await expect.poll(() => icon.classList.contains('on')).toBe(true);
    expect(icon.classList.contains('mat-warn')).toBe(true);
    expect(document.querySelector('mat-icon.restyled')).toBe(icon);
    expect(icon.innerHTML).toBe(markup);
    await trigger(document.body, 'button.restyle', 'click');
    await expect.poll(() => icon.classList.contains('on')).toBe(false);
    expect(document.querySelector('mat-icon.restyled')).toBe(icon);
    expect(icon.innerHTML).toBe(markup);
  });

  it('renders an icon registered after it was first rendered', async () => {
    const {document} = await ssrRenderToDom(
      <Seeded>
        <RegisterLate />
      </Seeded>,
    );
    const path = () => document.querySelector('mat-icon.late svg path')?.getAttribute('d');
    expect(path()).toBeUndefined();
    await trigger(document.body, 'button.register', 'click');
    await expect.poll(path).toBe(LATE);
  });
});

describe('<MatIcon svgIcon> through the registry resolver$', () => {
  it('resolves on the server, serializing no registration', async () => {
    const {document} = await ssrRenderToDom(
      <Resolved>
        <Toggle />
      </Resolved>,
    );
    expect(document.querySelector('mat-icon.toggled svg path')?.getAttribute('d')).toBe(STAR);
    const state = stateOf(document);
    expect(state).not.toContain('/icons/');
    expect(state).not.toContain(STAR);
  });

  it('resolves an icon first rendered in the browser', async () => {
    const {document} = await ssrRenderToDom(
      <Resolved>
        <Toggle />
      </Resolved>,
    );
    const path = () => document.querySelector('mat-icon.toggled svg path')?.getAttribute('d');
    await trigger(document.body, 'button.toggle', 'click');
    await expect.poll(path).toBe(HEART);
  });

  it('renders nothing, and logs, for an icon it does not know', async () => {
    const {document} = await ssrRenderToDom(
      <Resolved>
        <MatIcon class="unknown" svgIcon="unknown" />
      </Resolved>,
    );
    expect(document.querySelector('mat-icon.unknown')!.innerHTML).toBe('');
    expect(console.error).toHaveBeenCalledWith(
      expect.stringContaining('Error retrieving icon unknown!'),
    );
  });
});
