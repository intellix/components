import type {QwikIntrinsicElements} from '@builder.io/qwik';

/**
 * TypeScript augmentation for Angular Material Card's custom-element tag
 * names. Upstream renders <mat-card>, <mat-card-header>, <mat-card-title>,
 * etc. as actual custom elements; external CMS styles may target these tag
 * names directly (not just their .mat-mdc-card-* classes). See design spec
 * docs/superpowers/specs/2026-07-20-qwik-material-card-port-design.md §3.1.
 */
declare module '@builder.io/qwik' {
  namespace QwikJSX {
    interface IntrinsicElements {
      'mat-card': QwikIntrinsicElements['div'];
      'mat-card-header': QwikIntrinsicElements['div'];
      'mat-card-title-group': QwikIntrinsicElements['div'];
      'mat-card-title': QwikIntrinsicElements['div'];
      'mat-card-subtitle': QwikIntrinsicElements['div'];
      'mat-card-content': QwikIntrinsicElements['div'];
      'mat-card-actions': QwikIntrinsicElements['div'];
      'mat-card-footer': QwikIntrinsicElements['div'];
    }
  }
}
