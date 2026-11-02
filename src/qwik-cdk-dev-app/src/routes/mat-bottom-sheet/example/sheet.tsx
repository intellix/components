import {$, component$, useContext} from '@qwik.dev/core';
import {MAT_BOTTOM_SHEET_REF} from '@angular-community/qwik-material/bottom-sheet';
import {MatNavList, MatListItem, MatListItemTitle} from '@angular-community/qwik-material/list';

/**
 * Mirrors `bottom-sheet-overview-example-sheet` (src/components-examples/material/bottom-sheet/
 * bottom-sheet-overview/bottom-sheet-overview-example-sheet.html): a `<mat-nav-list>` of four
 * real links, each dismissing the sheet and preventing navigation on click.
 *
 * Each link's secondary text uses the real example's `<span matLine>` — the LEGACY `matLine`
 * directive (predates `matListItemTitle`/`matListItemLine`), which the modern `list-item.html`
 * template does not recognize as a named content section at all; it falls through to the
 * default/unscoped `<ng-content>` slot instead (confirmed live at
 * http://localhost:4200/qwik-parity/mat-bottom-sheet/example: the rendered secondary text is
 * wrapped in `mat-mdc-list-item-unscoped-content`, NOT `mat-mdc-list-item-line` — the class a
 * modern `<span matListItemLine>` would get). `<MatListItem>`'s own `content` prop IS that
 * unscoped slot (see `mat-list-item.tsx`'s doc comment) and already derives the right
 * `mdc-list-item--with-two-lines` class from `title` + `content` being present — so the plain
 * `<span matline>` is passed there directly, with no dedicated `<MatListItemLine>` (which would
 * render the modern, differently-classed markup instead).
 */
export default component$(() => {
  const ref = useContext(MAT_BOTTOM_SHEET_REF);
  const openLink = $((event: MouseEvent) => {
    ref?.dismiss();
    event.preventDefault();
  });

  const links = [
    {href: 'https://keep.google.com/', title: 'Google Keep', line: 'Add to a note'},
    {href: 'https://docs.google.com/', title: 'Google Docs', line: 'Embed in a document'},
    {href: 'https://plus.google.com/', title: 'Google Plus', line: 'Share with your friends'},
    {
      href: 'https://hangouts.google.com/',
      title: 'Google Hangouts',
      line: 'Show to your coworkers',
    },
  ];

  return (
    <bottom-sheet-overview-example-sheet>
      <MatNavList>
        {links.map(link => (
          <MatListItem
            key={link.href}
            as="a"
            href={link.href}
            onClick$={openLink}
            title={<MatListItemTitle as="span">{link.title}</MatListItemTitle>}
            content={<span {...({matline: ''} as Record<string, string>)}>{link.line}</span>}
          />
        ))}
      </MatNavList>
    </bottom-sheet-overview-example-sheet>
  );
});
