# @angular-community/qwik-material

Qwik port of Angular Material. First component: Dialog.

Consumes [@angular-community/qwik-cdk](../qwik-cdk/README.md) for overlay, dialog primitives, and a11y foundations. Ships MDC-parity SCSS and JS class-based animation state machine matching Angular Material's timing (150 ms enter, 75 ms exit).

## Upstream version

Targets **`@angular/material@21.2.14`** (git tag `v21.2.14`, commit
`8fe4d6a8ffcf`), rebaselined 2026-11-02 (see [SYNC.md](./SYNC.md) for
what changed between the port's original 22.1-next base and this
version).

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

### Standalone ripples (`matRipple`)

`useMatRipple()` is the same directive-hook pattern applied to upstream's `[mat-ripple]`/
`[matRipple]` directive — give ANY element (not just a qwik-material component) a ripple:

```tsx
import {useMatRipple} from '@angular-community/qwik-material/core';

const ripple = useMatRipple({centered: false, unbounded: false, color: 'rgba(0,0,0,.1)'});
return <div {...ripple.hostProps} class="my-surface">Click me</div>;
```

`<MatRipple as="div">` (from the same `/core` entry point) is a thin wrapper around the hook for
when you don't need to compose it with another directive. `ripple.launch$(x, y)`/`ripple.launch$
(config)`, `ripple.fadeOutAll$()`, and `ripple.fadeOutAllNonPersistent$()` mirror upstream's
imperative `MatRipple.launch()`/`fadeOutAll()`/`fadeOutAllNonPersistent()` — call them from your
own `onClick$`/etc. handlers the same way you'd call `useMatDialog().open$(...)`.

Every built-in component's own ripple (buttons, checkboxes, radios, chips, menu items, options,
slide toggles, tab labels/links) ALSO honours app-wide ripple defaults — upstream's
`MAT_RIPPLE_GLOBAL_OPTIONS` — via `<QwikMaterialProvider matRippleConfig={{disabled: false,
animation: {enterDuration: 225, exitDuration: 150}, terminateOnPointerUp: false}}>` (see
`dialog/qwik-material-provider.tsx`). Omit any field you don't want to override.

See `core/host-props.ts` for the full `HostProps`/`mergeHostProps()` API and its rationale, and
`docs/superpowers/specs/2026-10-31-qwik-material-directive-hooks-design.md` for the overall
design (including why this doesn't use Qwik's `useOn()` the way other lazy-interaction hooks in
this port do).

## Using with Formisch

qwik-material/qwik-cdk have **no dependency on any form library** — you bring your own (reactive
state + validators you wire by hand, same as `core/mat-form-control.ts`'s own
`useMatFormControl()`; or a real headless form library). This section documents the wiring for
[Formisch](https://formisch.dev/qwik/) (`@formisch/qwik`), a schema-first, fully-typed Qwik form
library, as a worked example — a full "account settings" form (text inputs, a textarea, a select,
a radio group, a slide-toggle, a checkbox, and a datepicker) lives at
`src/qwik-cdk-dev-app/src/routes/formisch/account/` in this repo, proven DOM-identical to an
Angular reactive-forms mirror by `src/qwik-cdk-parity-tests/specs/formisch/`.

### Install

```sh
pnpm add @formisch/qwik valibot
```

Add these to **your app**, not to qwik-material/qwik-cdk (which must stay form-library-agnostic).

### Vite config: `ssr.noExternal`

`@formisch/qwik` ships its `dist/*.qwik.js` **unoptimized** — real, literal `$(...)` calls, the
same way qwik-material/qwik-cdk's own source does, meant to be processed by YOUR app's Qwik Vite
plugin (which extracts each `$()` into its own lazy-loadable chunk) rather than pre-compiled into
opaque QRL references itself. Without telling Vite's SSR build to bundle it, your build will
succeed but the page will crash at runtime the moment you call `useForm$()`
(`Code(Q14): QRLs can not be dynamically resolved, because it does not have a chunk path` — confirmed
live). Add to your `vite.config.ts`:

```ts
export default defineConfig({
  // ...
  ssr: {
    noExternal: ['@formisch/qwik'],
  },
});
```

### The wiring pattern

Formisch's `useField(form, {path})` returns a `FieldStore` — reactive `input`/`errors`/
`isTouched`/`isDirty`/`isValid` signals, an `onInput(value)` method for programmatic sets, and a
`props` bag (`ref`/`name`/`onFocus$`/`onInput$`/`onChange$`/`onBlur$`) meant to be spread onto a
**native** element. qwik-material's controls split into two shapes that need different wiring:

- **Native-element controls** (`MatInput`, and — via the same `ref` composition —
  `MatDatepickerInput`/`MatTimepickerInput`/`MatAutocomplete`) actually render the native element
  Formisch's `field.props` wants to register. Spread `field.props`, adapted to this port's
  slightly different handler signatures (an extra live-element argument; Formisch's own
  `onFocus$`/`onBlur$` take none, which is harmless since the extra argument is simply ignored).
- **Custom controls** (`MatSelect`, `MatRadioGroup`, `MatCheckbox`, `MatSlideToggle` — none of
  which expose a native element to register) drive Formisch via `field.onInput(value)` instead —
  Formisch's own documented pattern for a custom control.

```tsx
import {useForm$, useField, Form} from '@formisch/qwik';
import * as v from 'valibot';
import {MatFormField, MatLabel, MatError} from '@angular-community/qwik-material/form-field';
import {MatInput} from '@angular-community/qwik-material/input';

const schema = v.object({name: v.pipe(v.string(), v.nonEmpty('Name is required'))});

export default component$(() => {
  const form = useForm$(() => ({schema, validate: 'initial', revalidate: 'input'}));
  const name = useField(form, {path: ['name']});

  return (
    <Form of={form} onSubmit$={$(output => {/* ... */})}>
      <MatFormField
        label={<MatLabel>Name</MatLabel>}
        touched={name.isTouched.value}
        dirty={name.isDirty.value}
        invalid={!name.isValid.value}
        control={
          <MatInput
            required
            // Must be a LITERAL, inline signal read — see "Gotchas" below.
            value={name.input.value}
            formBound
            ref={name.props.ref}
            touched={name.isTouched.value}
            dirty={name.isDirty.value}
            invalid={!name.isValid.value}
            onFocus$={$(() => name.props.onFocus$())}
            onInput$={$((e: Event, el: HTMLInputElement) => name.props.onInput$(e as InputEvent, el))}
            onBlur$={$(() => name.props.onBlur$())}
          />
        }
        errors={(name.errors.value ?? []).map(msg => <MatError key={msg}>{msg}</MatError>)}
      />
    </Form>
  );
});
```

### The helper approach

Writing that out per field gets repetitive fast. The example app's
`src/qwik-cdk-dev-app/src/routes/formisch/account/formisch-bindings.ts` factors it into small,
typed, per-control-kind functions (`matInputBindings(field)`, `matSelectBindings(field)`,
`matRadioGroupBindings(field)`, `matCheckboxBindings(field)`, `matSlideToggleBindings(field)`,
plus datepicker helpers) you spread onto each control, **except** `value` — see the next section
for why that one prop can't go through a helper. This file is intentionally **not** part of
qwik-material (it imports `@formisch/qwik`); copy/adapt it into your own app, the same way a
reactive-forms Angular app writes its own small `ErrorStateMatcher`/validator glue per form.

### Gotchas

- **A form library that owns its own `<form>`** (Formisch's `<Form>` does) can't be wrapped by
  `<MatForm>` (which renders its own `<form>` too — two nested `<form>`s isn't valid HTML).
  Use `MatFormSubmittedProvider` instead (`@angular-community/qwik-material/core`) — it provides
  the same "is the form submitted" state to descendant controls' default `ErrorStateMatcher`
  (`invalid && (touched || submitted)`) without rendering an element of its own:

  ```tsx
  <Form of={form} class={form.isSubmitted.value && 'ng-submitted'} onSubmit$={...}>
    <MatFormSubmittedProvider submitted={form.isSubmitted.value}>
      {/* MatFormField / MatInput / MatSelect / ... */}
    </MatFormSubmittedProvider>
  </Form>
  ```

  `ng-submitted` itself still needs to land on the real `<form>` — `<Form>` forwards an ordinary
  `class` prop onto the native element it renders, shown above; that's the supported way to reach
  it, not a workaround.

- **`value` must be a literal, inline signal read** — `value={field.input.value}`, written
  directly as that JSX attribute's expression. A spread (`{...{value: field.input.value, ...}}`)
  or a value returned from a helper function (`value={getValue(field)}`) will NOT pick up an
  externally-reassigned value (a form library's `reset()`/`setInput()`) once the control is
  nested inside `<MatFormField control={...}>` — confirmed live, see `input/SYNC.md`'s
  2026-11-02 entry for the full mechanism (Qwik's compiler gives a literal `attr={signal.value}`
  expression its own live binding, independent of the enclosing, frozen `control` prop's vnode
  identity — but it can't see "through" a spread or a function call to know a returned value came
  from a signal). This is the one prop every per-control-kind helper above deliberately omits.

- **An unselected `MatRadioGroup`'s `value` must be `undefined`, never `''`.** Formisch's own
  empty-string default for an unset required string field, if forwarded as-is, makes every radio
  button's roving-tabindex computation treat it as "a selection exists, it just doesn't match any
  button" instead of "nothing selected yet" — confirmed live via a parity diff (every button got
  `tabIndex={-1}` instead of the correct default `0`). Convert with `value || undefined` at the
  wiring boundary.

- **Datepicker needs a sync pattern, not a `value` prop.** `useMatDatepicker()`'s own `value`
  option is a plain hook-call argument (not a `component$` prop), so it can't be made live the
  way `MatInput`'s/`MatSelect`'s `value` can (see `datepicker/SYNC.md`'s 2026-11-02 entry for the
  confirmed-live reason the obvious fix doesn't work there). Instead: drive the picker's value
  FROM your field via `useMatDatepicker()`'s existing `onValueChange$` (fires uniformly whether
  the user typed or picked a date), and sync the OTHER direction — an external `reset()`/
  `setInput()` — with the exported `setMatDatepickerValue(picker, value)`
  (`@angular-community/qwik-material/datepicker`) from your OWN `useTask$`, tracking your field's
  input. `ref={field.props.ref}` (composed with the picker's own internal ref) is still what lets
  `focus()` find the native element on an invalid submit.

- **Validation timing**: Formisch's `validate`/`revalidate` modes (`useForm$()`'s config) decide
  WHEN a field's validity is (re)computed — set `validate: 'initial', revalidate: 'input'` to
  match Angular reactive forms' own always-on validity (a required-but-empty field is `invalid`
  from the very first render on both sides). Error *display* still only turns on once `touched`
  (or the form submits), via the default `ErrorStateMatcher` every qwik-material form control
  already implements — this doesn't make errors appear any earlier than Angular's. One semantic
  difference can't be configured away: Formisch's `isTouched` flips on FOCUS (or any value
  change), where Angular's `touched` flips on BLUR only. In practice this only matters for a
  snapshot taken BETWEEN focus and blur on the same field; track your own "has blurred" signal
  per field instead of reading `field.isTouched` directly if your app depends on that exact
  instant.

- **`field.props.name`** is a JSON-stringified path (e.g. `["name"]`), Formisch's own convention
  for decoding a plain `<form>` POST submission without JS — skip forwarding it unless your app
  actually relies on no-JS progressive-enhancement submission.
