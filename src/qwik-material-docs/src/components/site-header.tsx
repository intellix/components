import {component$, useSignal} from '@qwik.dev/core';
import {useLocation} from '@qwik.dev/router';
import {MatToolbar} from '@angular-community/qwik-material/toolbar';
import {MatIcon} from '@angular-community/qwik-material/icon';
import {MatIconButton} from '@angular-community/qwik-material/button';
import {withBase} from '../lib/base-path';

const NAV_LINKS = [
  {href: withBase('/components/'), label: 'Components'},
  {href: withBase('/cdk/'), label: 'CDK'},
  {href: withBase('/guide/'), label: 'Guides'},
];

/**
 * Site-wide top bar, dogfooding `<MatToolbar>`. Below `900px` (the global stylesheet's
 * `.docs-header-nav` breakpoint) the inline nav links hide and this hamburger toggle takes
 * over, expanding the same links into a dropdown panel anchored under the header — found live
 * (2026-11-02 mobile-width polish pass) that the CSS for `.docs-header-menu-toggle` already
 * existed but nothing ever rendered the toggle itself, leaving narrow viewports with literally
 * no way to reach Components/CDK/Guides from the header.
 */
export default component$(() => {
  const loc = useLocation();
  const path = loc.url.pathname;
  const menuOpen = useSignal(false);

  return (
    <header class="docs-header">
      <MatToolbar color="primary">
        <a href={withBase('/')} class="docs-header-brand" aria-label="qwik-material home">
          <svg class="docs-header-mark" viewBox="0 0 48 48" aria-hidden="true">
            <path
              d="M24 4 L42 14 V34 L24 44 L6 34 V14 Z"
              fill="none"
              stroke="currentColor"
              stroke-width="3"
            />
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
        <MatIconButton
          class="docs-header-menu-toggle"
          ariaLabel={menuOpen.value ? 'Close menu' : 'Open menu'}
          onClick$={() => (menuOpen.value = !menuOpen.value)}
        >
          <MatIcon>{menuOpen.value ? 'close' : 'menu'}</MatIcon>
        </MatIconButton>
      </MatToolbar>
      {menuOpen.value && (
        <nav class="docs-header-mobile-nav" aria-label="Main">
          {NAV_LINKS.map(link => (
            <a
              key={link.href}
              href={link.href}
              aria-current={path.startsWith(link.href) ? 'page' : undefined}
              onClick$={() => (menuOpen.value = false)}
            >
              {link.label}
            </a>
          ))}
        </nav>
      )}
    </header>
  );
});
