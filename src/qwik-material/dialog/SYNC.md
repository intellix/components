# qwik-material/dialog sync log

Tracks the sync state between this port and `src/material/dialog/` upstream.
Every deviation from a verbatim copy is recorded here.

Last synced from angular/components commit: <unsynced — initial port>

## Upstream sync state

| File | Upstream path | Sync state | Notes |
|------|---------------|------------|-------|
| `scss/dialog/dialog.scss` | `src/material/dialog/dialog.scss` | synced with one deviation | `@use '@angular/cdk'` rewritten to `@use '../cdk-stub' as cdk` (sass.compile has no nodePackageImporter; only the high-contrast mixin is called via `cdk.*`) |
| `scss/dialog/_dialog-theme.scss` | `src/material/dialog/_dialog-theme.scss` | synced | byte-identical copy |
| `scss/dialog/_m2-dialog.scss` | `src/material/dialog/_m2-dialog.scss` | synced | byte-identical copy |
| `scss/dialog/_m3-dialog.scss` | `src/material/dialog/_m3-dialog.scss` | synced | byte-identical copy |
| `scss/dialog/_dialog-legacy-padding.scss` | `src/material/dialog/_dialog-legacy-padding.scss` | synced | byte-identical copy |

## Synced TypeScript/TSX files

Synced files (mapped from src/material/dialog/):
- mat-dialog-config.ts ← dialog-config.ts (initial port, spec-driven)
- mat-dialog-ref.ts ← dialog-ref.ts (initial port, spec-driven)
- mat-dialog-container.tsx ← dialog-container.ts + dialog-container.html (initial port, spec-driven)
- mat-dialog.ts ← dialog.ts (initial port, spec-driven)
- mat-dialog-title.tsx ← dialog-content-directives.ts (MatDialogTitle portion)
- mat-dialog-content.tsx ← dialog-content-directives.ts (MatDialogContent portion)
- mat-dialog-actions.tsx ← dialog-content-directives.ts (MatDialogActions portion)
- mat-dialog-close.tsx ← dialog-content-directives.ts (MatDialogClose portion)

## Intentionally not ported

