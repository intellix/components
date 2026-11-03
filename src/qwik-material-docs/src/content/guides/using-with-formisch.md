# Using with Formisch

qwik-material and qwik-cdk have **no dependency on any form library** — bring your own. This guide
documents the wiring for [Formisch](https://formisch.dev/qwik/) (`@formisch/qwik`), a schema-first,
fully-typed Qwik form library, as a worked example. A full "account settings" form (text inputs, a
textarea, a select, a radio group, a slide toggle, a checkbox, and a datepicker) lives in this
repo at `src/qwik-cdk-dev-app/src/routes/formisch/account/`, proven DOM-identical to an Angular
reactive-forms mirror by the repo's parity suite — read that route for a complete, real example
alongside this guide.

## Install

```bash
pnpm add @formisch/qwik valibot
```

Add these to **your app**, not to qwik-material/qwik-cdk (which must stay form-library-agnostic).

## Vite config: `ssr.noExternal`

`@formisch/qwik` ships its `dist/*.qwik.js` **unoptimized** — real, literal `$(...)` calls, the
same way qwik-material/qwik-cdk's own source does, meant to be processed by your app's own Qwik
Vite plugin rather than pre-compiled into opaque QRL references. Without telling Vite's SSR build
to bundle it, the build succeeds but the page crashes at runtime the moment you call `useForm$()`.
Add to your `vite.config.ts`:

```ts
export default defineConfig({
  // ...
  ssr: {
    noExternal: ['@formisch/qwik'],
  },
});
```

## The wiring pattern

Formisch's `useField(form, {path})` returns a `FieldStore` — reactive `input` / `errors` /
`isTouched` / `isDirty` / `isValid` signals, an `onInput(value)` method for programmatic sets, and
a `props` bag (`ref` / `name` / `onFocus$` / `onInput$` / `onChange$` / `onBlur$`) meant to be
spread onto a **native** element. qwik-material's controls split into two shapes that need
different wiring:

- **Native-element controls** (`MatInput`, and — via the same `ref` composition —
  `MatDatepickerInput` / `MatTimepickerInput` / `MatAutocomplete`) render the actual native element
  Formisch's `field.props` wants to register. Spread `field.props`, adapted to this port's
  slightly different handler signatures (an extra live-element argument; Formisch's own
  `onFocus$` / `onBlur$` take none, which is harmless since the extra argument is simply ignored).
- **Custom controls** (`MatSelect`, `MatRadioGroup`, `MatCheckbox`, `MatSlideToggle`,
  `MatButtonToggleGroup` — none of which expose a native element to register) drive Formisch via
  `field.onInput(value)` instead — Formisch's own documented pattern for a custom control. All
  five also accept `formBound` / `touched` / `dirty` / `invalid` (the exact same contract
  `MatInput`/`MatSelect` use) and an `onTouched$` callback — wire those too, the same way the
  worked example below does for `MatInput`, so the host picks up `ng-touched`/`ng-untouched`,
  `ng-pristine`/`ng-dirty`, `ng-valid`/`ng-invalid` and a form library finds out when the control
  is blurred (or, for `MatButtonToggleGroup` specifically, when a click actually changes the
  selection — see that control's own overview page for the exact, click-driven, not blur-driven,
  timing). Call `field.props.onFocus$()` for `onTouched$` (Formisch's own "just mark touched"
  primitive — there is no dedicated "mark touched without changing the value" method).

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

Writing this out per field gets repetitive fast — the example app's
`src/qwik-cdk-dev-app/src/routes/formisch/account/formisch-bindings.ts` factors it into small,
typed, per-control-kind helper functions (`matInputBindings(field)`, `matSelectBindings(field)`,
`matRadioGroupBindings(field)`, `matCheckboxBindings(field)`, `matSlideToggleBindings(field)`, plus
datepicker helpers) you spread onto each control — except `value` (see Gotchas). That file is
intentionally **not** part of qwik-material (it imports `@formisch/qwik`); copy and adapt it into
your own app, the same way a reactive-forms Angular app writes its own small
`ErrorStateMatcher` / validator glue per form.

## Gotchas

- **A form library that owns its own `<form>`** (Formisch's `<Form>` does) can't be wrapped by
  `<MatForm>` (which renders its own `<form>` too — two nested `<form>`s isn't valid HTML). Use
  `MatFormSubmittedProvider` instead (`@angular-community/qwik-material/core`) — it provides the
  same "is the form submitted" state to descendant controls' default `ErrorStateMatcher`
  (`invalid && (touched || submitted)`) without rendering an element of its own:

  ```tsx
  <Form of={form} class={form.isSubmitted.value && 'ng-submitted'} onSubmit$={...}>
    <MatFormSubmittedProvider submitted={form.isSubmitted.value}>
      {/* MatFormField / MatInput / MatSelect / ... */}
    </MatFormSubmittedProvider>
  </Form>
  ```

- **`value` must be a literal, inline signal read** — `value={field.input.value}`, written
  directly as that JSX attribute's expression. A spread or a value returned from a helper
  function will *not* pick up an externally-reassigned value (a form library's `reset()` /
  `setInput()`) once the control is nested inside `<MatFormField control={...}>`. This is the one
  prop every per-control-kind helper mentioned above deliberately omits.
- **An unselected `MatRadioGroup`'s `value` must be `undefined`, never `''`.** Formisch's
  empty-string default for an unset required string field, forwarded as-is, makes the group's
  roving-tabindex computation treat it as "a selection exists, it just doesn't match any button."
  Convert with `value || undefined` at the wiring boundary.
- **Datepicker needs a sync pattern, not a `value` prop.** `useMatDatepicker()`'s own `value`
  option is a plain hook-call argument, not a reactive `component$` prop. Drive the picker's value
  *from* your field via `useMatDatepicker()`'s `onValueChange$`, and sync the *other* direction
  (an external `reset()` / `setInput()`) with the exported `setMatDatepickerValue(picker, value)`
  from your own `useTask$`, tracking your field's input.
- **Validation timing:** set `validate: 'initial', revalidate: 'input'` in `useForm$()`'s config
  to match Angular reactive forms' always-on validity (a required-but-empty field is invalid from
  the first render on both sides). One semantic difference can't be configured away: Formisch's
  `isTouched` flips on *focus* (or any value change); Angular's `touched` flips on *blur* only.
  Track your own "has blurred" signal per field if your app depends on that exact instant.
- **`field.props.name`** is a JSON-stringified path (e.g. `["name"]`) — Formisch's own convention
  for decoding a plain `<form>` POST without JS. Skip forwarding it unless your app relies on
  no-JS progressive-enhancement submission.
