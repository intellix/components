# qwik-cdk: Dialog port + CDK foundation

**Status:** Design approved by user (brainstorming session 2026-06-24); ready for implementation planning.
**Author:** Dominic + Claude (collaborative brainstorm)
**Spec date:** 2026-06-24
**Repository:** [angular/components](https://github.com/angular/components)

## Overview

Stand up a new package `@angular-community/qwik-cdk` at [src/qwik-cdk/](../../../src/qwik-cdk/) inside this repository. The package is a Qwik port of `@angular/cdk` with full SSR and CSR support, signal-based reactivity, and a public DOM/SCSS surface that is identical to the Angular CDK so that consumer apps can be pixel-perfect.

This first spec ports only the **Dialog** entry-point, plus the minimum CDK foundation Dialog depends on. Subsequent specs will port additional entry-points and, eventually, an `@angular/material` equivalent layered on top.

## Goals

1. A Qwik app can `import { useDialog } from '@angular-community/qwik-cdk/dialog'`, open a dialog rendering an arbitrary Qwik component, close it with a result, and observe identical DOM output to the equivalent Angular CDK call (same elements, same classes, same ARIA attributes, same inline styles).
2. The public SCSS API is byte-identical to `@angular/cdk` for the entry-points ported (overlay, a11y). Consumer Sass files swapping `@angular/cdk` → `@angular-community/qwik-cdk` should compile to the same CSS.
3. SSR: importing `@angular-community/qwik-cdk` on the server does not crash, no `document`/`window` access on the server, the app resumes on the client cleanly, and opening a dialog after resume works.
4. The Vitest scenario port of CDK's specs passes for every non-Angular-specific scenario. Skipped scenarios are catalogued and justified.
5. Playwright structural-parity tests compare CDK's dev-app and qwik-cdk's dev-app rendering the same scenarios and assert that the resulting DOM trees match (tags, classes, attributes, computed styles for a curated set).
6. A documented upstream sync workflow lets us pull Angular CDK fixes into qwik-cdk via a repeatable, manual-but-tractable process.

## Non-goals

- **Material / M3.** No Material components, no theming tokens, no prebuilt themes, no design tokens. M3 lives in `@angular/material`, not CDK; Material will be designed as a separate spec layered on top of qwik-cdk later.
- **Other CDK entry-points.** Drag-drop, table, tree, menu, listbox, stepper, accordion, scrolling, layout, observers, clipboard, collections, text-field, testing harnesses are explicitly deferred.
- **Schematics.** No `ng add`-style scaffolding.
- **Publishing to npm.** The package name is fixed now (`@angular-community/qwik-cdk`) for stability of import paths, but publishing is a later decision.
- **Bazel integration.** qwik-cdk lives outside the existing Bazel graph as a sibling pnpm workspace package. Existing CDK Bazel builds are untouched.
- **CI integration into the main repo workflows.** A `pnpm test:qwik-cdk` root script exists; wiring it into `.github/workflows/*` is deferred.

## Scope of CDK ported in this spec

| Entry-point | Reason ported now |
|---|---|
| `dialog` | The target component. |
| `overlay` | Dialog is built on overlay. |
| `portal` | Required by overlay's public API; mostly collapsed (see §4). |
| `a11y` (subset) | `FocusTrap`, `FocusMonitor`, `InputModalityDetector`, `InteractivityChecker`, `_IdGenerator`. Other a11y exports stub out. |
| `platform` | `isBrowser` and shadow DOM helpers used everywhere. |
| `bidi` | `Directionality` used by overlay's `direction` config. |
| `coercion` | Pure utilities used in configs (e.g. CSS-pixel coercion). |
| `keycodes` | Constants used by dispatcher. |

## Success criteria

1. Demo: side-by-side `dev-app` (Angular) and `qwik-cdk-dev-app` (Qwik) with the same set of dialog scenarios. Manual visual diff = pass.
2. Vitest: ported scenarios pass. Skip log in each entry-point `SYNC.md` accounts for every CDK scenario not ported.
3. Playwright parity: ≥20 named Dialog scenarios pass the structural-diff comparison.
4. SCSS byte-diff: `dist/overlay-prebuilt.css` matches `@angular/cdk`'s prebuilt CSS modulo source-map and copyright headers.
5. SSR: `pnpm -C src/qwik-cdk-dev-app build && pnpm -C src/qwik-cdk-dev-app preview` boots without `document is not defined` errors; opening a dialog after resume works.
6. Lint: the no-SSR-leaks grep audit passes (no unguarded `document.`/`window.` outside `useVisibleTask$` or `.spec.ts`).

---

## 1 · Architectural decisions (recorded)

| Decision | Choice | Rationale |
|---|---|---|
| Scope | Just CDK now; design with hooks for Material later | Smaller surface, faster first port. Material is a separate concern. |
| API shape | Imperative service-like hook: `useDialog()` returning `{ open, closeAll, openDialogs }` | Closest to CDK ergonomics, simplest test port, most natural 1:1 mapping. |
| File layout | Mirror `src/cdk/` 1:1 in `src/qwik-cdk/` | Cherry-picking upstream commits depends on it. |
| Test strategy | Vitest scenario port **+** Playwright structural-parity tests | Vitest verifies behavior; Playwright verifies DOM identity. |
| Build | pnpm workspace + Vite library mode | Standard Qwik library tooling; no Bazel learning curve. |
| Stream translation | Signals for state; `Promise` for one-shot; QRL callback props for events | Idiomatic Qwik; no RxJS peer dependency. |
| Package name | `@angular-community/qwik-cdk` | Signals "port of CDK" without implying official Angular endorsement. |
| a11y scope | Port only what Dialog uses; stub the rest | YAGNI; smaller spec. |

## 2 · Package and build setup

**Workspace conversion**

The repo currently has a single root `package.json`. We add `pnpm-workspace.yaml`:

```yaml
packages:
  - .
  - src/qwik-cdk
  - src/qwik-cdk-dev-app
  - src/qwik-cdk-parity-tests
```

The existing root `package.json` remains the workspace root and continues to drive the Angular build. The Qwik packages are siblings.

**`src/qwik-cdk/package.json` shape**

```jsonc
{
  "name": "@angular-community/qwik-cdk",
  "version": "0.0.0",
  "type": "module",
  "license": "MIT",
  "peerDependencies": {
    "@builder.io/qwik": "^1.5.0"
  },
  "exports": {
    ".": { "types": "./dist/index.d.ts", "import": "./dist/index.js" },
    "./dialog":   { "types": "./dist/dialog/index.d.ts",   "import": "./dist/dialog/index.js" },
    "./overlay":  { "types": "./dist/overlay/index.d.ts",  "import": "./dist/overlay/index.js" },
    "./portal":   { "types": "./dist/portal/index.d.ts",   "import": "./dist/portal/index.js" },
    "./a11y":     { "types": "./dist/a11y/index.d.ts",     "import": "./dist/a11y/index.js" },
    "./platform": { "types": "./dist/platform/index.d.ts", "import": "./dist/platform/index.js" },
    "./bidi":     { "types": "./dist/bidi/index.d.ts",     "import": "./dist/bidi/index.js" },
    "./coercion": { "types": "./dist/coercion/index.d.ts", "import": "./dist/coercion/index.js" },
    "./keycodes": { "types": "./dist/keycodes/index.d.ts", "import": "./dist/keycodes/index.js" },
    "./overlay-prebuilt.css": "./dist/overlay-prebuilt.css",
    "./a11y-prebuilt.css":    "./dist/a11y-prebuilt.css",
    "./scss/*":   "./scss/*"
  },
  "files": ["dist", "scss"]
}
```

**Vite library config**

[src/qwik-cdk/vite.config.ts](../../../src/qwik-cdk/vite.config.ts) uses `qwikVite` from `@builder.io/qwik/optimizer` in library mode with multiple entry-points. `vite-plugin-dts` emits declaration files. Sass is compiled by Vite's built-in handling. ESM-only output.

- Prebuilt CSS files (`overlay-prebuilt.scss`, `a11y-prebuilt.scss`) compile to `dist/*.css`.
- SCSS source partials are copied verbatim from `src/qwik-cdk/scss/` to `dist/scss/` so consumers can `@use '@angular-community/qwik-cdk/scss/overlay'`.

**Dev-app**

[src/qwik-cdk-dev-app/](../../../src/qwik-cdk-dev-app/) is a sibling pnpm workspace package — a real Qwik City app that depends on `@angular-community/qwik-cdk` via `workspace:*`. One route per Playwright parity scenario, matching CDK's `src/dev-app/` routes where they exist.

**Parity-tests package**

[src/qwik-cdk-parity-tests/](../../../src/qwik-cdk-parity-tests/) is a sibling pnpm workspace package running Playwright tests against both `src/dev-app/` and `src/qwik-cdk-dev-app/`. See §9.

## 3 · Directory structure and 1:1 file mirroring

```
src/qwik-cdk/
├── package.json
├── vite.config.ts
├── tsconfig.json
├── SYNC.md                           # global sync log
├── README.md
├── root.tsx                          # <QwikCdkRoot> top-level export
├── index.ts                          # re-exports root + namespace barrel
├── scss/                             # SCSS source, shipped as-is
│   ├── _index.scss
│   ├── overlay/_index.scss
│   ├── overlay/overlay-prebuilt.scss
│   ├── overlay/overlay-structure.scss
│   ├── a11y/_index.scss
│   ├── a11y/a11y-prebuilt.scss
│   └── dialog/dialog-container.scss
├── platform/
├── bidi/
├── coercion/
├── keycodes/
├── portal/
├── a11y/
├── overlay/
└── dialog/

src/qwik-cdk-dev-app/                  # sibling: Qwik dev app
src/qwik-cdk-parity-tests/             # sibling: Playwright parity tests
```

**Per-entry-point layout** (example: `dialog/`)

```
src/qwik-cdk/dialog/
├── SYNC.md                            # per-entry sync log + scenario-port tracker
├── public-api.ts                      # mirrors src/cdk/dialog/public-api.ts
├── index.ts                           # re-exports public-api (Vite entry)
├── dialog.ts                          # mirrors src/cdk/dialog/dialog.ts
├── dialog-ref.ts                      # mirrors src/cdk/dialog/dialog-ref.ts
├── dialog-config.ts                   # mirrors src/cdk/dialog/dialog-config.ts
├── dialog-tokens.ts                   # was dialog-injectors.ts; renamed inline
├── dialog-container.tsx               # was dialog-container.ts + .html merged
├── dialog.spec.ts                     # ported Vitest scenarios
├── dialog-module.removed.md           # records NgModule drop
└── dialog-container.html.removed.md   # records template merge
```

**File-naming rules**

- Pure TS files (services, configs, types, utilities) keep the **same name** as CDK with the same default and named exports where possible.
- Files corresponding to Angular `@Component`s or `@Directive`s become `.tsx`; basename unchanged (`dialog-container.ts` → `dialog-container.tsx`).
- Files that have no Qwik analogue become a `<original-name>.removed.md` stub containing one line: what was dropped and why. Critical for sync: a syncer who sees a commit touching `dialog-module.ts` reads `dialog-module.removed.md` and knows "no action needed".
- Templates (`*.html`) collapse into their `.tsx` JSX. A `<basename>.html.removed.md` records the collapse.
- Per-component SCSS files move from co-located to `scss/<entry>/`. The component imports them via Vite.

**Per-entry `SYNC.md` structure**

```md
# Sync log: dialog
Last synced from angular/components commit: <full-sha>
Synced files:
- dialog.ts ← src/cdk/dialog/dialog.ts (sha @ <sha>)
- dialog-ref.ts ← src/cdk/dialog/dialog-ref.ts (sha @ <sha>)
- ...

Intentionally not ported:
- dialog-module.ts (NgModules don't exist in Qwik)
- dialog-container.html (folded into dialog-container.tsx)

Open deviations:
- dialog.ts: `open()` does not accept TemplateRef (no TemplateRef in Qwik).
  Accepts a Qwik Component reference only.
- DialogConfig: `viewContainerRef`, `providers`, `bindings`, `directives`,
  `projectableNodes` fields removed.
- DialogRef streams (closed, backdropClick, keydownEvents, outsidePointerEvents)
  re-shaped to Signal + Promise + QRL callbacks (see public API §5).

Scenario port log (dialog.spec.ts):
- "should open with object config" ✓ ported
- "should run change detection on open" ✗ skipped (Angular-specific)
- ... (full list)
Total: <N> ported / <M> skipped.
```

**Top-level `SYNC.md`** holds a table of entry-point → last-synced SHA and a global "next sync target SHA" so syncs can be batched.

## 4 · Mapping Angular concepts to Qwik

**The translation table** — applied throughout the port. Each row's right column is the rule.

| Angular / CDK concept | Qwik equivalent | Implementation note |
|---|---|---|
| `@Injectable()` service singleton | Context (`createContextId<T>()`) + `useContextProvider` at root | The "service" becomes a plain object held in context. |
| `InjectionToken<T>` | `createContextId<T>('descriptive-name')` | Naming pattern: `FOO_TOKEN` → `FOO`. |
| `inject(Foo)` | `useContext(FOO)` | Inside a Qwik component. Outside (e.g. in a class), the context value is passed in at construction. |
| `NgZone.runOutsideAngular(fn)` | Just `fn()` | Qwik has no zones; the wrapping is gone. |
| `ChangeDetectorRef.markForCheck()` | (delete) | Signals trigger re-renders automatically. |
| `ComponentRef<T>` | (delete) | Replaced by the outlet pattern (§6). |
| `ViewContainerRef.createComponent` | (delete) | Same. |
| `TemplateRef` / `EmbeddedViewRef` | (delete) | The `open(template, …)` overload is removed. Recorded as a deviation. |
| `Renderer2.listen('body', 'keydown', …)` | `useOnDocument('keydown', $(handler))` | Listener registration model is SSR-safe by design. |
| `Platform.isBrowser` | `isBrowser` from `@builder.io/qwik` | A `Platform` API shim re-exports `isBrowser` to preserve import sites where helpful. |
| `afterNextRender()` | `useVisibleTask$` | Client-only, fires after the element is in the DOM. |
| `@ViewChild(X) child` | `useSignal<HTMLElement>()` + `ref={sig}` | One transform per use site. |
| `host: { '[attr.aria-modal]': … }` | JSX attributes with signal values | `<div aria-modal={sig.value}>`. |
| RxJS Observables (public APIs) | Signals + Promise + QRL callbacks | See §5. |
| `@NgModule` | (delete) | `public-api.ts` is the export surface. |
| `ApplicationRef.attachView` | (delete) | The outlet pattern handles rendering. |

**The outlet pattern — the single most important architectural choice**

Angular CDK is built on imperatively creating component instances and attaching their host nodes anywhere in the DOM. Qwik does not allow this. We invert the pattern:

1. Consumers wrap their app once: `<QwikCdkRoot>{...}</QwikCdkRoot>`. This sits at the app root and provides every qwik-cdk context.
2. `QwikCdkRoot` renders `<OverlayContainerOutlet/>` once. This is the `<div class="cdk-overlay-container">`.
3. `OverlayContainerOutlet` reads a signal-backed `OverlayRegistry` and renders one `<OverlayHost>` per entry. Each `OverlayHost` renders the registered Qwik component dynamically (`<entry.Component {...entry.props} />`) along with its overlay shell (`cdk-overlay-host`, `cdk-overlay-pane`, optional backdrop) — identical to CDK's DOM.
4. `useDialog().open(MyComponent, config)` mutates the registry (pushes an entry) and returns a `DialogRef` whose methods (`close`, `updatePosition`, `addPanelClass`, …) mutate that same entry. The outlet re-renders because the signal changed.

Net effect: every "imperatively create a component" call in CDK collapses into "push to a signal-store; let JSX render". The DOM output is identical because we control the JSX exactly.

**Subtleties recorded as deviations** (catalogued in §10):

- The component passed to `dialog.open(Comp, …)` must be a Qwik component reference (compiled into a QRL); passing inline closures or anonymous components is invalid.
- `DialogConfig.context` replaces `DialogConfig.providers`. It accepts `Array<{ ctx, value }>` pairs; the outlet wraps the rendered component in matching `useContextProvider` calls.
- All callback fields in configs are `QRL<…>` so they're serializable across SSR boundaries.

## 5 · Dialog public API

**`<QwikCdkRoot>`**

A top-level export from `@angular-community/qwik-cdk` (the package root, not `./dialog`). Required wrapper.

```tsx
// src/qwik-cdk/root.tsx
import { component$, Slot } from '@builder.io/qwik';
import type { OverlayContainerOptions } from './overlay/overlay-container';
import type { DialogConfig } from './dialog/dialog-config';

export interface QwikCdkRootProps {
  /** Override DEFAULT_DIALOG_CONFIG for all dialogs in this tree. */
  dialogDefaults?: Partial<DialogConfig>;
  /** Custom overlay container insertion point. Defaults to <body>. */
  overlayContainer?: OverlayContainerOptions;
  /** Auto-inject overlay-structure styles. Default true. */
  loadStyles?: boolean;
}

export const QwikCdkRoot = component$<QwikCdkRootProps>((props) => {
  // Provides: overlay registry, dialog registry, default configs, scroll-strategy
  //           options, focus-trap factory, focus-monitor, id generator, etc.
  // Renders <Slot/> then <OverlayContainerOutlet/>.
  ...
});
```

**`useDialog()` hook**

```tsx
// src/qwik-cdk/dialog/dialog.ts
import type { Component, QRL, Signal } from '@builder.io/qwik';

export interface Dialog {
  /** Opens a dialog rendering the given Qwik component. */
  open<C, D = unknown, R = unknown>(
    component: Component<DialogContentProps<D, R>>,
    config?: DialogConfig<D, R>,
  ): DialogRef<R, C>;

  /** Closes every open dialog. */
  closeAll(): void;

  /** Look up an open dialog by id. */
  getDialogById<R = unknown>(id: string): DialogRef<R> | undefined;

  /** Snapshot of currently open dialogs. */
  readonly openDialogs: Signal<readonly DialogRef[]>;
}

export function useDialog(): Dialog;
```

**`DialogRef<R, C>`**

```tsx
// src/qwik-cdk/dialog/dialog-ref.ts
export interface DialogRef<R = unknown, C = unknown> {
  readonly id: string;
  readonly closed: Promise<R | undefined>;
  readonly isOpen: Signal<boolean>;
  readonly componentInstance: Signal<C | null>;

  close(result?: R, options?: { focusOrigin?: FocusOrigin }): void;
  updatePosition(): void;
  updateSize(width?: string | number, height?: string | number): void;
  addPanelClass(classes: string | string[]): void;
  removePanelClass(classes: string | string[]): void;
}
```

**`DialogConfig<D, R>` full surface**

```tsx
// src/qwik-cdk/dialog/dialog-config.ts
import type { QRL } from '@builder.io/qwik';
import type { Direction } from '../bidi/directionality';
import type { PositionStrategy } from '../overlay/position/position-strategy';
import type { ScrollStrategy } from '../overlay/scroll/scroll-strategy';
import type { OverlayContextOverride } from '../overlay/overlay-context';

export class DialogConfig<D = unknown, R = unknown> {
  data?: D | null;
  direction?: Direction;
  id?: string;
  role?: 'dialog' | 'alertdialog';
  panelClass?: string | string[];
  hasBackdrop?: boolean;
  backdropClass?: string | string[];
  disableClose?: boolean;
  closePredicate?: QRL<(result: R | undefined) => boolean | Promise<boolean>>;

  width?: string;
  height?: string;
  minWidth?: string | number;
  minHeight?: string | number;
  maxWidth?: string | number;
  maxHeight?: string | number;

  positionStrategy?: PositionStrategy;
  scrollStrategy?: ScrollStrategy;

  ariaDescribedBy?: string | null;
  ariaLabelledBy?: string | null;
  ariaLabel?: string | null;
  ariaModal?: boolean;

  autoFocus?: 'dialog' | 'first-tabbable' | 'first-heading' | string | false;
  restoreFocus?: boolean | string | HTMLElement;

  closeOnNavigation?: boolean;
  closeOnOverlayDetachments?: boolean;
  disableAnimations?: boolean;

  context?: OverlayContextOverride[];

  // Event callbacks (Qwik-idiomatic replacement for RxJS streams)
  onBackdropClick$?: QRL<(e: MouseEvent) => void>;
  onKeydown$?: QRL<(e: KeyboardEvent) => void>;
  onOutsidePointer$?: QRL<(e: MouseEvent) => void>;
}
```

**Dialog tokens** (replaces `dialog-injectors.ts`)

```tsx
// src/qwik-cdk/dialog/dialog-tokens.ts
import { createContextId } from '@builder.io/qwik';
import type { ScrollStrategy } from '../overlay/scroll/scroll-strategy';
import type { DialogConfig } from './dialog-config';

export const DIALOG_DATA            = createContextId<unknown>('qwik-cdk/dialog-data');
export const DEFAULT_DIALOG_CONFIG  = createContextId<Partial<DialogConfig>>('qwik-cdk/dialog-default-config');
export const DIALOG_SCROLL_STRATEGY = createContextId<() => ScrollStrategy>('qwik-cdk/dialog-scroll-strategy');
```

A dialog component reads its data via `const data = useContext(DIALOG_DATA) as MyShape;`.

**End-to-end usage example**

```tsx
import { component$, $, useContext } from '@builder.io/qwik';
import { QwikCdkRoot } from '@angular-community/qwik-cdk';
import { useDialog, DIALOG_DATA } from '@angular-community/qwik-cdk/dialog';

const ConfirmDialog = component$(() => {
  const data = useContext(DIALOG_DATA) as { message: string };
  return <div>{data.message}</div>;
});

const App = component$(() => {
  const dialog = useDialog();
  return (
    <button onClick$={$(() => {
      const ref = dialog.open(ConfirmDialog, {
        data: { message: 'Sure?' },
        hasBackdrop: true,
        ariaModal: true,
      });
      ref.closed.then((result) => console.log('result:', result));
    })}>Open</button>
  );
});

export default component$(() => (
  <QwikCdkRoot>
    <App />
  </QwikCdkRoot>
));
```

## 6 · Internal architecture

**Overlay registry — the heart of the system**

```tsx
// src/qwik-cdk/overlay/overlay-registry.ts
export interface OverlayEntry {
  id: string;
  Component: Component<any>;
  props: Record<string, unknown>;
  config: OverlayConfig;
  state: {
    panelClasses: Signal<readonly string[]>;
    backdropShowing: Signal<boolean>;
    detached: Signal<boolean>;
    width: Signal<string | undefined>;
    height: Signal<string | undefined>;
    // ...
  };
  lifecycle: {
    onAttached$: QRL<(host: HTMLElement, pane: HTMLElement) => void>;
    onDetached$: QRL<() => void>;
  };
}

export interface OverlayRegistry {
  entries: Signal<readonly OverlayEntry[]>;
  push(entry: OverlayEntry): void;
  remove(id: string): void;
  get(id: string): OverlayEntry | undefined;
}

export const OVERLAY_REGISTRY = createContextId<OverlayRegistry>('qwik-cdk/overlay-registry');
```

The registry is provided by `<QwikCdkRoot>`. Everything else — `Overlay`, `OverlayRef`, `Dialog`, `DialogRef` — is built on it.

**`OverlayContainerOutlet`**

```tsx
// src/qwik-cdk/overlay/overlay-container-outlet.tsx
export const OverlayContainerOutlet = component$(() => {
  const registry = useContext(OVERLAY_REGISTRY);
  // Match CDK's lazy-create behavior: the container div doesn't exist until the
  // first overlay attaches. This also gives us a free SSR no-op since the
  // registry starts empty on the server.
  if (registry.entries.value.length === 0) return null;
  return (
    <div class="cdk-overlay-container">
      {registry.entries.value.map((e) => <OverlayHost entry={e} key={e.id} />)}
    </div>
  );
});

const OverlayHost = component$<{ entry: OverlayEntry }>(({ entry }) => {
  const hostRef = useSignal<HTMLElement>();
  const paneRef = useSignal<HTMLElement>();

  useVisibleTask$(({ cleanup }) => {
    entry.lifecycle.onAttached$(hostRef.value!, paneRef.value!);
    cleanup(() => entry.lifecycle.onDetached$());
  });

  const Comp = entry.Component;
  return (
    <div ref={hostRef} class="cdk-overlay-host" data-overlay-id={entry.id}>
      {entry.config.hasBackdrop && (
        <div class={['cdk-overlay-backdrop', ...backdropClasses(entry)]} />
      )}
      <div ref={paneRef}
           class={['cdk-overlay-pane', ...entry.state.panelClasses.value]}
           style={{ width: entry.state.width.value, height: entry.state.height.value }}>
        <Comp {...entry.props} />
      </div>
    </div>
  );
});
```

The DOM is hand-controlled to byte-match CDK output. The Playwright parity tests in §9 verify this.

**`OverlayRef`**

A handle, not a DOM owner. It only mutates registry signals and runs strategies. The outlet does all DOM creation.

```tsx
// src/qwik-cdk/overlay/overlay-ref.ts
export class OverlayRef {
  constructor(
    private registry: OverlayRegistry,
    private entry: OverlayEntry,
    private positionStrategy: PositionStrategy | undefined,
    private scrollStrategy: ScrollStrategy | undefined,
    private keyboardDispatcher: OverlayKeyboardDispatcher,
    private outsideClickDispatcher: OverlayOutsideClickDispatcher,
  ) {}

  detach(): void { /* sets entry.state.detached -> true, then registry.remove(entry.id) */ }
  dispose(): void { /* idempotent cleanup */ }
  updatePosition(): void { this.positionStrategy?.apply(); }
  updateSize(opts): void { /* mutate entry.state signals */ }
  addPanelClass(cls): void { /* mutate entry.state.panelClasses */ }
  removePanelClass(cls): void { /* mutate entry.state.panelClasses */ }
}
```

**`Overlay` service**

```tsx
// src/qwik-cdk/overlay/overlay.ts
export interface Overlay {
  create<P>(component: Component<P>, props: P, config?: OverlayConfig): OverlayRef;
  position(): OverlayPositionBuilder;
}
export const OVERLAY = createContextId<Overlay>('qwik-cdk/overlay');
export function useOverlay(): Overlay { return useContext(OVERLAY); }
```

**Portal — collapsed**

The Portal abstraction has no Qwik analogue. CDK's `ComponentPortal`/`TemplatePortal`/`DomPortal` are replaced by:

- A `Portal<P>` type alias: `{ Component: Component<P>; props: P }`
- A `CdkPortalOutlet` helper component for places that swap content via a signal without going through the overlay system.

`src/qwik-cdk/portal/dom-portal-outlet.ts` and `portal-directives.ts` become `.removed.md` notes.

**Focus trap**

```tsx
// src/qwik-cdk/a11y/focus-trap.ts
export class FocusTrap {
  constructor(private host: HTMLElement, private opts: FocusTrapOptions) {
    // Inserts focus sentinel elements (cdk-focus-trap-anchor) at start and end.
    // Identical DOM structure to CDK.
  }
  focusInitialElement(): boolean { /* ... */ }
  focusFirstTabbableElement(): boolean { /* ... */ }
  focusLastTabbableElement(): boolean { /* ... */ }
  destroy(): void { /* ... */ }
}

export function useFocusTrap(hostRef: Signal<HTMLElement | undefined>, opts: FocusTrapOptions = {}) {
  const trap = useSignal<FocusTrap | null>(null);
  useVisibleTask$(({ cleanup }) => {
    if (!hostRef.value) return;
    const t = new FocusTrap(hostRef.value, opts);
    trap.value = t;
    cleanup(() => t.destroy());
  });
  return trap;
}
```

The dialog container component calls `useFocusTrap(hostRef, { autoFocus, restoreFocus })`.

**Dialog container component**

```tsx
// src/qwik-cdk/dialog/dialog-container.tsx
export const CdkDialogContainer = component$<{ config: DialogConfig }>(({ config }) => {
  const hostRef = useSignal<HTMLElement>();
  useFocusTrap(hostRef, {
    autoFocus: config.autoFocus,
    restoreFocus: config.restoreFocus,
  });
  return (
    <div ref={hostRef}
         class={['cdk-dialog-container', ...toArray(config.panelClass)]}
         tabIndex={-1}
         role={config.role ?? 'dialog'}
         aria-modal={config.ariaModal ?? true}
         aria-label={config.ariaLabel ?? null}
         aria-labelledby={config.ariaLabelledBy ?? null}
         aria-describedby={config.ariaDescribedBy ?? null}>
      <Slot/>
    </div>
  );
});
```

The user's component renders in `<Slot/>`. The dialog registry entry registers `CdkDialogContainer` as the wrapper, with the user's component slotted in via a small wrapping JSX template the outlet builds.

**Dispatchers**

`OverlayKeyboardDispatcher` and `OverlayOutsideClickDispatcher` are singletons provided by `<QwikCdkRoot>`. They use `useOnDocument` for listener registration (SSR-safe). They walk the overlay registry top-down to find the topmost overlay whose `eventPredicate` matches the event target, and fire the matching callbacks.

**Position strategies**

`GlobalPositionStrategy` and `FlexibleConnectedPositionStrategy` port near-1:1. The math is unchanged; the call sites that read/write the pane element are simplified (the strategy takes `paneRef` from the outlet's `onAttached$` callback). No DI; pure DOM manipulation guarded by `isBrowser`.

**Scroll strategies**

`NoopScrollStrategy`, `BlockScrollStrategy`, `CloseScrollStrategy`, `RepositionScrollStrategy` port near-1:1. They attach via `OverlayRef.attach()`-time hook and mutate `<html>` or listen on scroll events. No Angular dependency to remove.

## 7 · SCSS strategy

SCSS is framework-agnostic. Files copy byte-for-byte from `src/cdk/`:

| Source | Destination |
|---|---|
| `src/cdk/_index.scss` | `src/qwik-cdk/scss/_index.scss` |
| `src/cdk/overlay/_index.scss` | `src/qwik-cdk/scss/overlay/_index.scss` |
| `src/cdk/overlay/overlay-prebuilt.scss` | `src/qwik-cdk/scss/overlay/overlay-prebuilt.scss` |
| `src/cdk/overlay/overlay-structure.scss` | `src/qwik-cdk/scss/overlay/overlay-structure.scss` |
| `src/cdk/a11y/_index.scss` | `src/qwik-cdk/scss/a11y/_index.scss` |
| `src/cdk/a11y/a11y-prebuilt.scss` | `src/qwik-cdk/scss/a11y/a11y-prebuilt.scss` |
| `src/cdk/dialog/dialog-container.scss` | `src/qwik-cdk/scss/dialog/dialog-container.scss` |

**Public Sass API preserved 1:1**

Consumer code that works against `@angular/cdk` works against qwik-cdk with only the package name changed:

```scss
@use '@angular-community/qwik-cdk/scss/overlay' as overlay;
@use '@angular-community/qwik-cdk/scss/a11y'    as a11y;

@include overlay.overlay();
@include a11y.a11y-visually-hidden();
@include a11y.high-contrast($target, $encapsulation);
```

All mixin names, function names, variables (`$overlay-container-z-index`, `$overlay-z-index`, `$overlay-backdrop-z-index`, `$overlay-backdrop-color`, `$backdrop-animation-duration`, `$backdrop-animation-timing-function`, `private-overlay-structure($wrap-customizable-styles)`) — unchanged.

**Prebuilt CSS**

Vite's Sass pipeline emits:
- `dist/overlay-prebuilt.css` (importable as `@angular-community/qwik-cdk/overlay-prebuilt.css`)
- `dist/a11y-prebuilt.css`

These are byte-diffed against `@angular/cdk`'s prebuilt CSS in CI (ignoring source-map comments and leading copyright headers).

**Style-loader replacement**

CDK's `_CdkOverlayStyleLoader` runtime-injects overlay-structure styles. qwik-cdk instead has `<QwikCdkRoot>` import the SCSS at module load (Vite handles the side-effect), gated by the `loadStyles` prop (default `true`). This matches CDK's "styles just work" ergonomics without runtime DOM injection (which is hostile to SSR).

**Internal component CSS**

`dialog-container.tsx` imports `scss/dialog/dialog-container.scss` via Vite. Output: `.cdk-dialog-container { display: block; width: 100%; height: 100%; min-height: inherit; max-height: inherit }` — identical to CDK.

## 8 · SSR behavior

**Principle:** Dialogs are interactive; they cannot be open during SSR. Importing qwik-cdk on the server must not crash, and a Qwik app using qwik-cdk must resume on the client cleanly.

**What renders on the server**

- `<QwikCdkRoot>` renders its children (the `<Slot/>`).
- `<OverlayContainerOutlet>` reads the overlay registry, which is empty on the server, so it renders `null` (matching CDK's lazy-create-on-first-attach behavior).
- All context providers register; values are present in the serialized state but no DOM is created.

**What does NOT run on the server**

- Constructors of `FocusTrap`, `FocusMonitor`, `InteractivityChecker`, `InputModalityDetector`, `OverlayKeyboardDispatcher`, `OverlayOutsideClickDispatcher` — instantiated only inside `useVisibleTask$`.
- `OverlayContainer.getContainerElement()` returns `null` on the server.
- Position strategies' `apply()`, scroll strategies' `enable()`/`disable()` — `isBrowser`-guarded.
- DOM event listeners — Qwik's `useOnDocument`/`useOnWindow` are SSR-safe by design (listener registration metadata is serialized; events fire on the client only).

**Resumption**

1. `<QwikCdkRoot>` resumes; contexts restored.
2. Overlay registry is empty — nothing to render.
3. First `useDialog().open(...)` mutates the registry. The outlet renders the new entry. The entry's `<OverlayHost>` `useVisibleTask$` fires, instantiating focus trap and running position strategy.

**Serializability constraints (documented)**

- `DialogConfig` callback fields are typed as `QRL<…>` — Qwik handles serialization.
- `DialogConfig.data` and `DialogConfig.context` values must be serializable: primitives, plain objects, arrays, QRLs. Non-serializable values produce a Qwik runtime error in dev.
- Component references in `dialog.open(Comp)` are serializable in Qwik (compiled to QRLs).

**Edge cases**

- `dialog.open()` called during SSR — on the server, `open()` returns a `DialogRef` whose `closed` Promise is pre-resolved with `undefined` and whose other methods are no-ops; a `console.warn` fires in dev.
- Focus restoration across navigation — `closeOnNavigation` (default `true`) listens to Qwik City's `useLocation()` and auto-closes on route change.
- Hydration mismatch — none, because the overlay container is `null` until first attach.
- Multiple `<QwikCdkRoot>` instances — disallowed; nested `QwikCdkRoot` throws in dev (matches CDK's root-level singleton constraint).

**SSR audit lint**

A grep-based check at `pnpm test:qwik-cdk` time: every direct `document.`, `window.`, `navigator.`, `getComputedStyle(`, `requestAnimationFrame(` call must be inside a `useVisibleTask$` callback OR guarded by `if (isBrowser)`. Unguarded occurrences outside `.spec.ts` fail the check.

## 9 · Testing

**Three tiers**

| Tier | Tool | Location | Purpose |
|---|---|---|---|
| Unit / scenario | Vitest + `@builder.io/qwik/testing` + happy-dom | `src/qwik-cdk/**/*.spec.ts` | Port of CDK `*.spec.ts` cases that aren't Angular-specific. |
| Structural parity | Playwright component testing | `src/qwik-cdk-parity-tests/` | Renders the same scenario in CDK's and qwik-cdk's dev-apps and asserts DOM trees are identical. |
| Manual / visual | The two dev-apps | `src/dev-app/` (CDK), `src/qwik-cdk-dev-app/` (new) | Side-by-side visual inspection. Not gated in CI. |

**Vitest scenario port — process**

For each CDK spec file ported (`dialog.spec.ts`, `overlay.spec.ts`, `overlay-container.spec.ts`, `flexible-connected-position-strategy.spec.ts`, `global-position-strategy.spec.ts`, `block-scroll-strategy.spec.ts`, `close-scroll-strategy.spec.ts`, `reposition-scroll-strategy.spec.ts`, `overlay-keyboard-dispatcher.spec.ts`, `overlay-outside-click-dispatcher.spec.ts`):

- Translate each `describe` block 1:1.
- Translate each `it` block testing *behavior* (focus, ARIA, classes, DOM structure, scroll handling, position) directly.
- Skip with annotation any `it` testing Angular plumbing (NgZone, change detection, ComponentRef destroy order, TestBed providers). Each skipped test gets a comment header `// Skipped (Angular-specific): <reason>` and is listed in the entry-point `SYNC.md`.
- Use `createDOM()` from `@builder.io/qwik/testing`. Use direct `dispatchEvent` for interactions.

**Playwright structural-parity tests**

Each parity test runs both dev-apps as separate processes, navigates each to a matching route (`/dialog/basic`, `/dialog/with-data`, `/dialog/no-backdrop`, `/dialog/custom-panel-class`, `/dialog/escape-close`, `/dialog/backdrop-click-close`, `/dialog/disable-close`, `/dialog/multiple-stacked`, `/dialog/alertdialog-role`, `/dialog/aria-label`, `/dialog/aria-labelledby`, `/dialog/aria-describedby`, `/dialog/auto-focus-first-tabbable`, `/dialog/auto-focus-first-heading`, `/dialog/auto-focus-disabled`, `/dialog/restore-focus`, `/dialog/custom-position`, `/dialog/custom-scroll-strategy`, `/dialog/width-height`, `/dialog/min-max`), opens the dialog, then snapshots the overlay-container subtree.

A custom diff function compares:
- Tag names.
- Class lists (order-insensitive).
- Attributes excluding Angular-only ones (`ng-version`, `_ngcontent-*`, `_nghost-*`).
- Computed styles for a curated set: `display`, `position`, `z-index`, `width`, `height`, `top`, `left`, `transform`, `opacity`.
- ARIA attributes byte-for-byte.

Failures print a unified diff of the two trees.

**CI script**

A new root script `pnpm test:qwik-cdk`:
1. `pnpm -C src/qwik-cdk build`
2. `pnpm -C src/qwik-cdk test` (Vitest)
3. `pnpm -C src/qwik-cdk lint:no-ssr-leaks` (grep audit)
4. `pnpm -C src/qwik-cdk-parity-tests test` (Playwright)
5. Byte-diff `dist/overlay-prebuilt.css` against `@angular/cdk`'s prebuilt CSS.

Wiring this into `.github/workflows/*` is deferred — the spec stops at "qwik-cdk works on local dev".

## 10 · Open deviations from CDK (catalog)

Every API divergence documented here. Future syncers consult this list before "fixing" a deviation.

| Deviation | Reason |
|---|---|
| `Dialog.open(templateRef, …)` overload removed | No TemplateRef in Qwik. |
| `DialogConfig.viewContainerRef` removed | No ViewContainerRef in Qwik. |
| `DialogConfig.providers` replaced by `DialogConfig.context` | Angular DI vs Qwik contexts. |
| `DialogConfig.bindings` removed | Angular-specific (Signal bindings via input). |
| `DialogConfig.directives` removed | No directives in Qwik. |
| `DialogConfig.projectableNodes` removed | No content projection API like Angular's. |
| `DialogRef.closed: Observable<R>` → `Promise<R>` | Idiomatic Qwik; one-shot event. |
| `DialogRef.backdropClick: Observable` → `DialogConfig.onBackdropClick$: QRL` | Same. |
| `DialogRef.keydownEvents: Observable` → `DialogConfig.onKeydown$: QRL` | Same. |
| `DialogRef.outsidePointerEvents: Observable` → `DialogConfig.onOutsidePointer$: QRL` | Same. |
| `Dialog.afterOpened: Subject` → `<QwikCdkRoot onDialogOpened$>` callback + `openDialogs` signal | Avoid RxJS, surface in idiomatic shape. |
| `Dialog.afterAllClosed: Observable` → `<QwikCdkRoot onAllDialogsClosed$>` callback | Same. |
| `Portal<P>` simplified to `{ Component, props }` | The general Portal abstraction has no Qwik analogue. |
| `ComponentPortal`/`TemplatePortal`/`DomPortal` removed | Same. |
| `_CdkOverlayStyleLoader` runtime style injection replaced by Vite SCSS import | SSR-hostile pattern. |
| All ID generation centralized in `_IdGenerator` context | Qwik components need stable IDs across SSR/CSR. |
| `NgModule`s removed | No NgModules in Qwik. |
| `Renderer2`-based listeners replaced by `useOnDocument`/`useOnWindow` | Qwik's SSR-safe listener model. |
| `NgZone.runOutsideAngular(fn)` simplified to `fn()` | No zones in Qwik. |

## 11 · Upstream sync workflow

The sync workflow is the load-bearing reason for 1:1 file mirroring and `SYNC.md` discipline. Documented at [src/qwik-cdk/SYNC.md](../../../src/qwik-cdk/SYNC.md) once created.

**Recipe**

1. Read top-level `src/qwik-cdk/SYNC.md` to get `LAST_SHA`.
2. Run `git log <LAST_SHA>..main -- src/cdk/dialog/ src/cdk/overlay/ src/cdk/portal/ src/cdk/a11y/ src/cdk/platform/ src/cdk/bidi/ src/cdk/coercion/ src/cdk/keycodes/`.
3. For each commit, inspect touched files. For each touched file:
   - Look up its qwik-cdk mirror via the per-entry `SYNC.md` "Synced files" table.
   - If the file is in "Intentionally not ported" — note the commit ID under "Reviewed and skipped" in that entry's SYNC.md.
   - If mirrored — apply the diff conceptually, using §4's translation table.
   - If the change touches an "Open deviations" line — evaluate whether the deviation still holds; if yes, note "reviewed; deviation stands as of <new-sha>"; if no, update the deviation.
4. Run `pnpm test:qwik-cdk`. Fix until green.
5. Bump `LAST_SHA` in top-level and per-entry `SYNC.md` files. Commit with message `sync(qwik-cdk): port up to <new-sha-short>`.

**Cadence (guidance, not enforcement)**

Sync after every Angular Components minor release (~6 weeks), or ad-hoc when an upstream fix is needed urgently. Not automated initially — the conceptual translation step is too judgment-heavy for a script.

**Future automation (not in this spec)**

A helper script `pnpm qwik-cdk:sync-report` that produces the commit-by-touched-file report automatically. To be designed once the first manual sync surfaces the rough edges worth automating.
