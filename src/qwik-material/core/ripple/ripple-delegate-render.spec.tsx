// @vitest-environment node
import {component$, Slot, useSignal} from '@qwik.dev/core';
import {renderToString} from '@qwik.dev/core/server';
import {describe, expect, it} from 'vitest';
import {MatButton, MatIconButton} from '../../button';
import {MatListItem, MatNavList} from '../../list';
import {MatRipple} from './mat-ripple';
import {useMatRippleDelegate} from './ripple-delegate';
import {useMatRippleProvider} from './ripple-global-options';

/**
 * What the ripple delegate (`useMatRippleDelegate()`) changes in server-rendered HTML: ONE set of
 * document listeners on the delegate's element, and no per-host ripple handlers — a ripple host
 * whose config isn't in its DOM carries one `pointerdown` claim instead.
 */
const Delegate = component$(() => {
  useMatRippleDelegate();
  return (
    <div class="delegate">
      <Slot />
    </div>
  );
});

const NestedScope = component$(() => {
  useMatRippleProvider({animation: {enterDuration: 1}});
  return <Slot />;
});

const ssr = async (body: unknown) =>
  (
    await renderToString(
      <>
        <head></head>
        <body>{body as never}</body>
      </>,
      {containerTagName: 'html', qwikLoader: 'never'},
    )
  ).html;

/** The opening tag of the first element whose `class` contains `cls`. */
const tag = (html: string, cls: string): string => {
  const m = html.match(new RegExp(`<[a-z-]+ [^>]*class="[^"]*\\b${cls}\\b[^"]*"[^>]*>`));
  if (!m) throw new Error(`no .${cls}`);
  return m[0];
};

const POINTER_HANDLERS =
  /q-e:(mousedown|mouseup|mouseleave|mouseenter|touchstart|touchend|touchcancel|focus|pointerdown)=/;

describe('ripple delegate, server-rendered', () => {
  it('puts its document listeners on its element, once', async () => {
    const html = await ssr(
      <Delegate>
        <MatButton>One</MatButton>
        <MatButton>Two</MatButton>
      </Delegate>,
    );
    const delegate = tag(html, 'delegate');
    for (const type of ['mouseover', 'focusin', 'pointerdown', 'mousedown', 'touchstart']) {
      expect(delegate).toContain(`q-dp:${type}=`);
    }
    for (const type of ['mouseup', 'touchend', 'touchcancel', 'mouseout']) {
      expect(delegate).toContain(`q-dp:${type}=`);
    }
    expect(html.match(/q-dp:mousedown=/g)).toHaveLength(1);
  });

  it('buttons and list items carry no ripple handler', async () => {
    const html = await ssr(
      <Delegate>
        <MatButton appearance="elevated">One</MatButton>
        <MatIconButton aria-label="Two">2</MatIconButton>
        <MatNavList>
          <MatListItem as="a" href="/a">
            A
          </MatListItem>
        </MatNavList>
      </Delegate>,
    );
    for (const cls of ['mat-mdc-raised-button', 'mat-mdc-icon-button', 'mat-mdc-list-item']) {
      expect(tag(html, cls)).not.toMatch(POINTER_HANDLERS);
    }
    // A constant attribute — after the `:` separator — which Qwik never writes again, so the
    // delegate's removal of it sticks through a re-render.
    expect(tag(html, 'mat-mdc-raised-button')).toMatch(
      / :[^>]* mat-ripple-loader-uninitialized=""/,
    );
  });

  it('a list item whose ripple is disabled by a prop vetoes it (no chunk: a sync$)', async () => {
    const html = await ssr(
      <Delegate>
        <MatNavList>
          <MatListItem as="a" href="/a" disableRipple>
            A
          </MatListItem>
        </MatNavList>
      </Delegate>,
    );
    const item = tag(html, 'mat-mdc-list-item');
    expect(item).toMatch(/q-e:pointerdown="#\d+"/);
    expect(item).not.toMatch(/q-e:(mousedown|mouseup|mouseleave|touchstart|touchend|touchcancel)=/);
  });

  it('a matRipple host claims its presses with one handler', async () => {
    const html = await ssr(
      <Delegate>
        <MatRipple class="host" animation={{enterDuration: 300, exitDuration: 0}}>
          x
        </MatRipple>
      </Delegate>,
    );
    const host = tag(html, 'host');
    expect(host).toMatch(/q-e:pointerdown="#\d+\|[^"]+"/);
    expect(host).not.toMatch(/q-e:(mousedown|mouseup|mouseleave|touchstart|touchend|touchcancel)=/);
  });

  it('below a nested ripple provider, a button claims with the options in force there', async () => {
    const html = await ssr(
      <Delegate>
        <NestedScope>
          <MatButton>One</MatButton>
        </NestedScope>
      </Delegate>,
    );
    expect(tag(html, 'mat-mdc-button')).toMatch(/q-e:pointerdown="#\d+\|[^"]+"/);
  });

  it('without a delegate, no host carries a claim (nothing would listen)', async () => {
    const html = await ssr(
      <div>
        <MatButton>One</MatButton>
        <MatRipple class="host">x</MatRipple>
      </div>,
    );
    expect(tag(html, 'mat-mdc-button')).not.toMatch(POINTER_HANDLERS);
    expect(tag(html, 'host')).not.toMatch(POINTER_HANDLERS);
  });
});

