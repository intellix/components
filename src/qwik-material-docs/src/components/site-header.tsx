import {component$} from '@qwik.dev/core';
import {useLocation} from '@qwik.dev/router';
import {MatToolbar} from '@angular-community/qwik-material/toolbar';
import {MatIcon} from '@angular-community/qwik-material/icon';

const NAV_LINKS = [
  {href: '/components/', label: 'Components'},
  {href: '/cdk/', label: 'CDK'},
  {href: '/guide/', label: 'Guides'},
];

/**
 * Site-wide top bar, dogfooding `<MatToolbar>`. Only four short nav links ever appear here, so —
 * unlike the per-section component/CDK sidenav (`ComponentNav`) — this never needs a hamburger
 * collapse; it just wraps on very narrow viewports via the global stylesheet.
 */
export default component$(() => {
  const loc = useLocation();
  const path = loc.url.pathname;

  return (
    <header class="docs-header">
      <MatToolbar color="primary">
        <a href="/" class="docs-header-brand" aria-label="qwik-material home">
          <svg class="docs-header-mark" viewBox="0 0 48 48" aria-hidden="true">
            <path d="M24 4 L42 14 V34 L24 44 L6 34 V14 Z" fill="none" stroke="currentColor" stroke-width="3" />
            <circle cx="24" cy="24" r="6" fill="currentColor" />
          </svg>
          qwik-material
        </a>
        <nav class="docs-header-nav" aria-label="Main">
          {NAV_LINKS.map(link => (
            <a
              key={link.href}
              href={link.href}
              aria-current={path.startsWith(link.href) ? 'page' : undefined}
            >
              {link.label}
            </a>
          ))}
        </nav>
        <span class="docs-header-spacer" />
        <a
          class="docs-header-github"
          href="https://github.com/angular/components"
          target="_blank"
          rel="noopener"
          aria-label="View source on GitHub"
        >
          <MatIcon>code</MatIcon>
        </a>
      </MatToolbar>
    </header>
  );
});
