export interface GuideEntry {
  id: string;
  name: string;
  summary: string;
}

export const GUIDES: GuideEntry[] = [
  {
    id: 'getting-started',
    name: 'Getting started',
    summary: 'Install qwik-material/qwik-cdk, wire up the app root, and render your first component.',
  },
  {
    id: 'theming',
    name: 'Theming',
    summary: 'The default theme, `--mat-sys-*` design tokens, light/dark mode, and brand themes.',
  },
  {
    id: 'composing-directives',
    name: 'Composing directives',
    summary: 'Stack more than one Angular-directive-shaped feature on the same element with hooks.',
  },
  {
    id: 'using-with-formisch',
    name: 'Using with Formisch',
    summary: 'Wire qwik-material form controls to the Formisch schema-first form library.',
  },
  {
    id: 'migrating-from-angular-material',
    name: 'Migrating from Angular Material',
    summary: 'A concept-by-concept map from Angular Material APIs to their qwik-material equivalents.',
  },
];

export function getGuide(id: string): GuideEntry | undefined {
  return GUIDES.find(g => g.id === id);
}
