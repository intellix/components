import type {QwikIntrinsicElements} from '@qwik.dev/core';

// `<mat-tree>`/`<mat-tree-node>`/`<mat-nested-tree-node>` are Material's
// own REAL tag names upstream (not directive-on-a-generic-element
// selectors — `MatTree`/`MatTreeNode`/`MatNestedTreeNode` are separate
// components/directives with these as their actual selectors), so
// `MatTree` renders them directly. Declared against `div`'s attribute set
// (same convention as every other qwik-material custom-element
// declaration, e.g. table's `mat-table`) since only generic attributes
// (`class`, `role`, `style`, the `data-cdk-tree-node-key` lookup hook,
// aria-*) are ever set on them.
declare module '@qwik.dev/core' {
  namespace QwikJSX {
    interface IntrinsicElements {
      'mat-tree': QwikIntrinsicElements['div'];
      'mat-tree-node': QwikIntrinsicElements['div'];
      'mat-nested-tree-node': QwikIntrinsicElements['div'];
    }
  }
}
