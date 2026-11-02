import type {QwikIntrinsicElements} from '@qwik.dev/core';

/**
 * TypeScript augmentation for the custom-element host tags rendered by the ported
 * material.angular.dev docs examples under `src/qwik-cdk-dev-app/src/routes/<component>/`
 * (route segments `example`, `example-input`; see `src/dev-app/qwik-parity/examples.ts` for the
 * Angular side). Each tag mirrors the real
 * example component's own Angular `selector` — Angular always creates a real host element for a
 * component selector, even one with an empty template body otherwise, and the parity harness
 * compares tag names, so the Qwik port must render the same custom element as its own root. Same
 * category/rationale as `../scenarios/intrinsic-elements.d.ts` and every per-component
 * `intrinsic-elements.d.ts` (e.g. `qwik-material/menu/intrinsic-elements.d.ts`).
 */
declare module '@qwik.dev/core' {
  namespace QwikJSX {
    interface IntrinsicElements {
      'autocomplete-simple-example': QwikIntrinsicElements['div'];
      'form-field-overview-example': QwikIntrinsicElements['div'];
      'input-overview-example': QwikIntrinsicElements['div'];
      'select-overview-example': QwikIntrinsicElements['div'];
      'chips-overview-example': QwikIntrinsicElements['div'];
      'slider-overview-example': QwikIntrinsicElements['div'];
      'menu-overview-example': QwikIntrinsicElements['div'];
      'tooltip-overview-example': QwikIntrinsicElements['div'];
      'snack-bar-overview-example': QwikIntrinsicElements['div'];
      'bottom-sheet-overview-example': QwikIntrinsicElements['div'];
      'bottom-sheet-overview-example-sheet': QwikIntrinsicElements['div'];
      'dialog-overview-example': QwikIntrinsicElements['div'];
      'dialog-overview-example-dialog': QwikIntrinsicElements['div'];
    }
  }
}
