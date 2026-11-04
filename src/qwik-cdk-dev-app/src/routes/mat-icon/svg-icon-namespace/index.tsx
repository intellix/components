import {component$} from '@qwik.dev/core';
import {
  MatIcon,
  trustIconHtml,
  useMatIconRegistryProvider,
} from '@angular-community/qwik-material/icon';

const ANIMALS_ICON_SET = trustIconHtml(
  `<svg><symbol id="cat" viewBox="0 0 24 24"><path d="M12 8c-2 0-3 1-3 3s1 3 3 3 3-1 3-3-1-3-3-3z"/></symbol>` +
    `<symbol id="dog" viewBox="0 0 24 24"><path d="M4 10h16v8H4z"/></symbol></svg>`,
);

/**
 * Registers an icon SET in the `animals` namespace (literal, no fetch
 * needed) and resolves two of its icons by `namespace:name` — proves
 * `getNamedSvgIcon`'s namespace + icon-set lookup path (`icon-set-extract.ts`'s
 * `<symbol>` extraction).
 */
export default component$(() => {
  useMatIconRegistryProvider({iconSets: [{namespace: 'animals', literal: ANIMALS_ICON_SET}]});
  return (
    <>
      <div data-parity-root>
        <>
          <MatIcon svgIcon="animals:cat" aria-label="Cat" aria-hidden={false} />
          <MatIcon svgIcon="animals:dog" aria-label="Dog" aria-hidden={false} />
        </>
      </div>
      <main data-scenario-ready>ready</main>
    </>
  );
});
