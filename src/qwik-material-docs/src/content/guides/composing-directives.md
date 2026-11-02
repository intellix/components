# Composing directives

Angular lets several attribute directives sit on one element at once:

```html
<!-- Angular -->
<button matButton [matMenuTriggerFor]="menu" matTooltip="Info" matBadge="4">
  Actions
</button>
```

Every qwik-material component that ports one of those directives — `MatButton` /
`MatIconButton` / `MatFabButton` / `MatMiniFabButton`, `MatMenuTrigger`, `MatTooltip`, `MatBadge`,
`MatIcon`, the stepper's `MatStepperNext` / `MatStepperPrevious` — renders **and owns** its own
host element, so it can render byte-identical DOM to Angular with no extra wrapper elements. That
means two of them can't simply be nested inside each other the way two Angular directives share
one native element.

## The hooks

The fix: every one of those directive-shaped features is also available as a **hook** —
`useMatMenuTrigger()`, `useMatTooltip()`, `useMatBadge()`, `useMatStepperNext()` /
`useMatStepperPrevious()` — that returns exactly what the real Angular directive would have
contributed to your element (classes, attributes, event handlers, a `ref` when needed) as a
plain, spreadable `HostProps` bag. You decide what actually owns the element — a host component
like `MatButton`, or a native tag — and spread the hook's result onto it:

```tsx
import {$, component$} from '@qwik.dev/core';
import {MatButton} from '@angular-community/qwik-material/button';
import {MatMenu, MatMenuItem, createMatMenu, useMatMenuTrigger} from '@angular-community/qwik-material/menu';
import {useMatTooltip} from '@angular-community/qwik-material/tooltip';
import {useMatBadge} from '@angular-community/qwik-material/badge';
import {mergeHostProps} from '@angular-community/qwik-material/core';

export default component$(() => {
  const menu = createMatMenu({
    content$: $(() => (
      <>
        <MatMenuItem>Refresh</MatMenuItem>
        <MatMenuItem>Settings</MatMenuItem>
      </>
    )),
  });

  const trigger = useMatMenuTrigger({menu});
  const tip = useMatTooltip({message: 'Info'});
  const badge = useMatBadge({content: '4'});

  return (
    <>
      {/* One hook: spread its hostProps directly. */}
      <MatButton {...trigger.hostProps}>Menu only</MatButton>

      {/* Two or more hooks on the SAME element: use mergeHostProps(), not two separate
          spreads — a plain {...a} {...b} object spread lets the later one silently overwrite
          the earlier one's same-named keys (onClick$, class, ...). mergeHostProps() composes
          them correctly: classes concatenate, same-named handlers both run, refs compose. */}
      <MatButton {...mergeHostProps(trigger.hostProps, tip.hostProps)} hostContent={badge.content}>
        Actions
      </MatButton>

      <MatMenu />
    </>
  );
});
```

## Rules of thumb

- **One hook → spread directly:** `<MatButton {...trigger.hostProps}>`.
- **Two or more hooks on the same element → `mergeHostProps(...)`,** not two separate spreads.
  It works on a plain native element too — `<button {...mergeHostProps(a, b)}>` — not just
  qwik-material components.
- **Extra rendered content** a directive contributes (like `useMatBadge()`'s badge-content span)
  isn't part of `hostProps` — it can't be "spread" onto an attribute. It's a separate `content`
  field on the hook's result; pass it through the host component's `hostContent` prop
  (`MatButton`, `MatIconButton`, `MatFabButton`, `MatMiniFabButton`, and `MatIcon` all accept it).
- **The plain components still work exactly as before.** `<MatMenuTrigger>`, `<MatTooltip>`,
  `<MatBadge>`, `<MatStepperNext>` / `<MatStepperPrevious>` are thin wrappers around these same
  hooks, for whenever you don't need to compose with another directive.

See `core/host-props.ts`'s doc comments for the full `HostProps` / `mergeHostProps()` /
`callHostHandler()` contract if you're writing your own composable hook.
