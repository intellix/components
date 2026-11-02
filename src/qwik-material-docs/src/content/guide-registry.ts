import gettingStarted from './guides/getting-started.md?raw';
import theming from './guides/theming.md?raw';
import composingDirectives from './guides/composing-directives.md?raw';
import usingWithFormisch from './guides/using-with-formisch.md?raw';
import migratingFromAngularMaterial from './guides/migrating-from-angular-material.md?raw';

export const GUIDE_MARKDOWN: Record<string, string> = {
  'getting-started': gettingStarted,
  theming,
  'composing-directives': composingDirectives,
  'using-with-formisch': usingWithFormisch,
  'migrating-from-angular-material': migratingFromAngularMaterial,
};
