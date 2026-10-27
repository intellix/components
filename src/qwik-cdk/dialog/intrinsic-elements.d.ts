import type {QwikIntrinsicElements} from '@builder.io/qwik';

/**
 * TypeScript augmentation for CDK Dialog's custom-element tag name. Upstream
 * renders `<cdk-dialog-container>` as an actual custom element (the
 * `CdkDialogContainer` component's selector); external CMS styles may target
 * this tag name directly. See
 * docs/superpowers/specs/2026-10-27-qwik-material-dom-parity-remediation-design.md.
 */
declare module '@builder.io/qwik' {
  namespace QwikJSX {
    interface IntrinsicElements {
      'cdk-dialog-container': QwikIntrinsicElements['div'];
    }
  }
}
