import {component$} from '@qwik.dev/core';
import {MatIcon, MatIconRegistryProvider, trustIconHtml} from '@angular-community/qwik-material/icon';

/**
 * Registers a single icon as an HTML literal (`addSvgIconLiteral`, via the
 * provider's `icons` seed) and resolves it via `svgIcon` — the registry
 * path's literal-registration case (distinct from the legacy, non-registry
 * `svgLiteral` PROP tested by `/mat-icon/svg-literal/`).
 */
export default component$(() => {
  return (
    <>
      <div data-parity-root>
        <MatIconRegistryProvider
          icons={[{name: 'star', literal: trustIconHtml('<svg viewBox="0 0 24 24"><path d="M12 2l3 7h7l-5.5 4.5L18 21l-6-4-6 4 1.5-7.5L2 9h7z"/></svg>')}]}
        >
          <MatIcon svgIcon="star" aria-label="Star" aria-hidden={false} />
        </MatIconRegistryProvider>
      </div>
      <main data-scenario-ready>ready</main>
    </>
  );
});
