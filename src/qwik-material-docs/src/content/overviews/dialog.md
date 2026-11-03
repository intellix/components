The `useMatDialog()` hook can be used to open modal dialogs with Material Design styling and
animations.

<!-- example(dialog-overview) -->

A dialog is opened by calling `open$` with a component to render and an optional config object.
`open$` returns a `MatDialogRef`:

```tsx
const dialog = useMatDialog();
const ref = dialog.open$(UserProfileComponent, {
  height: '400px',
  width: '600px',
});
```

The `MatDialogRef` provides a handle on the opened dialog. It can be used to close the dialog and
to await its lifecycle.

```tsx
ref?.afterClosed.then(result => {
  console.log(`Dialog result: ${result}`); // Pizza!
});

ref?.close('Pizza!');
```

Components rendered via `useMatDialog()` can read `MAT_DIALOG_REF` via `useContext` and use it
to close the dialog in which they are contained. When closing, an optional result value can be
provided. This result value is resolved as the result of `afterClosed`.

```tsx
import {component$, useContext} from '@qwik.dev/core';
import {MAT_DIALOG_REF} from '@angular-community/qwik-material/dialog';

export default component$(() => {
  const dialogRef = useContext(MAT_DIALOG_REF);
  return <button onClick$={() => dialogRef?.close('Pizza!')}>Close</button>;
});
```

### Specifying global configuration defaults
Default dialog options can be provided through `<QwikMaterialProvider matDialogDefaults={{hasBackdrop: false}}>`
at the root of your app — see [Composing directives](/guide/composing-directives/).

### Passing props to the opened component
Use `componentProps` to pass initial props to the component rendered inside the dialog, and
`setInput` on the returned `MatDialogRef` to update a prop later, reactively:

```tsx
const ref = dialog.open$(UserProfileComponent, {
  componentProps: {userId: '42'},
});

ref?.setInput('userId', '43');
```

### Confirming before closing
`onBackdropClick$` fires on every backdrop click, even when `disableClose` is `true` — use it to
show your own confirmation before deciding whether to close:

```tsx
const ref = dialog.open$(UserProfileComponent, {
  disableClose: true,
  onBackdropClick$: $(() => {
    if (confirm('Discard changes?')) ref?.disableClose = false;
  }),
});
```

`disableClose` can be read and reassigned on the ref at any time; the dialog's Escape-key and
backdrop-click handling always consult its current value.

### Closing on navigation
By default (`closeOnNavigation: true`), the dialog closes when the user navigates back or
forward in their browser history, or the URL hash changes — not on every link click. Set
`closeOnNavigation: false` to opt out.

### Running code once every dialog is closed
`dialog.afterAllClosed$` registers a callback that fires whenever the number of open dialogs
returns to zero:

```tsx
const unsubscribe = await dialog.afterAllClosed$($(() => {
  console.log('No dialogs are open');
}));
```

### Contexts inside the dialog
Content rendered inside the dialog automatically sees every `<QwikMaterialProvider>`
configuration context visible where `useMatDialog()` was called — a form field inside the
dialog picks up `matFormFieldConfig` from a provider wrapping your app, for example. To make your
own app context available too, pass it via `context`:

```tsx
dialog.open$(UserProfileComponent, {
  context: [{ctx: MY_APP_THEME, value: theme}],
});
```

### Sharing data with the Dialog component.
If you want to share data with your dialog, you can use the `data` option to pass information to
the dialog component.

```tsx
const ref = dialog.open$(YourDialog, {data: {name: 'austin'}});
```

To access the data in your dialog component, you have to read the `MAT_DIALOG_DATA` context:

```tsx
import {component$, useContext} from '@qwik.dev/core';
import {MAT_DIALOG_DATA} from '@angular-community/qwik-material/dialog';

export default component$(() => {
  const data = useContext(MAT_DIALOG_DATA) as {name: string};
  return <>passed in {data.name}</>;
});
```

<!-- example(dialog-data) -->

### Dialog content
Several components are available to make it easier to structure your dialog content:

| Name                     | Description                                                                                                   |
|---------------------------|------------------------------------------------------------------------------------------------------------------|
| `<MatDialogTitle>`        | Dialog title, renders a heading element                                                                        |
| `<MatDialogContent>`      | Primary scrollable content of the dialog.                                                                       |
| `<MatDialogActions>`      | Container for action buttons at the bottom of the dialog. Button alignment can be controlled via `align`, which can be set to `'end'` or `'center'`.  |

