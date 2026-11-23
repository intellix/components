// @vitest-environment node
import {component$, useSignal} from '@qwik.dev/core';
import {renderToString} from '@qwik.dev/core/server';
import {ssrRenderToDom, trigger} from '@qwik.dev/core/testing';
import {describe, expect, it} from 'vitest';
import {MatBadge, matBadge, useMatBadgeStyles} from './badge';
import {MatButton, MatIconButton, MatMiniFabButton} from './button';
import {MatCard} from './card';
import {MatDivider} from './divider';
import {MatListItem, MatListItemAvatar, MatNavList} from './list';
import {compileComponentStyles, splitComponentStyles} from './scripts/component-styles.mjs';

/**
 * A component brings its entry point's CSS when it renders — `useStyles$`, as upstream Angular
 * Material attaches a component's styles when the component is first created — instead of the
 * app importing every component's CSS up front. See `component-styles.spec.ts` for the
 * generated files themselves.
 */
/** An entry point's CSS, as its styles module registers it (one sheet: no variants). */
const css = (entry: string): Promise<string> => compileComponentStyles(entry);

/** An entry point's base sheet, or one of its variant sheets (`COMPONENT_STYLE_VARIANTS`). */
const sheet = async (entry: string, variant?: string): Promise<string> => {
  const {base, variants} = await splitComponentStyles(entry);
  if (!variant) return base;
  const found = variants.find(v => v.name === variant);
  if (!found) throw new Error(`${entry} has no variant ${variant}`);
  return found.css;
};

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
        {/* Another component of the same entry point shares the base stylesheet. */}
        <MatIconButton aria-label="Three">3</MatIconButton>
      </div>,
    );
    expect(styleTags(html).map(s => s.css)).toEqual([
      await sheet('button'),
      await sheet('button', 'text'),
      await sheet('button', 'icon'),
    ]);
    expect(html).not.toContain('.mat-mdc-card');
    expect(html).not.toContain('.mat-divider');
  });

  it('carries only the variant sheets the page renders, each once', async () => {
    const html = await ssr(
      <div>
        <MatButton appearance="elevated">One</MatButton>
        <MatMiniFabButton aria-label="Two">2</MatMiniFabButton>
        <MatButton appearance="elevated">Three</MatButton>
        <MatButton appearance="outlined">Four</MatButton>
      </div>,
    );
    const styles = styleTags(html);
    expect(styles.map(s => s.css)).toEqual([
      await sheet('button'),
      await sheet('button', 'elevated'),
      await sheet('button', 'fab'),
      await sheet('button', 'outlined'),
    ]);
    // Each before the first instance that needs it.
    expect(html.indexOf(styles[3].css)).toBeLessThan(
      html.search(/<button[^>]* class="[^"]*mat-mdc-outlined-button/),
    );
    expect(html.search(/<button[^>]* class="[^"]*mat-mdc-outlined-button/)).toBeGreaterThan(0);
    expect(new Set(styles.map(s => s.id)).size).toBe(styles.length);
  });

  it('a list registers its two-line and section CSS only for an item that has them', async () => {
    const single = await ssr(
      <MatNavList>
        <MatListItem as="a" href="/a">
          A
        </MatListItem>
      </MatNavList>,
    );
    expect(styleTags(single).map(s => s.css)).toEqual([await sheet('list')]);

    const rich = await ssr(
      <MatNavList>
        <MatListItem as="a" href="/a">
          A
        </MatListItem>
        <MatListItem as="a" href="/b" lines={2}>
          B
        </MatListItem>
        <MatListItem as="a" href="/c" leading="avatar">
          <MatListItemAvatar q:slot="avatar" as="img" src="c.png" />C
        </MatListItem>
      </MatNavList>,
    );
    expect(styleTags(rich).map(s => s.css)).toEqual([
      await sheet('list'),
      await sheet('list', 'rich'),
    ]);
  });

  it("matBadge()'s content element brings its CSS; a hidden, empty badge doesn't", async () => {
    const Host = component$<{content: string}>(props => {
      useMatBadgeStyles();
      const badge = matBadge({content: props.content});
      return <span {...badge.hostProps}>x{badge.content}</span>;
    });
    const empty = await ssr(<Host content="" />);
    expect(styleTags(empty).map(s => s.css)).toEqual([await sheet('badge')]);

    const shown = await ssr(<Host content="4" />);
    expect(styleTags(shown).map(s => s.css)).toEqual([
      await sheet('badge'),
      await sheet('badge', 'content'),
    ]);
    // The content element stays the host's last child.
    expect(shown).toMatch(
      /<span [^>]*class="mat-badge-content mat-badge-active"[^>]*>4<\/span><\/span>/,
    );
  });

  it("a badge registers its content element's CSS only when it shows content", async () => {
    const hidden = await ssr(<MatBadge content="">Hidden</MatBadge>);
    expect(styleTags(hidden).map(s => s.css)).toEqual([await sheet('badge')]);

    const shown = await ssr(<MatBadge content="4">Shown</MatBadge>);
    expect(styleTags(shown).map(s => s.css)).toEqual([
      await sheet('badge'),
      await sheet('badge', 'content'),
    ]);
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
  const Switching = component$(() => {
    const outlined = useSignal(false);
    return (
      <div>
        <button class="switch" onClick$={() => (outlined.value = true)}>
          Switch
        </button>
        <MatButton appearance={outlined.value ? 'outlined' : 'text'}>Button</MatButton>
      </div>
    );
  });

  it('a button switching appearance after resume brings that variant into <head>', async () => {
    const {document} = await ssrRenderToDom(<Switching />);
    const styles = () =>
      Array.from(document.querySelectorAll('style[q\\:style]')).map(s => s.textContent);
    expect(styles()).toEqual([await sheet('button'), await sheet('button', 'text')]);

    await trigger(document.body, 'button.switch', 'click');

    expect(document.querySelector('.mat-mdc-outlined-button')).not.toBeNull();
    expect(styles()).toEqual([
      await sheet('button'),
      await sheet('button', 'text'),
      await sheet('button', 'outlined'),
    ]);
  });

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
