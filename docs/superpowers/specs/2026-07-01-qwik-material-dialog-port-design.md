# qwik-material Dialog port — design spec

Status: approved
Date: 2026-07-01
Related work: [qwik-cdk Dialog port](./2026-06-24-qwik-cdk-dialog-port-design.md) (prerequisite; must be complete)

## Overview

Port `src/material/dialog/` to Qwik as `src/qwik-material/dialog/`, consuming
the qwik-cdk Dialog primitives we already shipped. This is the first
component from Angular Material to be ported; success establishes the pattern
for subsequent components (button, input, form-field, etc.).

The port preserves Material's visual and behavioral contract (MDC classes,
animation timing, aria wiring, content-directive ergonomics) while adopting
the shape lessons from qwik-cdk: no consumer-facing classes, no RxJS, hooks
return QRLs, refs are factory-produced plain objects, and every DOM-touching
path is either inside `useVisibleTask$` or guarded by `typeof document`.

## Goals

- Ship a working `useMatDialog()` hook that opens a Material-styled dialog,
  matches Angular MatDialog's public API surface (with the documented Qwik
  translations), and can be verified end-to-end in a browser.
- Full API surface at once: service, container, 4 content components
  (`MatDialogTitle`, `MatDialogContent`, `MatDialogActions`, `MatDialogClose`),
  `MatDialogRef`, `MatDialogConfig`, animations, MDC-parity CSS.
- Prove the qwik-material package pattern so future components slot in
  without re-litigating package layout, testing strategy, or SSR discipline.
- Record every API divergence from Angular Material in `SYNC.md` so future
  upstream syncs can be reasoned about mechanically.

## Non-goals

- `MatDialogHarness` — deferred to a future Qwik testing-utility project.
- Angular Material's theme mixin system beyond the five SCSS files that ship
  in `src/material/dialog/`. No `mat.dialog-theme($theme)` mixin evaluation
  in a consumer's Sass build until we port `src/material/core/theming/`.
- Backwards-compat shims for `MatDialog.afterOpened: Subject` or
  `MatDialogRef.afterClosed(): Observable`. The shape is documented as a
  deviation and consumers migrate to signal + Promise + QRL callbacks.
- Testing package (harness, opener). Follow-up.
- Additional Material components. This spec is Dialog only.

## Scope

**In scope:**

- All files under `src/material/dialog/` except `dialog.zone.spec.ts` and
  `testing/`.
- Vitest scenario port of `dialog.spec.ts` — service-level scenarios only;
  DOM-render scenarios become `it.skip()` with reasons and get Playwright
  parity tests.
- Playwright parity tests appended to `src/qwik-cdk-parity-tests/` under a
  new `material-dialog/` folder.
- Dev-app routes at `/mat-dialog/*` inside the existing
  `src/qwik-cdk-dev-app/` (no new dev-app package).
- Prebuilt CSS artifact `@angular-community/qwik-material/dialog-prebuilt.css`
  shipped from the copied SCSS.
- New `<QwikMaterialProvider>` component that provides
  `MAT_DIALOG_DEFAULT_OPTIONS`, `MAT_DIALOG_SCROLL_STRATEGY`, and
  `MAT_ANIMATIONS_DISABLED` contexts. Consumers nest it inside
  `<QwikCdkRoot>`; the tokens have implicit defaults so the provider is
  optional.
- SSR-leak lint mirrored into the qwik-material package.

**Out of scope:**

- Angular's `_animationsDisabled()` utility in `../core/animation` — we ship
  a tiny local `useAnimationsDisabled()` reading from a
  `MAT_ANIMATIONS_DISABLED` context. Full `qwik-material/core` package is a
  follow-up.
- `MatDialogHarness` and `MatDialogOpener` (both in `testing/`).
- Any theming DSL (`mat.dialog-theme($theme)` mixin evaluation).

## Success criteria

The port is done when all of the following hold:

1. `pnpm -C src/qwik-material build` succeeds and emits
   `dist/dialog-prebuilt.css`.
2. `pnpm -C src/qwik-material test` runs vitest green using the standard
   safe-subset exclude flags (`overlay-container-outlet.spec.tsx`,
   `portal.spec.tsx`, and any newly-discovered happy-dom-hanging spec).
