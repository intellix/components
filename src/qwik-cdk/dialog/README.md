# @angular-community/qwik-cdk/dialog

Qwik port of [@angular/cdk/dialog](https://github.com/angular/components/tree/main/src/cdk/dialog).
Exports `useDialog`, the `Dialog` interface + `DIALOG` context + `createDialogService` factory, `DialogConfig`, `DialogRef`, `CdkDialogContainer`, and the dialog context tokens (`DIALOG_DATA`, `DEFAULT_DIALOG_CONFIG`, `DIALOG_SCROLL_STRATEGY`).
Observable streams (`DialogRef.closed`, `backdropClick`, `keydownEvents`, `outsidePointerEvents`) become a `Promise` + `QRL` callbacks (`onBackdropClick$`, `onKeydown$`, `onOutsidePointer$`) on `DialogConfig`. See SYNC.md for the full porting deviations list.
