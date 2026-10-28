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
      /** `<mat-option>` — see mat-option.tsx. */
      'mat-option': QwikIntrinsicElements['div'];
      /** `<mat-optgroup>` — see mat-optgroup.tsx. */
      'mat-optgroup': QwikIntrinsicElements['div'];
    }
  }
}
