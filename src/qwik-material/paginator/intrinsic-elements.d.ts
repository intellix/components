import type {QwikIntrinsicElements} from '@builder.io/qwik';

/**
 * TypeScript augmentation for `<mat-paginator>`'s custom-element tag name — same convention as
 * `<mat-form-field>`/`<mat-select>`/`<mat-pseudo-checkbox>`/etc. elsewhere in this project. See
 * `mat-paginator.tsx`.
 */
declare module '@builder.io/qwik' {
  namespace QwikJSX {
    interface IntrinsicElements {
      'mat-paginator': QwikIntrinsicElements['div'];
    }
  }
}