Closing the dialog from a plain `matButton` requires the directive-hooks composition pattern
(see [Angular → Qwik notes](#angular-qwik-notes) below) since `<MatButton>` can't be stacked with
another directive-shaped feature from the outside.

```tsx
<MatDialogTitle>Delete all elements?</MatDialogTitle>
<MatDialogContent>This will delete all elements that are currently on this page and cannot be undone.</MatDialogContent>
<MatDialogActions>
  <button onClick$={() => dialogRef?.close()}>Cancel</button>
  <button onClick$={() => dialogRef?.close(true)}>Delete</button>
</MatDialogActions>
```

Once a dialog opens, the dialog will automatically focus the first tabbable element.

You can control which elements are tab stops with the `tabIndex` prop.

```tsx
<button tabIndex={-1}>Not Tabbable</button>
```

<!-- example(dialog-content) -->

### Controlling the dialog animation
You can control the duration of the dialog's enter and exit animations using the
`enterAnimationDuration` and `exitAnimationDuration` options. If you want to disable the
dialog's animation completely, you can do so by setting the properties to `'0ms'`.

<!-- example(dialog-animations) -->

### Accessibility

`useMatDialog()` creates modal dialogs that implement the ARIA `role="dialog"` pattern by
default. You can change the dialog's role to `alertdialog` via `MatDialogConfig`.

You should provide an accessible label to this root dialog element by setting the `ariaLabel` or
`ariaLabelledBy` properties of `MatDialogConfig`. You can additionally specify a description
element id via the `ariaDescribedBy` property of `MatDialogConfig`.

#### Keyboard interaction
By default, the escape key closes the dialog. While you can disable this behavior via the
`disableClose` property of `MatDialogConfig`, doing this breaks the expected interaction pattern
for the ARIA `role="dialog"` pattern.

#### Focus management

When opened, the dialog traps browser focus such that it cannot escape the root `role="dialog"`
element. By default, the first tabbable element in the dialog receives focus. You can customize
which element receives focus with the `autoFocus` property of `MatDialogConfig`, which supports
the following values.

| Value            | Behavior                                                                 |
|------------------|---------------------------------------------------------------------------|
| `first-tabbable` | Focus the first tabbable element. This is the default setting.           |
| `first-heading`  | Focus the first heading element (`role="heading"`, `h1` through `h6`)    |
| `dialog`         | Focus the root `role="dialog"` element.                                  |
| Any CSS selector | Focus the first element matching the given selector.                     |

While the default setting applies the best behavior for most applications, special cases may
benefit from these alternatives. Always test your application to verify the behavior that works
best for your users.

#### Focus restoration

When closed, the dialog restores focus to the element that previously held focus when the dialog
opened. However, if that previously focused element no longer exists, you must add additional
handling to return focus to an element that makes sense for the user's workflow.

You can add handling for this situation with the `afterClosed` promise on `MatDialogRef`.

## Angular → Qwik notes

- **`MatDialog` service → `useMatDialog()` hook.** `open$`/`dismiss$` are QRLs.
  `MatDialogRef.afterClosed()`/`.afterOpened()`/`.beforeClosed()` Observables become plain
  `afterClosed`/`afterOpened`/`beforeClosed` Promise properties.
- **`MatDialogRef.backdropClick()`/`keydownEvents()` Observables → `onBackdropClick$`/
  `onKeydown$`/`onOutsidePointer$` QRLs on `MatDialogConfig`.** `onBackdropClick$` fires on every
  backdrop click regardless of `disableClose`, matching upstream.
- **`MatDialog.afterAllClosed` Observable → `afterAllClosed$(callback)`**, a callback-
  registration method returning an unsubscribe QRL (a one-shot `Promise` can't represent
  something that fires more than once).
- **No `TemplateRef` overload** — `open$` only accepts a `component$`.
- **`mat-dialog-title`/`mat-dialog-content`/`mat-dialog-actions`/`mat-dialog-close` directives →
  components (`<MatDialogTitle>`, `<MatDialogContent>`, `<MatDialogActions>`,
  `<MatDialogClose>`).** A plain `matButton` stacked with `[mat-dialog-close]` can't be composed
  the same way from the outside as upstream's directive — compose a small local button that
  reads `MAT_DIALOG_REF` via `useContext` and calls `dialogRef?.close(result)` directly (see
  [Composing directives](/guide/composing-directives/)).
- **`MatDialogRef.componentRef`/`.componentInstance` not meaningfully populated** — no
  `ComponentRef` equivalent exists in Qwik; `componentInstance` is always `Signal<null>`.
- **No `viewContainerRef`/`injector` config fields** — no DI container concept in Qwik.
  `MatDialogConfig.providers` → `MatDialogConfig.context` (`OverlayContextOverride[]`).
- **Global defaults via `QwikMaterialProvider`**, not an `MAT_DIALOG_DEFAULT_OPTIONS` injection
  token.
- **Harness not ported.**
