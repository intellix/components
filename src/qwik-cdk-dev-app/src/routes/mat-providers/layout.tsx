import {component$, Slot} from '@qwik.dev/core';
import {useMatProviders} from '@angular-community/qwik-material/providers';

/**
 * Qwik-only routes (no Angular mirror) exercising `useMatProviders()`/individual provider
 * hooks together — see `specs/material-core/providers.spec.ts`. Root-level config: form fields
 * default to the `'outline'` appearance (upstream's own hardcoded fallback is `'fill'`) and
 * tooltips default to a clearly-non-default 400ms show delay (upstream's own hardcoded
 * fallback is 0ms) — every route under here either relies on both unmodified (`basic`), or
 * locally overrides one of them (`nested-override`) to prove the override doesn't leak outside
 * its own subtree, or opens a dialog from under this layout (`dialog`) to prove the SAME
 * forwarding `useMatDialogProvider()`/individual hooks already get also works for contexts the
 * COMBINED `useMatProviders()` hook provided.
 */
export default component$(() => {
  useMatProviders({
    formField: {appearance: 'outline'},
    tooltip: {showDelay: 400, hideDelay: 0},
  });
  return <Slot />;
});