3. `pnpm -C src/qwik-material typecheck` clean (0 errors).
4. `pnpm -C src/qwik-material lint:no-ssr-leaks` reports "No SSR leaks."
5. Dev-app routes render at least 10 scenarios under
   `/mat-dialog/*` — basic, aria-label, aria-labelledby (via
   `MatDialogTitle`), aria-describedby, role-alertdialog, disable-close,
   close-on-backdrop, close-on-escape, panel-class, has-actions,
   restore-focus, close-with-result. `pnpm -C src/qwik-cdk-dev-app preview`
   serves them.
6. A browser smoke test at `/mat-dialog/basic` confirms: click opens the
   dialog with `mdc-dialog--opening` → `mdc-dialog--open`, Escape /
   backdrop-click / `<MatDialogClose>` closes it with
   `mdc-dialog--closing`, focus is trapped while open and restored on
   close.
7. `src/qwik-material/dialog/SYNC.md` catalogs every deviation from
   Angular Material.
8. No exported classes in `dialog/public-api.ts` — interfaces plus
   `create*` factories only. Zero `export class` in the surface.

## 1 · Architectural decisions (recorded)

Same shape lessons as qwik-cdk (see prior spec §1) apply here. Additional
Material-specific decisions:

- **Composition, not inheritance.** Angular's `MatDialogContainer extends
  CdkDialogContainer` is replaced by JSX composition:
  `<CdkDialogContainer><MatDialogContainer><Body/></MatDialogContainer></CdkDialogContainer>`.
  Both containers own distinct responsibilities: CDK handles focus trap and
  ARIA plumbing at the outer boundary; Material handles animation state,
  MDC surface markup, and content-directive registration inside.
- **Animation timing via JS timers, not `transitionend`.** MDC transitions
  animate multiple properties; a `transitionend` listener fires per
  property and can miss/multi-fire. Timers driven off
  `config.enterAnimationDuration` / `exitAnimationDuration` (default
  150 / 75 ms, matching Angular) give a single deterministic settle point.
- **JS state machine drives class toggling.** A container-local
  `useSignal<'opening' | 'open' | 'closing' | 'closed'>` decides which of
  `mdc-dialog--opening` / `--open` / `--closing` is applied. Same class
  contract as Angular Material.
- **`MatDialogRef` is a plain object.** Same pattern as qwik-cdk's
  `DialogRef`: factory-produced, methods are arrow functions on the
  returned object literal, promise resolvers are closure-captured.
- **Content components use context up-tree, not projection queries.**
  `MatDialogTitle` calls `useContext(MAT_DIALOG_CONTAINER).registerTitleId$`
  on visible task; `MatDialogActions` bumps `actionCount` the same way.
  Replaces Angular's `@ContentChild(MatDialogTitle)` / `@ContentChildren`.
- **Reuse `<QwikCdkRoot>`, add `<QwikMaterialProvider>`.** Material
  tokens live in a new provider that nests inside the CDK root. Keeps
  qwik-cdk agnostic to Material. Provider is optional — all Material
  tokens have implicit defaults.

## 2 · Package and build setup

Package: `@angular-community/qwik-material` at `src/qwik-material/`.

**pnpm workspace:** add `src/qwik-material` to `pnpm-workspace.yaml`.

**package.json** (mirrors qwik-cdk):

```jsonc
{
  "name": "@angular-community/qwik-material",
  "version": "0.0.0",
  "type": "module",
  "private": true,
  "peerDependencies": {
    "@builder.io/qwik": "^1.5.0",
    "@angular-community/qwik-cdk": "workspace:*"
  },
  "devDependencies": { /* same set as qwik-cdk */ },
  "exports": {
    ".": {
      "qwik": "./index.ts",
      "types": "./dist/index.d.ts",
      "import": "./dist/index.js"
    },
    "./dialog": {
      "qwik": "./dialog/index.ts",
      "types": "./dist/dialog/index.d.ts",
      "import": "./dist/dialog/index.js"
    },
    "./dialog-prebuilt.css": "./dist/dialog-prebuilt.css",
    "./scss/*": "./scss/*"
  },
  "files": ["dist", "scss", "*.ts", "*.tsx", "**/*.ts", "**/*.tsx",
            "!**/*.spec.ts", "!**/*.spec.tsx", "!scripts"]
}
```

**Vite config:** copy from `src/qwik-cdk/vite.config.ts`. Same
`qwikVite({csr: true, srcDir: '.'})`, same `dts` plugin, same closeBundle
plugin that compiles `scss/dialog/dialog-prebuilt.scss` to
`dist/dialog-prebuilt.css` and copies `scss/` to `dist/scss/` for consumers
who want to compile from source.

**Vitest setup:** mirror `src/qwik-cdk/vitest.setup.ts`.

**Scripts:** `build`, `dev`, `test`, `test:watch`, `typecheck`,
`lint:no-ssr-leaks` — same names, same behavior as qwik-cdk.

**Package name in commit-msg hook:** the repo's commit-msg hook doesn't
know `qwik-material`. Use scope `multiple` for qwik-material commits (same
convention qwik-cdk followed).

## 3 · Directory structure

```
src/qwik-material/
├── package.json
├── vite.config.ts
├── vitest.setup.ts
├── tsconfig.json
├── SYNC.md                       # global sync log
├── README.md
├── index.ts                      # top-level re-exports
├── scripts/
│   └── lint-no-ssr-leaks.mjs     # copy of qwik-cdk's script
├── scss/
│   ├── _index.scss
│   └── dialog/
│       ├── dialog.scss                    # verbatim from src/material/dialog/
│       ├── _dialog-theme.scss             # verbatim
│       ├── _m2-dialog.scss                # verbatim
│       ├── _m3-dialog.scss                # verbatim
│       ├── _dialog-legacy-padding.scss    # verbatim
│       └── dialog-prebuilt.scss           # NEW: entry that @use's the above
└── dialog/
    ├── SYNC.md                            # per-entry sync log
    ├── public-api.ts                      # mirrors src/material/dialog/public-api.ts
    ├── index.ts                           # Vite entry: re-exports public-api
    ├── mat-dialog.ts                      # useMatDialog + createMatDialogService
    ├── mat-dialog-container.tsx           # MatDialogContainer component
    ├── mat-dialog-ref.ts                  # createMatDialogRef factory + MatDialogRef interface + MatDialogState enum
    ├── mat-dialog-config.ts               # MatDialogConfig interface + AutoFocusTarget/DialogRole/DialogPosition
    ├── mat-dialog-tokens.ts               # MAT_DIALOG_DATA, MAT_DIALOG_DEFAULT_OPTIONS, MAT_DIALOG_SCROLL_STRATEGY, MAT_DIALOG_REF, MAT_DIALOG_CONTAINER
    ├── mat-dialog-title.tsx               # <MatDialogTitle>
    ├── mat-dialog-content.tsx             # <MatDialogContent>
    ├── mat-dialog-actions.tsx             # <MatDialogActions align>
    ├── mat-dialog-close.tsx               # <MatDialogClose result>
    ├── use-animations-disabled.ts         # MAT_ANIMATIONS_DISABLED context + hook
    ├── qwik-material-provider.tsx         # <QwikMaterialProvider>
    ├── parse-css-time.ts                  # parseCssTime helper
    ├── mat-dialog.spec.ts                 # vitest scenario port
    ├── mat-dialog-container.spec.tsx      # scoped container tests
    ├── mat-dialog-ref.spec.ts             # ref factory unit tests
    ├── mat-dialog-config.spec.ts          # config defaults tests
    ├── mat-dialog-content-directives.spec.ts  # title/content/actions/close tests
    ├── dialog-module.removed.md
    ├── dialog-container.html.removed.md   # template folded into JSX
    └── dialog-zone.spec.removed.md        # NgZone-specific test dropped
