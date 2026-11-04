The `useMatBottomSheet()` hook can be used to open Material Design panels to the bottom of the
screen. These panels are intended primarily as an interaction on mobile devices where they can be
used as an alternative to dialogs and menus.

<!-- example(bottom-sheet-overview) -->

You can open a bottom sheet by calling `open$` with a component to render and an optional config
object. `open$` returns a `MatBottomSheetRef`:

```tsx
const bottomSheet = useMatBottomSheet();
const ref = bottomSheet.open$(SocialShareComponent, {
  ariaLabel: 'Share on social media',
});
```

The `MatBottomSheetRef` is a reference to the currently-opened bottom sheet and can be used to
close it or to await its lifecycle. Note that only one bottom sheet can be open at a time. Any
component rendered inside a bottom sheet can read `MAT_BOTTOM_SHEET_REF` via `useContext` as well.

```tsx
ref?.afterDismissed.then(() => {
  console.log('Bottom sheet has been dismissed.');
});

ref?.dismiss();
```

### Sharing data with the bottom sheet component.
If you want to pass in some data to the bottom sheet, you can do so using the `data` property:

```tsx
const ref = bottomSheet.open$(HobbitSheet, {
  data: {names: ['Frodo', 'Bilbo']},
});
```

Afterwards you can access the injected data using the `MAT_BOTTOM_SHEET_DATA` context:

```tsx
import {component$, useContext} from '@qwik.dev/core';
import {MAT_BOTTOM_SHEET_DATA} from '@angular-community/qwik-material/bottom-sheet';

export default component$(() => {
  const data = useContext(MAT_BOTTOM_SHEET_DATA) as {names: string[]};
  return <>passed in {data.names}</>;
});
```

### Specifying global configuration defaults
Default bottom sheet options can be provided through
`useMatBottomSheetProvider({defaults: {hasBackdrop: false}})`, called once near the root of
your app (or anywhere deeper, to scope it to one subtree) — see
[Getting started](/guide/getting-started/#wire-up-your-app-root).

### Passing props to the opened component
Use `componentProps` to pass initial props to the component rendered inside the sheet, and
`setInput` on the returned `MatBottomSheetRef` to update a prop later, reactively — same pattern
as [the dialog overview](/overview/dialog/#passing-props-to-the-opened-component).

### Confirming before dismissing
`onBackdropClick$` fires on every backdrop click, even when `disableClose` is `true`, and
`disableClose` itself can be reassigned on the ref at any time — same pattern as
[the dialog overview](/overview/dialog/#confirming-before-closing).

### Closing on navigation
By default (`closeOnNavigation: true`), the sheet dismisses when the user navigates back or
forward in their browser history, or the URL hash changes — not on every link click. Set
`closeOnNavigation: false` to opt out.

### Contexts inside the bottom sheet
Content rendered inside the sheet automatically sees every configuration context a
`useMat*Provider()` call made visible where `useMatBottomSheet()` was called, and can opt in
your own app contexts via `context` — same pattern as
[the dialog overview](/overview/dialog/#contexts-inside-the-dialog).

### Accessibility

`useMatBottomSheet()` creates modal dialogs that implement the ARIA `role="dialog"` pattern. This
root dialog element should be given an accessible label via the `ariaLabel` property of
`MatBottomSheetConfig`.

#### Keyboard interaction
By default, the escape key closes the bottom sheet. While you can disable this behavior by using
the `disableClose` property of `MatBottomSheetConfig`, doing this breaks the expected interaction
pattern for the ARIA `role="dialog"` pattern.

#### Focus management

When opened, the bottom sheet traps browser focus such that it cannot escape the root
`role="dialog"` element. By default, the first tabbable element in the bottom sheet receives
focus. You can customize which element receives focus with the `autoFocus` property of
`MatBottomSheetConfig`, which supports the following values.

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

When closed, the bottom sheet restores focus to the element that previously held focus when the
bottom sheet opened. However, if that previously focused element no longer exists, you must add
additional handling to return focus to an element that makes sense for the user's workflow.
Opening a bottom sheet from a menu is one common pattern that causes this situation. The menu
closes upon clicking an item, thus the focused menu item is no longer in the DOM when the bottom
sheet attempts to restore focus.

You can add handling for this situation with the `afterDismissed` promise on `MatBottomSheetRef`.

```tsx
const ref = bottomSheet.open$(FileTypeChooser);
ref?.afterDismissed.then(() => {
  // Restore focus to an appropriate element for the user's workflow here.
});
```

## Angular → Qwik notes

- **`MatBottomSheet` service → `useMatBottomSheet()` hook.** `open$`/`dismiss$` are QRLs instead
  of methods on an injected service instance; `MatBottomSheetRef.afterDismissed()` /
  `afterOpened()` Observables become plain `afterDismissed` / `afterOpened` Promise properties.
- **`MatBottomSheetRef.backdropClick()` / `keydownEvents()` Observables → `onBackdropClick$` /
  `onKeydown$` / `onOutsidePointer$` QRLs on `MatBottomSheetConfig`** — same deviation as
  `qwik-material/dialog`'s `MatDialogConfig`. `onBackdropClick$` fires on every backdrop click
  regardless of `disableClose`, matching upstream.
- **No `TemplateRef` overload.** `open$` only accepts a `component$`, never a template.
- **No `viewContainerRef` / `injector` / `bindings` config fields** — no DI container or
  signal-input `Binding[]` API in Qwik; pass data through the content component's own props via
  `componentProps` / `MatBottomSheetRef.setInput`, or `MAT_BOTTOM_SHEET_DATA`.
- **`MatBottomSheetRef.componentRef` / `.instance` not meaningfully populated** — no `ComponentRef`
  equivalent exists in Qwik; `instance` is always `Signal<null>`.
- **Global defaults via a hook (`useMatBottomSheetProvider()`)**, not an `MAT_BOTTOM_SHEET_DEFAULT_OPTIONS`
  injection token.
- **Harness not ported.**
