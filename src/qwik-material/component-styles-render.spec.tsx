// @vitest-environment node
import {component$, useSignal} from '@qwik.dev/core';
import {renderToString} from '@qwik.dev/core/server';
import {ssrRenderToDom, trigger} from '@qwik.dev/core/testing';
import {describe, expect, it} from 'vitest';
import {MatButton, MatIconButton} from './button';
import {MatCard} from './card';
import {MatDivider} from './divider';
import {compileComponentStyles} from './scripts/component-styles.mjs';

/**
 * A component brings its entry point's CSS when it renders — `useStyles$`, as upstream Angular
 * Material attaches a component's styles when the component is first created — instead of the
 * app importing every component's CSS up front. See `component-styles.spec.ts` for the
 * generated files themselves.
 */
/** An entry point's CSS, as its styles module registers it. */
const css = (entry: string): Promise<string> => compileComponentStyles(entry);

/** `<style q:style>` elements in server-rendered HTML, in document order. */
const styleTags = (html: string) =>
  [...html.matchAll(/<style q:style="([^"]+)"[^>]*>([^]*?)<\/style>/g)].map(m => ({
    id: m[1],
    css: m[2],
  }));

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

describe('component styles, server-rendered', () => {
  it("carries a rendered component's CSS once, and no unrendered component's", async () => {
    const html = await ssr(
      <div>
        <MatButton>One</MatButton>
        <MatButton>Two</MatButton>
        {/* Another component of the same entry point shares the same stylesheet. */}
        <MatIconButton aria-label="Three">3</MatIconButton>
      </div>,
    );
    const styles = styleTags(html);
    expect(styles).toHaveLength(1);
    expect(styles[0].css).toBe(await css('button'));
    expect(html).not.toContain('.mat-mdc-card');
    expect(html).not.toContain('.mat-divider');
  });

  it('puts the CSS inside @layer qwik-material, before the first instance', async () => {
    const html = await ssr(
      <div>
        <MatCard>Card</MatCard>
      </div>,
    );
    const [style] = styleTags(html);
    // After the layer order statement (qwik-cdk's layer below qwik-material's).
    expect(style.css).toMatch(/^@layer qwik-cdk,qwik-material;@layer qwik-material\{/);
    expect(style.css).toContain('.mat-mdc-card{');
    expect(html.indexOf('<style q:style')).toBeLessThan(html.indexOf('<mat-card'));
  });

  it("carries each rendered entry point's CSS", async () => {
    const html = await ssr(
      <div>
        <MatCard>Card</MatCard>
        <MatDivider />
        <MatCard>Card</MatCard>
      </div>,
    );
    expect(styleTags(html).map(s => s.css)).toEqual([await css('card'), await css('divider')]);
  });
});

describe('component styles, rendered in the browser', () => {
  const Lazy = component$(() => {
    const shown = useSignal(false);
    return (
      <div>
        <button class="show" onClick$={() => (shown.value = true)}>
          Show
        </button>
        {shown.value && <MatDivider />}
      </div>
    );
  });

  it('a component first rendered after resume brings its CSS into <head>', async () => {
    const {document} = await ssrRenderToDom(<Lazy />);
    const divider = () =>
      Array.from(document.querySelectorAll('style[q\\:style]')).filter(s =>
        s.textContent?.includes('.mat-divider{'),
      );
    expect(divider()).toHaveLength(0);

    await trigger(document.body, 'button.show', 'click');

    expect(document.querySelector('mat-divider')).not.toBeNull();
    expect(divider()).toHaveLength(1);
    expect(divider()[0].parentElement?.tagName.toLowerCase()).toBe('head');
    expect(divider()[0].textContent).toBe(await css('divider'));
  });
});
