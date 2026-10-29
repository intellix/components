import type {QwikIntrinsicElements} from '@builder.io/qwik';

/**
 * TypeScript augmentation for `<mat-timepicker>`/`<mat-timepicker-toggle>`'s custom-element tag
 * names — same convention as `<mat-select>`/`<mat-form-field>`/`<mat-option>` elsewhere in this
 * project. See `mat-timepicker-input.tsx`/`mat-timepicker-toggle.tsx`.
 */
declare module '@builder.io/qwik' {
  namespace QwikJSX {
    interface IntrinsicElements {
      /** The empty, `display:none` marker host rendered by `<MatTimepickerInput>` — see that
       *  component's doc comment. */
      'mat-timepicker': QwikIntrinsicElements['div'];
      /** `<mat-timepicker-toggle>` — see `mat-timepicker-toggle.tsx`. */
      'mat-timepicker-toggle': QwikIntrinsicElements['div'];
    }
  }
}
