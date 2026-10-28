import {createContextId} from '@builder.io/qwik';

/**
 * Defaults applied to every MatSlideToggle in a subtree. Consumers provide
 * this via <QwikMaterialProvider matSlideToggleConfig={...}>. Mirrors
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
  'qwik-material/slide-toggle-config',
);
