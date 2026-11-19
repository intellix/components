import {describe, it, expect} from 'vitest';
import {createDOM} from '@qwik.dev/core/testing';
import type {JSXOutput} from '@qwik.dev/core';
import {MatListItem} from './mat-list-item';
import {
  MatListItemAvatar,
  MatListItemIcon,
  MatListItemLine,
  MatListItemMeta,
  MatListItemTitle,
} from './mat-list-item-sections';

describe('MatListItem (smoke)', () => {
  it('is exported and is a function-shaped component', () => {
    expect(MatListItem).toBeDefined();
    expect(typeof MatListItem).toBe('function');
  });
});

/** Renders `item` and returns its host element. */
async function renderItem(item: JSXOutput): Promise<HTMLElement> {
  const {render, screen} = await createDOM();
  await render(item);
  return screen.querySelector('.mat-mdc-list-item') as HTMLElement;
}

/** An element's child elements as `tag.firstClass`, skipping Qwik's own `<script hidden>`s. */
function childShape(el: Element): string[] {
  const children: Element[] = [];
  for (let i = 0; i < el.children.length; i++) children.push(el.children[i]);
  return children
    .filter(child => child.tagName !== 'SCRIPT')
    .map(child => `${child.tagName.toLowerCase()}.${child.className.split(' ')[0]}`);
}

function itemClasses(el: HTMLElement): string[] {
  return el.className.split(' ');
}

describe('MatListItem — sections projected through named slots', () => {
  it('places each q:slot section where list-item.html does, whatever the source order', async () => {
    const item = await renderItem(
      <MatListItem leading="icon" title lineCount={1} meta content>
        <MatListItemMeta q:slot="meta">128</MatListItemMeta>
        <MatListItemLine q:slot="line">Line</MatListItemLine>
        unscoped
        <MatListItemTitle q:slot="title">Title</MatListItemTitle>
        <MatListItemIcon q:slot="icon">i</MatListItemIcon>
      </MatListItem>,
    );

    expect(childShape(item)).toEqual([
      'div.mat-mdc-list-item-icon',
      'span.mdc-list-item__content',
      'div.mat-mdc-list-item-meta',
      'span.mat-focus-indicator',
    ]);
    const content = item.querySelector('.mdc-list-item__content')!;
    expect(childShape(content)).toEqual([
      'div.mat-mdc-list-item-title',
      'div.mat-mdc-list-item-line',
      'span.mat-mdc-list-item-unscoped-content',
    ]);
    expect(content.querySelector('.mat-mdc-list-item-unscoped-content')!.textContent).toBe(
      'unscoped',
    );
  });

  it('places the avatar first and a nested divider after the meta', async () => {
    const item = await renderItem(
      <MatListItem leading="avatar" title meta>
        <hr q:slot="divider" class="divider" />
        <MatListItemMeta q:slot="meta">m</MatListItemMeta>
        <MatListItemTitle q:slot="title">Title</MatListItemTitle>
        <MatListItemAvatar q:slot="avatar">AS</MatListItemAvatar>
      </MatListItem>,
    );

    expect(childShape(item)).toEqual([
      'div.mat-mdc-list-item-avatar',
      'span.mdc-list-item__content',
      'div.mat-mdc-list-item-meta',
      'hr.divider',
      'span.mat-focus-indicator',
    ]);
  });

  it('projects any number of lines', async () => {
    const item = await renderItem(
      <MatListItem title lineCount={2}>
        <MatListItemTitle q:slot="title">Title</MatListItemTitle>
        <MatListItemLine q:slot="line">One</MatListItemLine>
        <MatListItemLine q:slot="line">Two</MatListItemLine>
      </MatListItem>,
    );

    expect(childShape(item.querySelector('.mdc-list-item__content')!)).toEqual([
      'div.mat-mdc-list-item-title',
      'div.mat-mdc-list-item-line',
      'div.mat-mdc-list-item-line',
      'span.mat-mdc-list-item-unscoped-content',
    ]);
  });
});

describe('MatListItem — content-derived classes from the structure props', () => {
  it('leading="avatar" / leading="icon" / meta', async () => {
    const avatar = itemClasses(await renderItem(<MatListItem leading="avatar" />));
    expect(avatar).toContain('mdc-list-item--with-leading-avatar');
    expect(avatar).not.toContain('mdc-list-item--with-leading-icon');

    const iconMeta = itemClasses(await renderItem(<MatListItem leading="icon" meta />));
    expect(iconMeta).toContain('mdc-list-item--with-leading-icon');
    expect(iconMeta).toContain('mdc-list-item--with-trailing-meta');
    expect(iconMeta).toContain('mat-mdc-list-item-both-leading-and-trailing');

    const metaOnly = itemClasses(await renderItem(<MatListItem meta />));
    expect(metaOnly).toContain('mdc-list-item--with-trailing-meta');
    expect(metaOnly).not.toContain('mat-mdc-list-item-both-leading-and-trailing');
  });

  it('counts title + lineCount (+1 for content) as the number of lines', async () => {
    expect(itemClasses(await renderItem(<MatListItem title />))).toEqual(
      expect.arrayContaining(['mat-mdc-list-item-single-line', 'mdc-list-item--with-one-line']),
    );
    expect(itemClasses(await renderItem(<MatListItem title lineCount={1} />))).toContain(
      'mdc-list-item--with-two-lines',
    );
    expect(itemClasses(await renderItem(<MatListItem title lineCount={2} />))).toContain(
      'mdc-list-item--with-three-lines',
    );
    expect(itemClasses(await renderItem(<MatListItem title content />))).toContain(
      'mdc-list-item--with-two-lines',
    );
    expect(itemClasses(await renderItem(<MatListItem title lines={3} />))).toContain(
      'mdc-list-item--with-three-lines',
    );
  });

  it('treats content as the title when it is the only line, else as a secondary line', async () => {
    const alone = await renderItem(<MatListItem content>Item</MatListItem>);
    expect(alone.querySelector('.mat-mdc-list-item-unscoped-content')!.className).toBe(
      'mat-mdc-list-item-unscoped-content mdc-list-item__primary-text',
    );

    const withTitle = await renderItem(
      <MatListItem title content>
        <MatListItemTitle q:slot="title">Title</MatListItemTitle>
        Line
      </MatListItem>,
    );
    expect(withTitle.querySelector('.mat-mdc-list-item-unscoped-content')!.className).toBe(
      'mat-mdc-list-item-unscoped-content mdc-list-item__secondary-text',
    );

    const none = await renderItem(<MatListItem title />);
    expect(none.querySelector('.mat-mdc-list-item-unscoped-content')!.className).toBe(
      'mat-mdc-list-item-unscoped-content',
    );
  });
});
