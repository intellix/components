import type {QwikIntrinsicElements} from '@builder.io/qwik';

/**
 * TypeScript augmentation for the custom-element host tags these parity
 * scenario bodies render to mirror the Angular mirror components' own host
 * tags (src/dev-app/qwik-parity/{cdk-dialog,dialog,bottom-sheet}.ts):
 * - `cdk-dialog-*-body`: the explicit `selector` each Angular CDK dialog
 *   scenario body component declares.
 * - `ng-component`: Angular's fallback tag for a dynamically-instantiated
 *   component with no `selector` at all (every Material dialog scenario
 *   body — Angular's ComponentPortal still needs a host element).
 * - `parity-snack-bar-content`: the explicit `selector` the
 *   `custom-component` mat-snack-bar scenario's content component declares
 *   (src/dev-app/qwik-parity/snack-bar.ts's `ParitySnackBarContent`).
 * - `bottom-sheet-*-body`: the explicit `selector` each Angular bottom sheet
 *   scenario body component declares (see bottom-sheet.ts's header comment —
 *   unlike dialog.ts's bodies, every one of these has a real selector).
 * - `*-overview-example` / `*-determinate-example`: the `selector` each
 *   material.angular.dev docs example component declares
 *   (`src/components-examples/material/<component>/<example-id>/
 *   <example-id>-example.ts`), rendered unmodified by
 *   `src/dev-app/qwik-parity/examples.ts` at `/qwik-parity/<component>/example`.
 *   Each Qwik `<component>/example` route renders the SAME tag as its own
 *   root so a consumer's CMS selectors targeting the real example's host tag
 *   (and any `:host` style rewritten onto it — see each route's copied
 *   example CSS) still match.
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
      'bottom-sheet-scenario-body': QwikIntrinsicElements['div'];
      'bottom-sheet-nav-body': QwikIntrinsicElements['div'];
      'bottom-sheet-focusable-body': QwikIntrinsicElements['div'];
      'bottom-sheet-data-body': QwikIntrinsicElements['div'];
      'bottom-sheet-first-body': QwikIntrinsicElements['div'];
      'bottom-sheet-second-body': QwikIntrinsicElements['div'];
      'badge-overview-example': QwikIntrinsicElements['div'];
      'button-overview-example': QwikIntrinsicElements['div'];
      'button-toggle-overview-example': QwikIntrinsicElements['div'];
      'card-overview-example': QwikIntrinsicElements['div'];
      'checkbox-overview-example': QwikIntrinsicElements['div'];
      'divider-overview-example': QwikIntrinsicElements['div'];
      'grid-list-overview-example': QwikIntrinsicElements['div'];
      'icon-overview-example': QwikIntrinsicElements['div'];
      'list-overview-example': QwikIntrinsicElements['div'];
      'progress-bar-determinate-example': QwikIntrinsicElements['div'];
      'progress-spinner-overview-example': QwikIntrinsicElements['div'];
      'radio-overview-example': QwikIntrinsicElements['div'];
      'slide-toggle-overview-example': QwikIntrinsicElements['div'];
      'toolbar-overview-example': QwikIntrinsicElements['div'];
    }
  }
}