- dialog-module.ts (NgModules don't exist in Qwik)
- dialog-container.html (folded into mat-dialog-container.tsx JSX)
- dialog.zone.spec.ts (NgZone-specific change-detection test — no Qwik analogue)
- testing/dialog-harness.ts + dialog-opener.ts (harness deferred; separate project)

## Open deviations

Open deviations (from spec §10):
- MatDialog.open(templateRef, …) removed (no TemplateRef in Qwik).
- MatDialogConfig.viewContainerRef / injector / componentFactoryResolver removed.
- MatDialogConfig.providers → MatDialogConfig.context (OverlayContextOverride[]).
- MatDialogRef.afterOpened(): Observable → afterOpened: Promise<void>.
- MatDialogRef.afterClosed(): Observable → afterClosed: Promise<R>.
- MatDialogRef.beforeClosed(): Observable → beforeClosed: Promise<R>.
- MatDialogRef.backdropClick(): Observable → MatDialogConfig.onBackdropClick$: QRL.
- MatDialogRef.keydownEvents(): Observable → MatDialogConfig.onKeydown$: QRL.
- MatDialog.afterOpened: Subject removed (derive from openDialogs signal).
- MatDialog.afterAllClosed: Observable removed (derive from openDialogs.value.length === 0).
- MatDialog.ngOnDestroy removed.
- MatDialogContainer._animationStateChanged: EventEmitter removed (internal event).
- MatDialogRef.componentRef: ComponentRef<T> removed.
- MatDialogRef.componentInstance: T → componentInstance: Signal<T | null>.
- NgModule MatDialogModule removed.
- Content directives are Qwik components, not directives.
- Angular Material core's _animationsDisabled() replaced by useAnimationsDisabled().
- MatDialogContainer extends CdkDialogContainer → JSX composition.
- MatDialogHarness deferred.
- SCSS theming mixin (mat.dialog-theme) not exposed until qwik-material/core lands. Only structural + prebuilt CSS ships.

## Stub inventory

Stubs are compile-time stand-ins for Angular Material (and CDK) internals that qwik-material has not yet ported. Each stub emits the minimum symbols needed for the dialog SCSS chain to compile; they do **NOT** reproduce upstream behavior. When the corresponding upstream module is eventually ported, the stub should be removed and its callers updated to `@use` the real module.

- `scss/_cdk-stub.scss` — stands in for `@angular/cdk`
- `scss/core/style/_variables.scss` — stands in for `@angular/material/core/style/variables`
- `scss/core/style/_sass-utils.scss` — stands in for `@angular/material/core/style/sass-utils`
- `scss/core/style/_elevation.scss` — stands in for `@angular/material/core/style/elevation`
- `scss/core/theming/_inspection.scss` — stands in for `@angular/material/core/theming/inspection`
- `scss/core/typography/_typography.scss` — stands in for `@angular/material/core/typography/typography`
- `scss/core/tokens/_m2-utils.scss` — stands in for `@angular/material/core/tokens/m2-utils`
- `scss/core/tokens/_token-utils.scss` — stands in for `@angular/material/core/tokens/token-utils`
- `scss/core/tokens/_m3-utils.scss` — stands in for `@angular/material/core/tokens/m3-utils`
- `scss/core/tokens/m3/_md-sys-elevation.scss` — stands in for `@angular/material/core/tokens/m3/md-sys-elevation`
- `scss/core/tokens/m3/_md-sys-state.scss` — stands in for `@angular/material/core/tokens/m3/md-sys-state`
- `scss/core/tokens/m3/_md-sys-color.scss` — stands in for `@angular/material/core/tokens/m3/md-sys-color`
- `scss/core/tokens/m3/_md-sys-shape.scss` — stands in for `@angular/material/core/tokens/m3/md-sys-shape`
- `scss/core/tokens/m3/_md-sys-typescale.scss` — stands in for `@angular/material/core/tokens/m3/md-sys-typescale`
- `scss/core/tokens/m3/_md-sys-motion.scss` — stands in for `@angular/material/core/tokens/m3/md-sys-motion`
- `scss/core/tokens/m3/_theme.scss` — stands in for `@angular/material/core/tokens/m3/theme`

## Remove-when-ported checklist

Each stub represents work deferred to a later qwik-material port. When the corresponding upstream module is ported into qwik-material proper (e.g. `qwik-material/core`), the stub can be removed and its callers updated to `@use` the real module.

- [ ] Remove `scss/_cdk-stub.scss` when `@angular/cdk` ports
- [ ] Remove `scss/core/style/_variables.scss` when `@angular/material/core/style/variables` ports
- [ ] Remove `scss/core/style/_sass-utils.scss` when `@angular/material/core/style/sass-utils` ports
- [ ] Remove `scss/core/style/_elevation.scss` when `@angular/material/core/style/elevation` ports
- [ ] Remove `scss/core/theming/_inspection.scss` when `@angular/material/core/theming/inspection` ports
- [ ] Remove `scss/core/typography/_typography.scss` when `@angular/material/core/typography/typography` ports
- [ ] Remove `scss/core/tokens/_m2-utils.scss` when `@angular/material/core/tokens/m2-utils` ports
- [ ] Remove `scss/core/tokens/_token-utils.scss` when `@angular/material/core/tokens/token-utils` ports
- [ ] Remove `scss/core/tokens/_m3-utils.scss` when `@angular/material/core/tokens/m3-utils` ports
- [ ] Remove `scss/core/tokens/m3/_md-sys-elevation.scss` when `@angular/material/core/tokens/m3/md-sys-elevation` ports
- [ ] Remove `scss/core/tokens/m3/_md-sys-state.scss` when `@angular/material/core/tokens/m3/md-sys-state` ports
- [ ] Remove `scss/core/tokens/m3/_md-sys-color.scss` when `@angular/material/core/tokens/m3/md-sys-color` ports
- [ ] Remove `scss/core/tokens/m3/_md-sys-shape.scss` when `@angular/material/core/tokens/m3/md-sys-shape` ports
- [ ] Remove `scss/core/tokens/m3/_md-sys-typescale.scss` when `@angular/material/core/tokens/m3/md-sys-typescale` ports
- [ ] Remove `scss/core/tokens/m3/_md-sys-motion.scss` when `@angular/material/core/tokens/m3/md-sys-motion` ports
- [ ] Remove `scss/core/tokens/m3/_theme.scss` when `@angular/material/core/tokens/m3/theme` ports

## Prebuilt CSS deviation

qwik-material's `dialog-prebuilt.css` currently ships **structural styles only** (from `dialog.scss`), NOT the theme mixin from `_dialog-theme.scss`. The theme mixin depends on the full Angular Material theming DSL which is out of scope until `qwik-material/core` lands. Consumers who need themed output must `@use` `_dialog-theme.scss` from `scss/dialog/` manually until a `qwik-material/core` prebuilt theme entry lands. This deviation will be echoed in Task 20's finalization.

## Scenario port log (mat-dialog-scenarios.spec.ts)

Source: `src/material/dialog/dialog.spec.ts` — 120 `it()` source lines (11 of those are inside
`runContentElementTests()` which is called twice, giving 131 Angular test executions).

- Ported (service-level assertions against `createMatDialogService`): 16
- Skipped (DOM-render — deferred to Playwright): 77
- Skipped (Angular-only: DI/TemplateRef/NgZone/ChangeDetection/SpyLocation/ngOnDestroy): 39
- Extra Material-only tests (§5 fields + openDialogs signal tracking): 14
- Total test nodes in mat-dialog-scenarios.spec.ts: 146 (30 pass + 116 skip)
- Angular it() source count: 120 (131 executions counting the `runContentElementTests` double-call)

Note: the 16 + 77 + 39 = 132 buckets vs. 131 expected Angular executions differ by 1 because
"should be able to find a dialog by id" was split into two vitest cases (found + unknown-id),
giving one extra ported node. Not double-counted; just a fine-grained expansion of one Angular test.