```

**Per-entry SYNC.md structure** (same as qwik-cdk):

```md
# Sync log: mat-dialog
Last synced from angular/components commit: <sha or "unsynced">
Synced files:
- mat-dialog.ts ← src/material/dialog/dialog.ts (sha @ <sha>)
- ...
Intentionally not ported:
- dialog-module.ts (NgModules)
- dialog-container.html (folded into mat-dialog-container.tsx)
- dialog.zone.spec.ts (NgZone-specific)
Open deviations: see catalog in §10
Scenario port log (mat-dialog.spec.ts):
- ... (per-test status)
```

**File-naming rules:** same as qwik-cdk. Preserve upstream basenames but
add the `mat-` prefix to match the class-name convention (Angular uses
`MatDialog` in `dialog.ts`; qwik-material uses the same class-name but the
file gets `mat-dialog.ts` for grep discoverability across the two packages).
Pure TS files keep `.ts`; component files become `.tsx`.

## 4 · Mapping Angular concepts to Qwik

Same rules as qwik-cdk (see prior spec §4) plus these Material-specific
translations:

| Angular | Qwik |
|---|---|
| `@Service()` on `MatDialog` | `useMatDialog()` hook returning `MatDialog` interface |
| `@Component({...})` on `MatDialogContainer` | `component$<{config, matDialogRef}>` |
| `@Directive({selector: '[matDialogTitle]', ...})` | `<MatDialogTitle>` component |
| `inject(MAT_DIALOG_DATA)` | `useContext(MAT_DIALOG_DATA)` |
| `inject(MatDialogRef)` | `useContext(MAT_DIALOG_REF)` |
| `EventEmitter<LegacyDialogAnimationEvent>` | dropped (internal event, not exposed) |
| `ReplaySubject<void>` (afterOpened) | `Promise<void>` |
| `ReplaySubject<R>` (beforeClosed / afterClosed) | `Promise<R \| undefined>` |
| `Observable<MouseEvent>` (backdropClick) | `MatDialogConfig.onBackdropClick$: QRL` |
| `Observable<KeyboardEvent>` (keydownEvents) | `MatDialogConfig.onKeydown$: QRL` |
| `defer(() => merge(...).pipe(startWith(...)))` (afterOpened aggregate) | Derived `useComputed$` from `openDialogs` signal + Promises |
| `@ContentChild(MatDialogTitle)` | Child calls `useContext(MAT_DIALOG_CONTAINER).registerTitleId$()` on visible task |
| `@ContentChildren(MatDialogActions)` counting | Actions component calls `incrementActionSectionCount$` / decrement on cleanup |
| `_animationsDisabled()` from `../core/animation` | `useAnimationsDisabled()` reading `MAT_ANIMATIONS_DISABLED` context |
| `coerceNumberProperty` for animation-duration | Local `parseCssTime` helper |
| Class inheritance (`MatDialogContainer extends CdkDialogContainer`) | JSX composition: `<CdkDialogContainer><MatDialogContainer>` |

## 5 · Public API

**`<QwikMaterialProvider>`** — optional; nests inside `<QwikCdkRoot>`:

```tsx
import { component$, Slot } from '@builder.io/qwik';
import type { MatDialogConfig } from './mat-dialog-config';
import type { ScrollStrategy } from '@angular-community/qwik-cdk/overlay';

