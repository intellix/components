import type {QwikIntrinsicElements} from '@qwik.dev/core';

/**
 * TypeScript augmentation for `<mat-paginator>`'s custom-element tag name — same convention as
 * `<mat-form-field>`/`<mat-select>`/`<mat-pseudo-checkbox>`/etc. elsewhere in this project. See
 * `mat-paginator.tsx`.
 */
declare module '@qwik.dev/core' {
  namespace QwikJSX {
    interface IntrinsicElements {
      'mat-paginator': QwikIntrinsicElements['div'];
    }
  }
}
