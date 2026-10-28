import type {QwikIntrinsicElements} from '@builder.io/qwik';

/**
 * TypeScript augmentation for Angular Material Snack Bar's custom-element
 * tag names. Upstream renders <mat-snack-bar-container> and
 * <simple-snack-bar> as actual custom elements; external CMS styles may
 * target these tag names directly (not just their .mat-mdc-snack-bar-* /
 * .mat-mdc-simple-snack-bar classes). See qwik-material/dialog's identical
 * augmentation for <mat-dialog-container>.
 */
declare module '@builder.io/qwik' {
  namespace QwikJSX {
    interface IntrinsicElements {
      'mat-snack-bar-container': QwikIntrinsicElements['div'];
      'simple-snack-bar': QwikIntrinsicElements['div'];
    }
  }
}
