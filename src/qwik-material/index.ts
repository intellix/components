// Top-level convenience re-exports of the QwikMaterialProvider and useMatDialog
// so simple apps can do `import { useMatDialog } from '@angular-community/qwik-material'`.
// Full API lives at the per-entry-point exports (e.g. `/dialog`).
export {useMatDialog, QwikMaterialProvider} from './dialog/public-api';
export type {MatDialog, MatDialogConfig, MatDialogRef} from './dialog/public-api';
