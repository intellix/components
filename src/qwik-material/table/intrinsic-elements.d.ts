import type {QwikIntrinsicElements} from '@builder.io/qwik';

// The flex table form's row/cell elements are custom-element directive
// selectors upstream (`mat-table`, `mat-header-row`, `mat-row`,
// `mat-footer-row`, `mat-header-cell`, `mat-cell`, `mat-footer-cell`) — see
// mat-table.tsx. Declared against `div`'s attribute set (same convention as
// every other qwik-material custom-element declaration, e.g. menu's
// `mat-menu`) since only generic attributes (`class`, `role`, `style`,
// `id`) are ever set on them.
declare module '@builder.io/qwik' {
  namespace QwikJSX {
    interface IntrinsicElements {
      'mat-table': QwikIntrinsicElements['div'];
      'mat-header-row': QwikIntrinsicElements['div'];
      'mat-row': QwikIntrinsicElements['div'];
      'mat-footer-row': QwikIntrinsicElements['div'];
      'mat-header-cell': QwikIntrinsicElements['div'];
      'mat-cell': QwikIntrinsicElements['div'];
      'mat-footer-cell': QwikIntrinsicElements['div'];
    }
  }
}
