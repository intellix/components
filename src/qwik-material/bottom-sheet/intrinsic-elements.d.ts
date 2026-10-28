import type {QwikIntrinsicElements} from '@builder.io/qwik';

/**
 * TypeScript augmentation for Angular Material Bottom Sheet's custom-element
 * tag name. Upstream renders <mat-bottom-sheet-container> as an actual
 * custom element; external CMS styles may target this tag name directly
 * (not just its .mat-bottom-sheet-container class). See
 * docs/superpowers/specs/2026-10-27-qwik-material-dom-parity-remediation-design.md.
 */
declare module '@builder.io/qwik' {
  namespace QwikJSX {
    interface IntrinsicElements {
      'mat-bottom-sheet-container': QwikIntrinsicElements['div'];
    }
  }
}
