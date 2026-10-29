import type {QwikIntrinsicElements} from '@builder.io/qwik';

/**
 * TypeScript augmentation for Angular Material core's `mat-pseudo-checkbox`
 * custom-element tag name. Upstream renders it as an actual custom element
 * with an empty template; external CMS styles may target the tag directly
 * (not just the .mat-pseudo-checkbox class).
 */
declare module '@builder.io/qwik' {
  namespace QwikJSX {
    interface IntrinsicElements {
      'mat-pseudo-checkbox': QwikIntrinsicElements['div'] & {
        /** Echoed as a literal attribute — see mat-pseudo-checkbox.tsx. */
        state?: string;
        /** Echoed as a literal attribute — see mat-pseudo-checkbox.tsx. */
        appearance?: string;
      };
      'mat-option': QwikIntrinsicElements['div'] & {
        /** Echoed as a literal attribute — see mat-option.tsx's `value`
         *  doc comment for why (mirrors Angular's static-attribute-syntax
         *  side effect, not a real `[attr.value]` host binding upstream). */
        value?: string;
      };
      /** `<mat-optgroup>` — see mat-optgroup.tsx. */
      'mat-optgroup': QwikIntrinsicElements['div'];
    }
  }
}
