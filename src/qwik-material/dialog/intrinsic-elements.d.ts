import type {QwikIntrinsicElements} from '@builder.io/qwik';

/**
 * TypeScript augmentation for Angular Material Dialog's custom-element tag
 * names. Upstream renders <mat-dialog-container>, <mat-dialog-content>,
 * <mat-dialog-actions> as actual custom elements; external CMS styles may
 * target these tag names directly (not just their .mat-mdc-dialog-* classes).
 * See docs/superpowers/specs/2026-07-20-qwik-material-card-port-design.md §0.
 */
declare module '@builder.io/qwik' {
  namespace QwikJSX {
    interface IntrinsicElements {
      'mat-dialog-container': QwikIntrinsicElements['div'];
      'mat-dialog-content': QwikIntrinsicElements['div'];
      'mat-dialog-actions': QwikIntrinsicElements['div'];
    }
  }
}
