/**
 * The qwik-cdk entry-point catalog — matches `src/qwik-cdk/package.json`'s `exports` map (minus
 * the package root, prebuilt CSS, and the raw `scss/*` passthrough).
 */
export interface CdkEntry {
  /** Matches `@angular-community/qwik-cdk/<id>` and this site's `/cdk/<id>` route. */
  id: string;
  name: string;
  summary: string;
}

export const CDK_ENTRIES: CdkEntry[] = [
  {
    id: 'a11y',
    name: 'Accessibility (a11y)',
    summary: 'Focus trapping, focus monitoring, live announcements, and high-contrast detection.',
  },
  {
    id: 'accordion',
    name: 'Accordion',
    summary: 'Foundation state for a set of expandable/collapsible panels.',
  },
  {
    id: 'bidi',
    name: 'Bidi',
    summary: 'Resolves and observes the current text layout direction (LTR/RTL).',
  },
  {
    id: 'coercion',
    name: 'Coercion',
    summary: 'Small helpers for normalizing boolean/number/array/CSS-pixel inputs.',
  },
  {
    id: 'dialog',
    name: 'Dialog',
    summary: 'A low-level, unstyled modal dialog service that Material Dialog builds on.',
  },
  {
    id: 'keycodes',
    name: 'Keycodes',
    summary: 'Named keyboard-event key constants and key-combination helpers.',
  },
  {
    id: 'layout',
    name: 'Layout',
    summary: 'Observes CSS media-query breakpoints reactively.',
  },
  {
    id: 'overlay',
    name: 'Overlay',
    summary: 'A configurable service for opening floating panels, positioned relative to an origin.',
  },
  {
    id: 'platform',
    name: 'Platform',
    summary: 'Runtime platform/browser-engine detection (SSR-safe).',
  },
  {
    id: 'portal',
    name: 'Portal',
    summary: 'Renders content into a different part of the DOM than where it was declared.',
  },
  {
    id: 'stepper',
    name: 'Stepper',
    summary: 'Foundation linear/non-linear step-sequence state, used by Material Stepper.',
  },
  {
    id: 'table',
    name: 'Table',
    summary: 'A headless, high-performance data-table core that Material Table builds on.',
  },
  {
    id: 'tree',
    name: 'Tree',
    summary: 'A headless hierarchical-data renderer that Material Tree builds on.',
  },
];

export function getCdkEntry(id: string): CdkEntry | undefined {
  return CDK_ENTRIES.find(c => c.id === id);
}
