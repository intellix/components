# Sync log: dialog
Last synced from angular/components commit: <unsynced>

Synced files:
- dialog-config.ts ← src/cdk/dialog/dialog-config.ts (initial port, qwik-cdk spec-driven)

Intentionally not ported:
- dialog-module.ts (NgModules don't exist in Qwik)
- dialog-container.html (placeholder for future tasks)

Open deviations:
- dialog.ts: `open()` does not accept TemplateRef (no TemplateRef in Qwik).
  Accepts a Qwik Component reference only.
- DialogConfig: `viewContainerRef` field removed (no ViewContainerRef in Qwik).
- DialogConfig: `providers` replaced by `context: OverlayContextOverride[]`
  (Angular DI vs Qwik contexts).
- DialogConfig: `bindings` field removed (Angular-specific Signal bindings via input).
- DialogConfig: `directives` field removed (no directives in Qwik).
- DialogConfig: `projectableNodes` field removed (no content projection API like Angular's).
- DialogRef: `closed: Observable<R>` → `Promise<R>` (idiomatic Qwik; one-shot event).
- DialogRef: `backdropClick: Observable` → `DialogConfig.onBackdropClick$: QRL`
  (avoid RxJS, surface in idiomatic shape).
- DialogRef: `keydownEvents: Observable` → `DialogConfig.onKeydown$: QRL` (same).
- DialogRef: `outsidePointerEvents: Observable` → `DialogConfig.onOutsidePointer$: QRL`
  (same).
- Dialog: `afterOpened: Subject` → `<QwikCdkRoot onDialogOpened$>` callback + `openDialogs`
  signal on the Dialog service (avoid RxJS, surface in idiomatic shape).
- Dialog: `afterAllClosed: Observable` → `<QwikCdkRoot onAllDialogsClosed$>` callback (same).

Scenario port log (dialog.spec.ts):
- Ports happen in Task 27. This is a placeholder for the full scenario list.
Total: <N> ported / <M> skipped.