export interface QwikMaterialProviderProps {
  matDialogDefaults?: Partial<MatDialogConfig>;
  matDialogScrollStrategyFactory?: () => ScrollStrategy;
  animationsDisabled?: boolean;
}

export const QwikMaterialProvider = component$<QwikMaterialProviderProps>((props) => {
  useContextProvider(MAT_DIALOG_DEFAULT_OPTIONS, props.matDialogDefaults ?? {});
  useContextProvider(MAT_DIALOG_SCROLL_STRATEGY,
    props.matDialogScrollStrategyFactory ?? (() => createBlockScrollStrategy()));
  useContextProvider(MAT_ANIMATIONS_DISABLED, useSignal(props.animationsDisabled ?? false));
  return <Slot/>;
});
```

**`useMatDialog(): MatDialog`**:

```ts
export interface MatDialog {
  open$: QRL<<C, D = unknown, R = unknown>(
    component: Component<any>,
    config?: MatDialogConfig<D>,
  ) => NoSerialize<MatDialogRef<R, C>> | null>;

  close$: QRL<(id: string, result?: unknown) => void>;
  closeAll$: QRL<() => void>;
  getDialogById$: QRL<(id: string) => NoSerialize<MatDialogRef> | undefined>;

  readonly openDialogs: Signal<readonly NoSerialize<MatDialogRef>[]>;
}

export function useMatDialog(): MatDialog;
```

**`MatDialogRef<R, C>`**:

```ts
export enum MatDialogState { OPEN, CLOSING, CLOSED }

export interface MatDialogRef<R = unknown, C = unknown> {
  readonly id: string;
  readonly config: MatDialogConfig;
  readonly componentInstance: Signal<C | null>;
  readonly state: Signal<MatDialogState>;

  readonly afterOpened: Promise<void>;
  readonly afterClosed: Promise<R | undefined>;
  readonly beforeClosed: Promise<R | undefined>;

