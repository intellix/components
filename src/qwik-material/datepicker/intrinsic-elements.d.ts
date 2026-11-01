import type {QwikIntrinsicElements} from '@qwik.dev/core';

/**
 * TypeScript augmentation for this port's custom-element tag names — same convention as
 * `<mat-select>`/`<mat-form-field>`/`<mat-option>`/`<mat-timepicker>` elsewhere in this project.
 */
declare module '@qwik.dev/core' {
  namespace QwikJSX {
    interface IntrinsicElements {
      'mat-calendar': QwikIntrinsicElements['div'];
      'mat-calendar-header': QwikIntrinsicElements['div'];
      'mat-month-view': QwikIntrinsicElements['div'];
      'mat-year-view': QwikIntrinsicElements['div'];
      'mat-multi-year-view': QwikIntrinsicElements['div'];
      /** The empty, marker-only host rendered alongside the native `<input>` — see
       *  `mat-datepicker-input.tsx`. */
      'mat-datepicker': QwikIntrinsicElements['div'];
      'mat-date-range-picker': QwikIntrinsicElements['div'];
      'mat-datepicker-toggle': QwikIntrinsicElements['div'];
      'mat-datepicker-content': QwikIntrinsicElements['div'];
      'mat-date-range-input': QwikIntrinsicElements['div'];
    }
  }
}
