import {component$} from '@qwik.dev/core';
import {
  MatIcon,
  trustIconHtml,
  useMatIconRegistryProvider,
} from '@angular-community/qwik-material/icon';

// Same literal string as upstream's icon-svg-example.ts (THUMBUP_ICON) — kept byte-identical so
// the rendered <svg> markup matches exactly, not just the icon's appearance.
const THUMBUP_ICON =
  `
  <svg xmlns="http://www.w3.org/2000/svg" width="24px" height="24px">
    <path d="M0 0h24v24H0z" fill="none"/>
    <path d="M1 21h4V9H1v12zm22-11c0-1.1-.9-2-2-2h-6.31l.95-4.57.03-.32c0-.41-.17-.79-.` +
  `44-1.06L14.17 1 7.59 7.59C7.22 7.95 7 8.45 7 9v10c0 1.1.9 2 2 2h9c.83 0 1.54-.5` +
  `1.84-1.22l3.02-7.05c.09-.23.14-.47.14-.73v-1.91l-.01-.01L23 10z"/>
  </svg>
`;

/**
 * Port of src/components-examples/material/icon/icon-svg
 * (icon-svg-example.html/.ts) — material.angular.dev's "SVG icons" example.
 *
 * Upstream registers the literal via the injected `MatIconRegistry` inside
 * the component's constructor:
 *   `iconRegistry.addSvgIconLiteral('thumbs-up', sanitizer.bypassSecurityTrustHtml(THUMBUP_ICON))`
 * This port's equivalent is `useMatIconRegistryProvider({icons: [...]})`,
 * with `trustIconHtml()` as the explicit-trust opt-in that replaces
 * `DomSanitizer.bypassSecurityTrustHtml` (see `qwik-material/icon/SYNC.md`'s "SVG icon
 * registry" section — no DomSanitizer, no Angular DI, same "you must explicitly mark this
 * trusted" contract).
 */
export default component$(() => {
  useMatIconRegistryProvider({icons: [{name: 'thumbs-up', literal: trustIconHtml(THUMBUP_ICON)}]});
  return (
    <icon-svg-example>
      <MatIcon svgIcon="thumbs-up" aria-hidden={false} aria-label="Example thumbs up SVG icon" />
    </icon-svg-example>
  );
});