  close(result?: R, options?: {focusOrigin?: FocusOrigin}): void;
  updatePosition(position?: DialogPosition): MatDialogRef<R, C>;
  updateSize(width?: string, height?: string): MatDialogRef<R, C>;
  addPanelClass(classes: string | string[]): MatDialogRef<R, C>;
  removePanelClass(classes: string | string[]): MatDialogRef<R, C>;
}
```

**`MatDialogConfig<D>`** — union of CDK's `DialogConfig` fields with
Material additions:

```ts
export type AutoFocusTarget = 'dialog' | 'first-tabbable' | 'first-heading' | string;
export type DialogRole = 'dialog' | 'alertdialog';
export interface DialogPosition {
  top?: string; bottom?: string; left?: string; right?: string;
}

export interface MatDialogConfig<D = unknown> {
  // CDK-inherited fields (subset shown; all fields from qwik-cdk DialogConfig apply)
  id?: string;
  role?: DialogRole;
  panelClass?: string | string[];
  hasBackdrop?: boolean;
  backdropClass?: string | string[];
  disableClose?: boolean;
  width?: string; height?: string;
  minWidth?: string | number; minHeight?: string | number;
  maxWidth?: string | number; maxHeight?: string | number;
  direction?: 'ltr' | 'rtl';
  ariaDescribedBy?: string | null;
  ariaLabelledBy?: string | null;
  ariaLabel?: string | null;
  ariaModal?: boolean;                        // defaults true
  autoFocus?: AutoFocusTarget | false;
  restoreFocus?: boolean | string | HTMLElement;
  closeOnNavigation?: boolean;
  data?: D | null;
  scrollStrategy?: ScrollStrategy;
  context?: OverlayContextOverride[];

  // Callbacks (Qwik replacement for RxJS streams)
  onBackdropClick$?: QRL<(e: MouseEvent) => void>;
  onKeydown$?: QRL<(e: KeyboardEvent) => void>;
  onOutsidePointer$?: QRL<(e: MouseEvent) => void>;

  // Material-specific
  enterAnimationDuration?: number | string;   // default 150 (ms)
  exitAnimationDuration?: number | string;    // default 75 (ms)
  position?: DialogPosition;
}
```

**Context tokens** (in `mat-dialog-tokens.ts`):

- `MAT_DIALOG_DATA: ContextId<unknown>`
- `MAT_DIALOG_DEFAULT_OPTIONS: ContextId<Partial<MatDialogConfig>>`
- `MAT_DIALOG_SCROLL_STRATEGY: ContextId<() => ScrollStrategy>`
- `MAT_DIALOG_REF: ContextId<NoSerialize<MatDialogRef>>`
- `MAT_DIALOG_CONTAINER: ContextId<MatDialogContainerAPI>` — internal;
  registerTitleId$, incrementActionSectionCount$, etc.
- `MAT_ANIMATIONS_DISABLED: ContextId<Signal<boolean>>`

**Content components:**

```tsx
<MatDialogTitle id?="dialog-title">Title</MatDialogTitle>
<MatDialogContent>Body</MatDialogContent>
<MatDialogActions align?="start" | "center" | "end">
  <button>Cancel</button>
  <MatDialogClose result?="ok">OK</MatDialogClose>
</MatDialogActions>
```

## 6 · Internal architecture

Full architecture is described in the brainstorm transcript §3; key
mechanics summarized here.

### Component tree

```
<QwikCdkRoot>
  <QwikMaterialProvider>
    <SomeConsumer/>            ← calls useMatDialog().open$(MyBody, cfg)
  </QwikMaterialProvider>
</QwikCdkRoot>
<OverlayContainerOutlet>       ← qwik-cdk, empty during SSR
  <OverlayHost entry={e}>
    <div class="cdk-overlay-host">
      {hasBackdrop && <div class="cdk-overlay-backdrop"/>}
      <div class="cdk-overlay-pane">
        <CdkDialogContainer>                    ← qwik-cdk (focus trap, aria)
          <MatDialogContainer config matDialogRef>   ← NEW
            <MyBody />
          </MatDialogContainer>
        </CdkDialogContainer>
      </div>
    </div>
  </OverlayHost>
