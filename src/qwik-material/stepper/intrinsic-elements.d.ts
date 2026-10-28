import type {QwikIntrinsicElements} from '@builder.io/qwik';

/**
 * TypeScript augmentation for Angular Material Stepper's custom-element tag
 * names. Upstream renders `<mat-stepper>`/`<mat-step-header>` as actual
 * custom elements; external CMS styles may target these tags directly (not
 * just their classes). Typed as `QwikIntrinsicElements['div']` — neither
 * needs any custom camelCase attrs widened.
 */
declare module '@builder.io/qwik' {
  namespace QwikJSX {
    interface IntrinsicElements {
      'mat-stepper': QwikIntrinsicElements['div'];
      'mat-step-header': QwikIntrinsicElements['div'];
    }
  }
}
