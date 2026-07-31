import type {QwikIntrinsicElements} from '@builder.io/qwik';

/**
 * TypeScript augmentation for Angular Material Progress Spinner's custom-element
 * tag names. Upstream renders <mat-progress-spinner> AND <mat-spinner> as actual
 * custom elements with a reflected `mode` attribute; external CMS styles may
 * target either tag directly (not just the .mat-mdc-progress-spinner class).
 * See design spec
 * docs/superpowers/specs/2026-07-31-qwik-material-progress-spinner-port-design.md
 * §3.1 + §6 deviation #13.
 */
declare module '@builder.io/qwik' {
  namespace QwikJSX {
    interface IntrinsicElements {
      'mat-progress-spinner': QwikIntrinsicElements['div'] & {mode?: string};
      'mat-spinner': QwikIntrinsicElements['div'] & {mode?: string};
    }
  }
}