</OverlayContainerOutlet>
```

### `useMatDialog()` — open flow

1. Read `useContext(QWIK_CDK)` and `useContext(MAT_DIALOG_DEFAULT_OPTIONS)`.
2. Read `useDialog()` from qwik-cdk.
3. `open$` QRL body:
   - Merge `defaults ⨯ open()-config` into plain `MatDialogConfig`.
   - Build a CDK `DialogConfig` — most fields map 1:1. `scrollStrategy`
     falls back to `useContext(MAT_DIALOG_SCROLL_STRATEGY)()`.
   - Wrap the consumer body in a `MatDialogContainerWrapper` internal
     component that receives `{config, ContentComponent, contentProps,
     matDialogRef}` as plain-object props (config spread, no class
     identity — same anti-pattern qwik-cdk works around).
   - Call `cdk.open$(MatDialogContainerWrapper, cdkConfig)`.
   - Build `matRef = createMatDialogRef({cdkRef, config, animationController})`.
   - Store `id → matRef` in a local `useStore<{ [id: string]:
     NoSerialize<MatDialogRef> }>` provided by useMatDialog.
   - Return `noSerialize(matRef)`.

### `createMatDialogRef` factory

Takes as arguments (caller — the `useMatDialog` hook body — creates the
signals via `useSignal` and passes them in; the factory itself does NOT
call any hook):

- `state: Signal<MatDialogState>` (caller inits to `OPEN`)
- `componentInstance: Signal<C | null>`
- `cdkRef: NoSerialize<CdkDialogRef>`
- `config: MatDialogConfig`

Closure captures internally (created inside the factory body, not passed
in):

- Three resolvers: `resolveOpened`, `resolveBeforeClosed`, `resolveClosed`
  — captured from three `new Promise<T>(r => { … = r })` calls at factory
  entry, following the same pattern as qwik-cdk's `createDialogRef`.

Public methods:
- `close(result)` — if `state !== OPEN` returns; sets `state = CLOSING`;
  fires `resolveBeforeClosed(result)`; container's exit-animation task
  observes the CLOSING and after `exitAnimationDuration` calls
  `cdkRef.close(result)` and `resolveClosed(result)`.
- `updatePosition/updateSize/addPanelClass/removePanelClass` — delegate to
  `cdkRef`, return `this` for chaining.

Private symbols (accessible from `MatDialogContainer` via a small internal
API exposed through a shared module):
- `MARK_OPENED` — container calls after enter animation ends; resolves
  `afterOpened`.
- `MARK_CLOSED` — container calls after exit animation ends; resolves
  `afterClosed` and transitions state to `CLOSED`.

### `MatDialogContainer` — behavior

Full code sketch in the brainstorm transcript §3. Summary:

- Local signal `state: 'opening' | 'open' | 'closing' | 'closed'` drives
  MDC class toggling.
- `useVisibleTask$` on mount: schedules `state = 'open'` after
  `enterAnimationDuration` ms, then calls `matDialogRef[MARK_OPENED]()`.
  Skips the timer if `animationsDisabled`.
- `useTask$` tracks `matDialogRef.state.value === CLOSING`: transitions to
  `'closing'`, schedules `matDialogRef[MARK_CLOSED]()` after
  `exitAnimationDuration` ms.
- Provides `MAT_DIALOG_REF` and `MAT_DIALOG_CONTAINER` contexts so
  descendants (content components, consumer body) can wire up.
- Title-id registration and action-count are managed via signal-backed
  stores; `aria-labelledby` uses `titleIds[0]`.

### Content components

- **`MatDialogTitle`**: `useSignal<HTMLElement>()`. On visible task:
  auto-generate id if not provided, call `registerTitleId$(id)`, on
  cleanup call `unregisterTitleId$(id)`. Renders `<h2 class="mat-mdc-dialog-title
  mdc-dialog__title"><Slot/></h2>`.
- **`MatDialogContent`**: pure styling. Renders `<div class="mat-mdc-dialog-content
  mdc-dialog__content"><Slot/></div>`.
- **`MatDialogActions`**: takes `align?: 'start' | 'center' | 'end'`. On
  visible task: `incrementActionSectionCount$()`; on cleanup:
  `decrementActionSectionCount$()`. Renders `<div class="mat-mdc-dialog-actions
  mdc-dialog__actions mat-mdc-dialog-actions-align-{align}"><Slot/></div>`.
- **`MatDialogClose`**: reads `useContext(MAT_DIALOG_REF)`. Renders
  `<button class="mat-mdc-dialog-close" onClick$={$(() =>
  ref?.close(props.result))}><Slot/></button>`.

### `useAnimationsDisabled` and `parseCssTime`

