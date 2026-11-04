import {createContextId, useContextProvider} from '@qwik.dev/core';

/**
 * Defaults applied to every MatSlideToggle in a subtree. Consumers provide
 * this via `useMatSlideToggleProvider(...)`. Mirrors
 * upstream's `MatSlideToggleDefaultOptions`
 * (`src/material/slide-toggle/slide-toggle-config.ts`).
 */
export interface MatSlideToggleConfig {
  /**
   * Whether a click toggles the `checked` value. When true, clicking still
   * fires `onToggleChange$` but never `onChange$`/flips the rendered state —
   * mirrors upstream's `disableToggleValue`, which has no per-instance
   * `@Input()` of its own (provider-only, same as here).
   */
  disableToggleValue?: boolean;
  /**
   * Default theme color. This API is supported in M2 themes only; it has no
   * effect in M3 themes. See upstream's own doc comment on `color` for the
   * M3 styling guidance.
   */
  color?: string;
  /** Whether to hide the icon inside the slide toggle, by default. */
  hideIcon?: boolean;
  /** Whether disabled slide toggles should remain interactive, by default. */
  disabledInteractive?: boolean;
}

/**
 * Context id used by MatSlideToggle to read config. The id string is
 * exposed publicly and MUST remain stable across releases — consumers may
 * inject it directly in advanced scenarios.
 */
export const MAT_SLIDE_TOGGLE_CONFIG = createContextId<MatSlideToggleConfig>(
  'qwikMaterial/slideToggleConfig',
);

/**
 * Provides {@link MAT_SLIDE_TOGGLE_CONFIG} for this subtree — call once near the root (or anywhere
 * deeper, to override just that part of the tree) so every MatSlideToggle
 * descendant resolves its defaults from `config` instead of its own hardcoded fallback.
 * Only this one context is provided; every other qwik-material configuration context
 * stays whatever an ancestor (or nothing) already provided — see README.md's
 * "Configuring the library" section.
 */
export function useMatSlideToggleProvider(config?: MatSlideToggleConfig): void {
  useContextProvider(MAT_SLIDE_TOGGLE_CONFIG, config ?? {});
}
