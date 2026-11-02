`useMatSnackBar()` is a hook for displaying snack-bar notifications.

<!-- example(snack-bar-overview) -->

### Opening a snackbar
A snackbar can contain either a string message or a given component.
```tsx
const snackBar = useMatSnackBar();

// Simple message.
const ref = snackBar.open$('Message archived');

// Simple message with an action.
const ref2 = snackBar.open$('Message archived', 'Undo');

// Render the given component into the snackbar.
const ref3 = snackBar.openFromComponent$(MessageArchivedComponent);
```

In each case, a `MatSnackBarRef` is returned. This can be used to dismiss the snackbar or to
await its lifecycle. For simple messages with an action, the `MatSnackBarRef` exposes an
`onAction` promise that resolves when the action is triggered. If you want to close a custom
snackbar that was opened via `openFromComponent$`, from within the component itself, you can
read `MAT_SNACK_BAR_REF` via `useContext`.

```tsx
ref?.afterDismissed.then(() => {
  console.log('The snackbar was dismissed');
});

ref?.onAction.then(() => {
  console.log('The snackbar action was triggered!');
});

ref?.dismiss();
```

### Dismissal
A snackbar can be dismissed manually by calling `dismiss()` on the `MatSnackBarRef` returned
from `open$`.

Only one snackbar can ever be opened at one time. If a new snackbar is opened while a previous
message is still showing, the older message will be automatically dismissed.

A snackbar can also be given a duration via the optional configuration object:
```tsx
snackBar.open$('Message archived', 'Undo', {duration: 3000});
```

### Sharing data with a custom snackbar
You can share data with the custom snackbar, that you opened via the `openFromComponent$`
method, by passing it through the `data` property:

```tsx
snackBar.openFromComponent$(MessageArchivedComponent, {data: 'some data'});
```

To access the data in your component, you have to read the `MAT_SNACK_BAR_DATA` context:

```tsx
import {component$, useContext} from '@qwik.dev/core';
import {MAT_SNACK_BAR_DATA} from '@angular-community/qwik-material/snack-bar';

export default component$(() => {
  const data = useContext(MAT_SNACK_BAR_DATA) as string;
  return <>passed in {data}</>;
});
```

### Annotating custom snackbar content
When opening a custom snackbar via `openFromComponent$`, you can use the following components to
annotate the content and ensure that it is styled consistently compared to snackbars opened via
`open$`.

* `<MatSnackBarLabel>` - Marks the text of the snackbar shown to users
* `<MatSnackBarActions>` - Marks the container element containing any action buttons
* `<MatSnackBarAction>` - Marks an individual action button

If none of these are used, all the content will be treated as text content.

<!-- example(snack-bar-annotated-component) -->

### Setting the global configuration defaults
If you want to override the default snack bar options, provide them through
`<QwikMaterialProvider matSnackBarConfig={{duration: 2500}}>` at the root of your app.

### Accessibility

`useMatSnackBar()` announces messages via an `aria-live` region. While announcements use the
`polite` setting by default, you can customize this by setting the `politeness` property of
`MatSnackBarConfig`.

A snack bar does not move focus to itself. Moving focus like this would disrupt users in the
middle of a workflow. For any action offered in the snackbar, your application should provide an
alternative way to perform the action. Alternative interactions are typically keyboard shortcuts
or menu options. You should dismiss the snackbar once the user performs its corresponding
action. A snackbar can contain a single action with an additional optional "dismiss" or "cancel"
action.

Avoid setting a `duration` for snackbars that have an action available, as screen reader users
may want to navigate to the snackbar element to activate the action. If the user has manually
moved their focus within the snackbar, you should return focus somewhere that makes sense in the
context of the user's workflow.

## Angular → Qwik notes

- **`MatSnackBar` service → `useMatSnackBar()` hook.** `open$`/`openFromComponent$`/
  `openFromTemplate$`/`dismiss$` are QRLs. `MatSnackBarRef.afterDismissed()`/`.afterOpened()`/
  `.onAction()` Observables become plain `afterDismissed`/`afterOpened`/`onAction` Promise
  properties.
- **`openFromTemplate$` accepts a Qwik `component$`, not a `TemplateRef`** (Qwik has no template
  concept) — same mechanism as `openFromComponent$`. A content component that renders bare text
  with no host tag reproduces upstream's `TemplatePortal` (no wrapping element); one that renders
  its own host tag reproduces `ComponentPortal`'s implicit host — the difference is purely a
  function of what the content component itself renders.
- **No true app-wide singleton tracking** — "only one snack bar visible at a time" is tracked
  per `useMatSnackBar()` call, not via an injector hierarchy. Every real scenario calls
  `useMatSnackBar()` once per route and drives every trigger off the same returned object, which
  satisfies the invariant in practice.
- **`MatSnackBarRef.containerInstance`/`.instance` not meaningfully populated** — no
  `ComponentRef` equivalent exists in Qwik.
- **No `BreakpointObserver`-driven handset mode.** `qwik-cdk` has no `BreakpointObserver` port
  yet.
- **Global defaults via `QwikMaterialProvider`**, not an `MAT_SNACK_BAR_DEFAULT_OPTIONS`
  injection token.
- **Harness not ported.**
