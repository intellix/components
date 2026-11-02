import type {QwikIntrinsicElements} from '@qwik.dev/core';

/**
 * TypeScript augmentation for Angular Material Slider's custom-element tag
 * names. Upstream's `MatSlider` (`selector: 'mat-slider'`) and
 * `MatSliderVisualThumb` (`selector: 'mat-slider-visual-thumb'`) are both
 * `@Component`s with element selectors — external CMS styles may target
 * either tag directly, not just the `.mat-mdc-slider*` classes. Both type
 * as `QwikIntrinsicElements['div']` — no custom camelCase attrs need
 * widening (the native range inputs inside use the standard `input` JSX
 * typing already).
 */
declare module '@qwik.dev/core' {
  namespace QwikJSX {
    interface IntrinsicElements {
      'mat-slider': QwikIntrinsicElements['div'];
      'mat-slider-visual-thumb': QwikIntrinsicElements['div'];
    }
  }
}
