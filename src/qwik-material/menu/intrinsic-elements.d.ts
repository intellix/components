import type {QwikIntrinsicElements} from '@builder.io/qwik';

/**
 * TypeScript augmentation for Angular Material Menu's `<mat-menu>`
 * custom-element tag name — the empty placeholder host `<MatMenu>` renders
 * at its declaration site (see mat-menu.tsx). Typed as
 * `QwikIntrinsicElements['div']` — no custom camelCase attrs need widening.
 */
declare module '@builder.io/qwik' {
  namespace QwikJSX {
    interface IntrinsicElements {
      'mat-menu': QwikIntrinsicElements['div'];
    }
  }
}