```ts
export const MAT_ANIMATIONS_DISABLED = createContextId<Signal<boolean>>(
  'qwik-material/animations-disabled',
);
// A frozen no-animation-disabled default. Consumers who don't mount
// <QwikMaterialProvider> get this shim; treating it as a real Signal is
// safe because it's read-only from the container's perspective.
const _ANIMATIONS_ENABLED_DEFAULT: Signal<boolean> = Object.freeze({value: false}) as Signal<boolean>;
export function useAnimationsDisabled(): Signal<boolean> {
  return useContext(MAT_ANIMATIONS_DISABLED, _ANIMATIONS_ENABLED_DEFAULT);
}

export function parseCssTime(v: number | string | undefined | null): number | null {
  if (v == null) return null;
  if (typeof v === 'number') return v;
  const m = v.match(/^(\d+(\.\d+)?)(ms|s)?$/);
  if (!m) return null;
  const n = parseFloat(m[1]);
  return m[3] === 's' ? n * 1000 : n;
}
```

## 7 · SCSS strategy

Copy the five source files verbatim to `src/qwik-material/scss/dialog/`.
Add `scss/dialog/dialog-prebuilt.scss`:

```scss
@use './dialog';
@use './dialog-theme' as *;
// Emit the structural + theme layers into one prebuilt stylesheet.
// Consumers who want tree-shaking can @use the individual files.
```

Vite closeBundle plugin (copied from qwik-cdk) compiles
`dialog-prebuilt.scss` to `dist/dialog-prebuilt.css` and copies `scss/` to
`dist/scss/`.

Any Sass `@use` reference in the copied files that points at
Angular Material core (`@use '../core/tokens/...'`, `@use '../core/style/private'`,
etc.) gets a locally-shipped stub file at the same relative path with the
minimum symbols needed to compile. Each stub file starts with a
`// STUB — see SYNC.md` comment and is registered in the SYNC.md open
deviations list. The stubs are removed when the corresponding upstream
files are ported in a future project.

CSS-parity is verified by a `scripts/diff-prebuilt-css.mjs` script (copied
from qwik-cdk) that compiles both `@angular/material/prebuilt-themes/*`
dialog rules and our `dist/dialog-prebuilt.css` and asserts they match
modulo whitespace + selector-order permutations. Any diff is reported per
selector.

## 8 · SSR behavior

- Dialogs are opened only from client interactions; `openDialogs.value` is
  `[]` during SSR; `<OverlayContainerOutlet>` renders nothing.
- All animation timers live in `useVisibleTask$` — never run server-side.
- Content-component registrations (title id, action count) live in
  `useVisibleTask$` — server render emits the static markup with no side
  effects.
- `useAnimationsDisabled()` reads context; SSR renders whatever the
  current value is.
- Prebuilt CSS ships static.
- `scripts/lint-no-ssr-leaks.mjs` (copied from qwik-cdk) runs against
  `src/qwik-material/`. Guard rule: every `document.` / `window.` /
  `navigator.` / `getComputedStyle(` / `requestAnimationFrame(` call must
  live inside `useVisibleTask$` OR be guarded by `typeof <global> !==
  'undefined'`. `isBrowser` from `@builder.io/qwik/build` is NOT accepted
  because the qwikVite CSR-optimizer inlines it to `true` and DCE strips
  the guard (see qwik-cdk final-fix commit `a1e69c1f6`).

## 9 · Testing

**Vitest port from `src/material/dialog/dialog.spec.ts`** (2534 LOC,
~120 `it(...)` blocks):

Categorize each block into one of three buckets while porting:
- **ported** — service-level scenario runs green in vitest. Examples: open
  returns a ref; multiple opens increment openDialogs count; close(result)
  resolves afterClosed with result; disableClose blocks Escape close; id
  set from config; id auto-generated when unset; role sets aria; ariaLabel
  overrides ariaLabelledBy; MAT_DIALOG_DATA context receives config.data;
  scrollStrategy from config takes precedence over default.
- **skipped-DOM** — `it.skip(<name>, () => { /* Reason: DOM render */ })`.
  Add matching Playwright parity spec. Examples: aria-labelledby wires to
  `MatDialogTitle`'s id; enter/exit animation classes toggle in order;
  restoreFocus returns focus to the trigger; backdrop click closes when
  not disableClose; content-projection with `<MatDialogTitle>`.
- **skipped-Angular-only** — `it.skip(<name>, () => { /* Reason: … */ })`.
  Examples: `ViewContainerRef` injection; `Injector`-based DI; NgZone
  change detection; TemplateRef overload of open().

Ratios (rough estimate, to be reconciled during the port):
~35–45 ported / ~55–70 skipped-DOM / ~15–25 skipped-Angular-only.

