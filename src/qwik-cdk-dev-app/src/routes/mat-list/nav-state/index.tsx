import {component$, useSignal} from '@qwik.dev/core';
import {MatNavList, MatListItem} from '@angular-community/qwik-material/list';

const LINKS = [
  {href: '/inbox', label: 'Inbox'},
  {href: '/sent', label: 'Sent'},
  {href: '/drafts', label: 'Drafts'},
];

/**
 * Bespoke, non-upstream fixture for what an item puts in the page's serialized state — no
 * Angular mirror (see `specs/material-list/nav.spec.ts`'s "not in the serialized state" test):
 * the `mat-list/nav` scenario's items never re-render, so Qwik serializes none of their props
 * there either way. Built the way a real nav list is (qwik-material-docs' `component-nav.tsx`):
 * items mapped from data, each label the item's unscoped content, each `activated` following a
 * signal the way a real one follows the URL — which makes every item re-renderable, so Qwik
 * serializes its props. `.activate-next` moves the active item, re-rendering two of them on the
 * client (the "re-renders keep their projected content" test).
 */
export default component$(() => {
  const activeIndex = useSignal(1);
  return (
    <>
      <div data-parity-root>
        <MatNavList>
          {LINKS.map((link, index) => (
            <MatListItem
              key={link.href}
              as="a"
              href={link.href}
              activated={activeIndex.value === index}
              content
            >
              {link.label}
            </MatListItem>
          ))}
        </MatNavList>
      </div>
      <button
        class="activate-next"
        onClick$={() => (activeIndex.value = (activeIndex.value + 1) % LINKS.length)}
      >
        Next
      </button>
      <main data-scenario-ready>ready</main>
    </>
  );
});
