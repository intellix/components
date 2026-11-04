# Migrating from Angular Material

This guide maps Angular Material concepts to their qwik-material equivalents, for a team porting
an existing Angular app. It assumes your app is already on a **current, MDC-based** Angular
Material version — legacy (pre-MDC) components and APIs have no equivalent here at all, so there
is nothing to map from if you haven't already moved off them in Angular itself.

This page covers the concept map at a glance. For the full, verified migration walkthrough —
installing a local build, the `vite.config.ts` requirements, every Angular DI token's Qwik hook
equivalent, a row-by-row component/CDK mapping table, the pitfalls a migration will actually hit,
and the complete not-supported list — see
[`MIGRATING.md`](../../../../../MIGRATING.md) at the repo root. That file is written for an AI
coding agent doing the migration autonomously, and is also useful for a human developer.

## Concept map

| Angular Material | qwik-material |
|---|---|
| `NgModule` imports (`MatButtonModule`, `MatCardModule`, …) | Plain ESM imports from the matching entry point: `import {MatButton} from '@angular-community/qwik-material/button'` |
| `@Input()` property | Component prop, same name (camelCase) |
| `@Output()` `EventEmitter` | A `on<Name>$` prop taking a `QRL` handler — e.g. Angular's `(selectionChange)` becomes `onSelectionChange$={$(event => ...)}` |
| Attribute directive applied to your own element (`matButton`, `matTooltip`, `[matMenuTriggerFor]`) | Either a host-owning component (`<MatButton>`) **or**, when you need to stack more than one on the same element, a `use*` hook returning spreadable `HostProps` — see [Composing directives](/guide/composing-directives/) |
| Structural directive / service class (`MatDialog`, `MatSnackBar`, `MatBottomSheet`) | A `use*` hook called once per component: `useMatDialog()`, `useMatSnackBar()`, `useMatBottomSheet()` |
| `FormControl` / `FormGroup` / `ReactiveFormsModule` | No built-in form library — either hand-roll state with `useMatFormControl()` (`@angular-community/qwik-material/form-field`: a small `value`/`touched`/`dirty` store, paired with standalone `matControlInvalid()`/`matRequiredValidator` helpers for validation), or a real headless form library — see [Using with Formisch](/guide/using-with-formisch/) for a worked example |
| Template reference variable + `@ViewChild` | A `useSignal<HTMLElement>()` passed as `ref` |
| Content projection (`<ng-content select="...">`) | A named prop typed `JSXOutput` (e.g. `<MatListItem avatar={<MatListItemAvatar>...}>`) where Angular projected by content *type*; a `<Slot/>` where it projected everything else |
| `*ngIf` / `*ngFor` / `| async` pipe | Plain JS/JSX — a ternary or `&&`, `.map()`, and reading a signal's `.value` directly |
| `ChangeDetectorRef.markForCheck()` | Not needed — Qwik's reactivity is signal-based; writing to a signal's `.value` re-renders automatically |
| Angular Router `[routerLink]` on a component with an `as`-style host (`MatButton`, `MatListItem`) | An `href` prop (`<MatButton href="...">`, `<MatListItem as="a" href="...">`) — plain navigation, since Qwik's own router is a separate concern from the component |

## Services → hooks, concretely

Angular's injectable services become hooks called inside `component$`:

```tsx
// Angular
constructor(private dialog: MatDialog) {}
openDialog() {
  const ref = this.dialog.open(MyDialogComponent, {data: {...}});
  ref.afterClosed().subscribe(result => { /* ... */ });
}
```

```tsx
// qwik-material
import {$, component$} from '@qwik.dev/core';
import {useMatDialog} from '@angular-community/qwik-material/dialog';

export default component$(() => {
  const dialog = useMatDialog();
  const open$ = $(async () => {
    const ref = await dialog.open$(MyDialogComponent, {data: {...}});
    const result = await ref?.afterClosed;
    // ...
  });
  // ...
});
```

`useMatSnackBar()` and `useMatBottomSheet()` follow the same shape (`.open$(...)`, an awaitable
ref). See each one's own component page for the exact signature.

## What has no equivalent (by design)

- **Legacy (pre-MDC) Material components.** Not supported — this port targets current,
  MDC-based `@angular/material@21.2.14` only.
- **Angular `NgModule`s.** qwik-material has no module system — import components directly from
  their entry point.
- **Harness-based testing (`MatButtonHarness`, …).** Not ported in Phase 1 of this docs site or
  the underlying library; test against the rendered DOM directly.
- **RxJS-based APIs** (`Observable` outputs, `asObservable()`). Every output is a plain `QRL`
  handler prop instead; there is no Observable layer to subscribe to.
- **Zone.js-based change detection.** Qwik has no zones — reactivity is purely signal-based.
- **Virtual scrolling and drag-and-drop** (`@angular/cdk/scrolling`'s `cdk-virtual-scroll-viewport`,
  `@angular/cdk/drag-drop`). Neither has a Qwik port; no workaround.
- **`MatSelectionList`/`MatListOption`** and chip-input autocomplete composition. Not ported — see
  `MIGRATING.md`'s not-supported list for the full detail and any available workaround.

## A worked example: Button

```html
<!-- Angular -->
<button mat-button color="primary" [disabled]="isLoading" (click)="save()">
  Save
</button>
```

```tsx
// qwik-material
import {$, component$, useSignal} from '@qwik.dev/core';
import {MatButton} from '@angular-community/qwik-material/button';

export default component$(() => {
  const isLoading = useSignal(false);
  const save$ = $(() => { /* ... */ });

  return (
    <MatButton appearance="filled" disabled={isLoading.value} onClick$={save$}>
      Save
    </MatButton>
  );
});
```

Note `color="primary"` became `appearance="filled"` — `color` in current Material is the
secondary, M2-compatibility axis (still supported, but deprecated); `appearance` is the primary
M3 styling axis (`text` / `filled` / `tonal` / `outlined` / `elevated`). See the
[Button component page](/components/button/overview/) for the full prop list.
