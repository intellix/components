# @angular-community/qwik-material

Qwik port of Angular Material. First component: Dialog.

Consumes [@angular-community/qwik-cdk](../qwik-cdk/README.md) for overlay, dialog primitives, and a11y foundations. Ships MDC-parity SCSS and JS class-based animation state machine matching Angular Material's timing (150 ms enter, 75 ms exit).

## Qwik version

Requires **Qwik v2** (`@qwik.dev/core` `>=2.0.0-rc.4`, a peer dependency; developed and tested
against `2.0.0-rc.4`). Upgraded from Qwik 1.x on 2026-11-01. For apps coming from Qwik 1:

- Import from `@qwik.dev/core` (and `@qwik.dev/router` instead of `@builder.io/qwik-city`); run
  `qwik migrate-v2` for your own code — see https://next.qwik.dev/docs/upgrade/.
- The public API of this package didn't change in the upgrade. Behavioural fixes made for v2
  (focus traps, overlay teardown, handler forwarding on host components, ...) are recorded in each
  entry point's `SYNC.md` under "Qwik v2".

## Layout

- `dialog/` — Material Dialog service, container, ref, config, content components, provider
- `scss/` — SCSS ported verbatim from `src/material/dialog/`

See [SYNC.md](./SYNC.md) for upstream sync state.

## Composing directives

Angular lets several attribute directives sit on one element at once:

```html
<!-- Angular -->
<button matButton [matMenuTriggerFor]="menu" matTooltip="Info" matBadge="4">
  Actions
</button>
```

Every qwik-material component that ports one of those directives
(`MatButton`/`MatIconButton`/`MatFabButton`/`MatMiniFabButton`, `MatMenuTrigger`, `MatTooltip`,
`MatBadge`, `MatIcon`, the stepper's `MatStepperNext`/`MatStepperPrevious`) renders **and owns**
its own host element, so it can render byte-identical DOM to Angular (no extra wrapper elements).
That means two of them can't simply be nested inside each other the way two Angular directives
share one element.

The fix: directive-shaped features are also available as **hooks** — `useMatMenuTrigger()`,
`useMatTooltip()`, `useMatBadge()`, `useMatStepperNext()`/`useMatStepperPrevious()` — that return
exactly what the real directive would have contributed to your element (classes, attributes,
event handlers, a `ref` when needed) as a plain, spreadable `HostProps` bag. You decide what
actually owns the element — a host component like `MatButton`, or a native tag — and spread the
hook's result onto it:

```tsx
// Qwik
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

      {/* Two or more hooks on the SAME element: use mergeHostProps(), not two
          separate spreads — a plain `{...a} {...b}` object spread lets the
          later one silently overwrite the earlier one's same-named keys
          (onClick$, class, ...). mergeHostProps() composes them correctly:
          classes concatenate, same-named handlers both run, refs compose. */}
      <MatButton
        {...mergeHostProps(trigger.hostProps, tip.hostProps)}
        hostContent={badge.content}
      >
        Actions
      </MatButton>

      <MatMenu />
    </>
  );
});
```

A few rules of thumb:

- **One hook → spread directly** (`<MatButton {...trigger.hostProps}>`). **Two or more hooks on
  the same element → `mergeHostProps(...)`.** It also works on a plain native element
  (`<button {...mergeHostProps(trigger.hostProps, tip.hostProps)}>`), not just qwik-material
  components.
- **Extra rendered content** a directive contributes (like `useMatBadge()`'s
  `.mat-badge-content` span) isn't part of `hostProps` — it can't be "spread" onto an attribute.
  It's a separate `content` field on the hook's result; pass it through the host component's
  `hostContent` prop (`MatButton`, `MatIconButton`, `MatFabButton`, `MatMiniFabButton`, and
  `MatIcon` all accept it).
- **The existing components still work exactly as before** — `<MatMenuTrigger>`, `<MatTooltip>`,
  `<MatBadge>`, `<MatStepperNext>`/`<MatStepperPrevious>` are thin wrappers around these same
  hooks, for whenever you don't need to compose with another directive.

See `core/host-props.ts` for the full `HostProps`/`mergeHostProps()` API and its rationale, and
`docs/superpowers/specs/2026-10-31-qwik-material-directive-hooks-design.md` for the overall
design (including why this doesn't use Qwik's `useOn()` the way other lazy-interaction hooks in
this port do).
