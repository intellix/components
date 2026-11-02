# Folded: dialog-container.html
The Angular template merged into `mat-dialog-container.tsx`'s JSX. The
`<ng-template cdkPortalOutlet />` slot becomes `<Slot />` because Qwik's
component projection replaces the CDK portal indirection at the Material
layer (the qwik-cdk overlay outlet is one level up in the tree).
