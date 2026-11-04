// Top-level convenience re-export of useMatDialog so simple apps can do
// `import { useMatDialog } from '@angular-community/qwik-material'`.
// Full API lives at the per-entry-point exports (e.g. `/dialog`, `/providers`).
export {useMatDialog} from './dialog/public-api';
export type {MatDialog, MatDialogConfig, MatDialogRef} from './dialog/public-api';
