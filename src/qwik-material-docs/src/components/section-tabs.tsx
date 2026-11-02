import {component$} from '@qwik.dev/core';
import {useLocation} from '@qwik.dev/router';

export interface SectionTabsProps {
  /** e.g. `/components/button` (no trailing slash). */
  basePath: string;
  tabs: ReadonlyArray<{id: string; label: string}>;
}

/**
 * The Overview / API / Examples tab bar on a component or CDK entry page. Styled to match
 * `mat-tab-nav-bar` (`mdc-tab`/`mat-mdc-tab-link` classes from qwik-material's own tabs CSS), but
 * implemented as plain `<a>` navigation rather than `<MatTabNav>`/`<MatTabLink>` — those own their
 * whole host element and have no `href` prop (every qwik-material "owns its host" component is
 * meant to be the END of a composition chain, not a navigation primitive), and this is real
 * multi-page navigation between sibling routes, not a same-page panel switch. Reusing the real
 * CSS classes keeps the look identical while staying a plain, no-JS-required link.
 */
export default component$<SectionTabsProps>(({basePath, tabs}) => {
  const loc = useLocation();
  const path = loc.url.pathname.replace(/\/$/, '');

  return (
    <nav
      class="mat-mdc-tab-nav-bar mat-mdc-tab-header docs-section-tabs"
      aria-label="Documentation sections"
    >
      {tabs.map(tab => {
        const href = `${basePath}/${tab.id}`;
        const active = path === href;
        return (
          <a
            key={tab.id}
            href={`${href}/`}
            class="mdc-tab mat-mdc-tab-link mat-focus-indicator docs-section-tab"
            aria-current={active ? 'page' : undefined}
          >
            {tab.label}
          </a>
        );
      })}
    </nav>
  );
});
