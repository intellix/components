import type {QwikIntrinsicElements} from '@qwik.dev/core';

/**
 * TypeScript augmentation for Angular Material Menu's `<mat-menu>`
 * custom-element tag name — the empty placeholder host `<MatMenu>` renders
 * at its declaration site (see mat-menu.tsx). Typed as
 * `QwikIntrinsicElements['div']` — no custom camelCase attrs need widening.
 */
declare module '@qwik.dev/core' {
  namespace QwikJSX {
    interface IntrinsicElements {
      'mat-menu': QwikIntrinsicElements['div'];
    }
  }
}
