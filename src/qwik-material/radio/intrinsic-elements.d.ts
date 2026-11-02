import type {QwikIntrinsicElements} from '@qwik.dev/core';

/**
 * TypeScript augmentation for Angular Material Radio's custom-element tag
 * names. Upstream's `MatRadioGroup` is a `@Directive` attached to a
 * consumer-written `<mat-radio-group>` element, and `MatRadioButton` is a
 * `@Component` with selector `mat-radio-button`; external CMS styles may
 * target either tag directly (not just the `.mat-mdc-radio-*` classes). Both
 * type as `QwikIntrinsicElements['div']` — no custom camelCase attrs need
 * widening.
 */
declare module '@qwik.dev/core' {
  namespace QwikJSX {
    interface IntrinsicElements {
      'mat-radio-group': QwikIntrinsicElements['div'];
      'mat-radio-button': QwikIntrinsicElements['div'];
    }
  }
}
