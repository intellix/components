import type {QwikIntrinsicElements} from '@builder.io/qwik';

/**
 * TypeScript augmentation for Angular Material ProgressBar's custom-element tag
 * name. Upstream renders <mat-progress-bar> as an actual custom element with a
 * reflected `mode` attribute; external CMS styles may target the tag directly
 * (not just the .mat-mdc-progress-bar class). See design spec
 * docs/superpowers/specs/2026-07-29-qwik-material-progress-bar-port-design.md
 * §3.1 + §6 deviation #12.
 */
declare module '@builder.io/qwik' {
  namespace QwikJSX {
    interface IntrinsicElements {
      'mat-progress-bar': QwikIntrinsicElements['div'] & {mode?: string};
    }
  }
}