**`dialog.zone.spec.ts`** is not ported. A one-line
`dialog-zone.spec.removed.md` records the drop with reason "NgZone-specific
change-detection test".

**Playwright parity** — extend `src/qwik-cdk-parity-tests/` with a
`material-dialog/` folder. One spec per skipped-DOM scenario. Each spec
runs against the qwik-cdk-dev-app preview server; each corresponding
`/mat-dialog/*` route stages the scenario.

**Dev-app routes** — under `src/qwik-cdk-dev-app/src/routes/mat-dialog/`.
At minimum:

- `/basic` — opens `<MatDialogContainer>` with plain text body
- `/aria-label`
- `/aria-labelledby` (via `<MatDialogTitle>`)
- `/aria-describedby`
- `/role-alertdialog`
- `/disable-close`
- `/close-on-backdrop`
- `/close-on-escape`
- `/panel-class`
- `/has-actions` (with `<MatDialogActions>`)
- `/restore-focus`
- `/close-with-result` — clicks a button that opens, closes with `'result-a'`,
  reads `ref.afterClosed`, renders the result.

Each route mounts `<QwikCdkRoot><QwikMaterialProvider>...` at its top.

## 10 · Open deviations from Angular Material (catalog)

Every API divergence recorded here; future syncers consult this list
before "fixing" a deviation.

| Deviation | Reason |
|---|---|
| `MatDialog.open(templateRef, …)` overload removed | No TemplateRef in Qwik. |
| `MatDialogConfig.viewContainerRef` removed | No ViewContainerRef in Qwik. |
| `MatDialogConfig.injector` removed | No Angular DI in Qwik. |
| `MatDialogConfig.componentFactoryResolver` removed | No CFR in Qwik. |
| `MatDialogConfig.providers` replaced by `context: OverlayContextOverride[]` | Qwik contexts vs Angular DI. Inherits qwik-cdk approach. |
| `MatDialogRef.afterOpened(): Observable<void>` → `.afterOpened: Promise<void>` | One-shot event; idiomatic Qwik. |
| `MatDialogRef.afterClosed(): Observable<R>` → `.afterClosed: Promise<R \| undefined>` | Same. |
| `MatDialogRef.beforeClosed(): Observable<R>` → `.beforeClosed: Promise<R \| undefined>` | Same. |
| `MatDialogRef.backdropClick(): Observable` → `MatDialogConfig.onBackdropClick$: QRL` | Move to config-time; avoid RxJS. |
| `MatDialogRef.keydownEvents(): Observable` → `MatDialogConfig.onKeydown$: QRL` | Same. |
| `MatDialog.afterOpened: Subject` removed | Consumers derive state from `openDialogs` signal. |
| `MatDialog.afterAllClosed: Observable` removed | Same — derive `openDialogs.value.length === 0`. |
| `MatDialog.ngOnDestroy` removed | No NgOnDestroy; consumer teardown via `useVisibleTask$` cleanup. |
| `MatDialogContainer._animationStateChanged: EventEmitter` removed | Internal event, not part of consumer surface. |
| `MatDialogRef.componentRef: ComponentRef<T>` removed | No ComponentRef in Qwik; components are consumed as `Component<P>`. |
| `MatDialogRef.componentInstance: T` → `componentInstance: Signal<T \| null>` | Signal-backed (matches qwik-cdk DialogRef). |
| `NgModule` (`MatDialogModule`) removed | No NgModules in Qwik. |
| Content directives (`MatDialogTitle`, etc.) are Qwik components, not directives | No directives in Qwik. Same public JSX shape. |
| `MatDialogHarness` deferred to a follow-up project | Needs a qwik-testing package first. |
| Angular Material core's `_animationsDisabled()` replaced by `useAnimationsDisabled()` reading a context | No `../core/animation` yet in qwik-material. |
| `MatDialogContainer extends CdkDialogContainer` → JSX composition | No class inheritance across component boundaries in Qwik. |

## 11 · Upstream sync workflow

Same discipline as qwik-cdk. `src/qwik-material/SYNC.md` (global) tracks
per-entry `Last synced from` commits. Syncing = walking a Material commit
range file-by-file, applying the corresponding Qwik translation from §4
and §10, updating the per-entry SYNC.md. Any new field on `MatDialogConfig`
gets a signal or plain-data mapping; any new observable on `MatDialogRef`
becomes a Promise or QRL callback per the catalog rules.
