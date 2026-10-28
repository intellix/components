// `MatTreeNodeToggle extends CdkTreeNodeToggle` with an empty body
// upstream (`src/material/tree/toggle.ts`) — no behavior or DOM
// differences, just the Material-namespaced import path. A direct
// re-export is equally faithful.
export {CdkTreeNodeToggle as MatTreeNodeToggle} from '@angular-community/qwik-cdk/tree';
export type {CdkTreeNodeToggleProps as MatTreeNodeToggleProps} from '@angular-community/qwik-cdk/tree';