describe('ripple delegate, after resume', () => {
  const Toggling = component$(() => {
    const disabled = useSignal(false);
    return (
      <Delegate>
        <button class="toggle" onClick$={() => (disabled.value = !disabled.value)}>
          Toggle
        </button>
        <MatButton class="target" disabled={disabled.value}>
          Button
        </MatButton>
      </Delegate>
    );
  });

  it('a re-render keeps the ripple element the delegate created, and the attribute it removed', async () => {
    const {ssrRenderToDom, trigger} = await import('@qwik.dev/core/testing');
    const {initializeLoaderRipple} = await import('./ripple-delegate');
    const {document} = await ssrRenderToDom(<Toggling />);
    const host = () => document.querySelector('.target')!;
    const init = (initializeLoaderRipple as unknown as {resolved: (e: Event) => void}).resolved;
    // The DOM ssrRenderToDom resumes in has no MouseEvent: the handler reads `type` and `target`.
    init({type: 'mouseover', target: host()} as unknown as Event);
    expect(host().querySelector('.mat-ripple')).not.toBeNull();

    await trigger(document.body, 'button.toggle', 'click');
    expect(host().classList.contains('mat-mdc-button-disabled')).toBe(true);
    expect(host().hasAttribute('mat-ripple-loader-uninitialized')).toBe(false);
    expect(host().querySelectorAll('.mat-ripple')).toHaveLength(1);
    expect(host().lastElementChild?.className).toBe('mat-ripple mat-mdc-button-ripple');

    await trigger(document.body, 'button.toggle', 'click');
    expect(host().hasAttribute('mat-ripple-loader-uninitialized')).toBe(false);
    expect(host().querySelectorAll('.mat-ripple')).toHaveLength(1);
  });

  it('so does a host Qwik already re-rendered (its vnodes built) before the delegate touched it', async () => {
    const {ssrRenderToDom, trigger} = await import('@qwik.dev/core/testing');
    const {initializeLoaderRipple} = await import('./ripple-delegate');
    const {document} = await ssrRenderToDom(<Toggling />);
    const host = () => document.querySelector('.target')!;
    const init = (initializeLoaderRipple as unknown as {resolved: (e: Event) => void}).resolved;

    await trigger(document.body, 'button.toggle', 'click');
    init({type: 'mouseover', target: host()} as unknown as Event);
    await trigger(document.body, 'button.toggle', 'click');

    expect(host().classList.contains('mat-mdc-button-disabled')).toBe(false);
    expect(host().hasAttribute('mat-ripple-loader-uninitialized')).toBe(false);
    expect(host().querySelectorAll('.mat-ripple')).toHaveLength(1);
    expect(host().lastElementChild?.className).toBe('mat-ripple mat-mdc-button-ripple');
  });
});
