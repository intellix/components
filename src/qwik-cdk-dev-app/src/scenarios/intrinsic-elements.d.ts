import type {QwikIntrinsicElements} from '@builder.io/qwik';

/**
 * TypeScript augmentation for the custom-element host tags these parity
 * scenario bodies render to mirror the Angular mirror components' own host
 * tags (src/dev-app/qwik-parity/{cdk-dialog,dialog}.ts):
 * - `cdk-dialog-*-body`: the explicit `selector` each Angular CDK dialog
 *   scenario body component declares.
 * - `ng-component`: Angular's fallback tag for a dynamically-instantiated
 *   component with no `selector` at all (every Material dialog scenario
 *   body — Angular's ComponentPortal still needs a host element).
 * - `parity-snack-bar-content`: the explicit `selector` the
 *   `custom-component` mat-snack-bar scenario's content component declares
 *   (src/dev-app/qwik-parity/snack-bar.ts's `ParitySnackBarContent`).
 * See docs/superpowers/specs/2026-10-27-qwik-material-dom-parity-remediation-design.md.
 */
declare module '@builder.io/qwik' {
  namespace QwikJSX {
    interface IntrinsicElements {
      'cdk-dialog-scenario-body': QwikIntrinsicElements['div'];
      'cdk-dialog-data-body': QwikIntrinsicElements['div'];
      'cdk-dialog-focusable-body': QwikIntrinsicElements['div'];
      'cdk-dialog-labelled-body': QwikIntrinsicElements['div'];
      'cdk-dialog-described-body': QwikIntrinsicElements['div'];
      'ng-component': QwikIntrinsicElements['div'];
      'parity-snack-bar-content': QwikIntrinsicElements['div'];
    }
  }
}
