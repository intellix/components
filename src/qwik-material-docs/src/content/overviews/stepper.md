qwik-material's stepper provides a wizard-like workflow by dividing content into logical steps.

Material stepper builds on the foundation of the CDK stepper that is responsible for the logic
that drives a stepped workflow. `MatStepper` extends the CDK stepper and has Material Design
styling.

### Stepper variants

There are two stepper variants: `'horizontal'` and `'vertical'`. You can switch between the two
using the `orientation` prop.

<!-- example(stepper-overview) -->

<!-- example(stepper-vertical) -->

### Labels

If a step's label is only text, then the `label` prop can be used.

For more complex labels, pass a `labelTemplate` (a `JSXOutput`) instead.

#### Label position

For a horizontal stepper it's possible to define the position of the label. `'end'` is the
default value, while `'bottom'` will place it under the step icon instead of at its side. This
behavior is controlled by the `labelPosition` prop.

<!-- example(stepper-label-position-bottom) -->

#### Header position

If you're using a horizontal stepper, you can control where the stepper's content is positioned
using the `headerPosition` prop. By default it's on top of the content, but it can also be
placed under it.

<!-- example(stepper-header-position) -->

### Stepper buttons

Upstream has two directives to support navigation between steps: `matStepperPrevious` and
`matStepperNext`. qwik-material exposes the same behavior via `useMatStepperNext()`/
`useMatStepperPrevious()` hooks (see [Angular → Qwik notes](#angular-qwik-notes) below), spread
onto whatever button component you use.

### Linear stepper

The `linear` prop can be set on `<MatStepper>` to create a linear stepper that requires the user
to complete previous steps before proceeding to following steps. For each step, the
`stepControl` field can be set on its `MatStepDef` to a plain `{valid, invalid}` snapshot used to
check the validity of the step (see [Angular → Qwik notes](#angular-qwik-notes)).

Alternatively, if you don't want to use form validity, you can pass the `completed` field on each
step's `MatStepDef`, which won't allow the user to continue until it becomes `true`. Note that if
both `completed` and `stepControl` are set, `stepControl` takes precedence.

### Types of steps

#### Optional step

If completion of a step in a linear stepper is not required, then the `optional` field can be set
on its `MatStepDef`.

<!-- example(stepper-optional) -->

#### Editable step

By default, steps are editable, which means users can return to previously completed steps and
edit their responses. `editable: false` can be set on a step's `MatStepDef` to change the default.

<!-- example(stepper-editable) -->

#### Completed step

By default, a step's `completed` field returns `true` if the step is valid (in case of a linear
stepper) and the user has interacted with the step. You can also override this default
`completed` behavior by setting the `completed` field as needed.

#### Overriding icons

Upstream lets you override the `create`/`done` step-header icons by placing a `matStepperIcon`
template for each icon you want to override — not yet ported (see [Angular → Qwik
notes](#angular-qwik-notes)).

<!-- example(stepper-states) -->

### Controlling the stepper animation

You can control the duration of the stepper's animation using the `animationDuration` prop. If
you want to disable the animation completely, you can do so by setting it to `'0ms'`.

<!-- example(stepper-animations) -->

#### Step States

You can set the state of a step to whatever you want via its `MatStepDef.state` field. The given
state by default maps to an icon, same as upstream.

### Error State

If you want to show an error when the user moved past a step that hasn't been filled out
correctly, you can set the error message through the step's `errorMessage` field and configure
the stepper to show errors via the `showError` option on `<QwikMaterialProvider>`'s stepper
global options (mirrors upstream's `STEPPER_GLOBAL_OPTIONS`/`showError`). Note that since
`linear` steppers prevent a user from advancing past an invalid step to begin with, this setting
will not affect steppers marked `linear`.

<!-- example(stepper-errors) -->

### Lazy rendering

By default, the stepper renders all of its content when it's initialized, and keeps it rendered
— qwik-material never detaches a step's content once rendered (see [Angular → Qwik
notes](#angular-qwik-notes)).

<!-- example(stepper-lazy-content) -->

### Responsive stepper

If your app supports a wide variety of screens and a stepper's layout doesn't fit a particular
screen size, you can control its `orientation` dynamically (e.g. from a media-query listener) to
change the layout based on the viewport — not yet ported as a live example (see [Angular → Qwik
notes](#angular-qwik-notes)).

<!-- example(stepper-responsive) -->

### Keyboard interaction

| Keyboard shortcut | Action                          |
|--------------------|----------------------------------|
| Left Arrow          | Focus the previous step header. |
| Right Arrow         | Focus the next step header.     |
| Enter               | Select the focused step.        |
| Space               | Select the focused step.        |

### Localizing labels

Upstream provides step-header labels (e.g. "Optional") through `MatStepperIntl`, overridable via
DI — not yet ported, qwik-material hardcodes the default English strings (see [Angular → Qwik
notes](#angular-qwik-notes)).

<!-- example(stepper-intl) -->

### Accessibility

The stepper is treated as a tabbed view for accessibility purposes, so it is given
`role="tablist"` by default. The header of a step that can be clicked to select the step is given
`role="tab"`.

## Angular → Qwik notes

- **Steps are a data array (`steps: MatStepDef[]`), not `<MatStep>` children.** Same "content
  projection Qwik can't introspect" reasoning as `MatTabGroup`'s `tabs` array — see the [Tabs
  overview](/components/tabs/overview/)'s Angular → Qwik notes for the full write-up. `MatStepDef`
  mirrors `CdkStep`'s inputs 1:1 (`label`/`labelTemplate`/`stepControl`/`editable`/`optional`/
  `completed`/`hasError`/`state`/`errorMessage`).
- **Stepper navigation buttons are a hooks pattern, not stackable directives.** Upstream's
  `matStepperNext`/`matStepperPrevious` attach to any existing button; `useMatStepperNext()`/
  `useMatStepperPrevious()` return the equivalent `hostProps`, spread onto whatever component
  you're using as the button. Each hook call must happen in a component rendered INSIDE the
  owning `<MatStepper>`'s active step `content` (context resolves by the actual render tree).
- **No custom step-icon overrides (`matStepperIcon`) yet.** No equivalent prop/slot exists for
  overriding the default `create`/`done` icons per state.
- **Step content is never detached once rendered, regardless of lazy/eager origin upstream.**
  Unlike `MatTabGroup` (which detaches off-screen tab content by default), this port's step
  content persists once rendered — there's no separate "lazy" mechanism to opt into since all
  content effectively behaves the same way.
- **No `MatStepperIntl` localization yet.** Step-header strings (e.g. "Optional") are hardcoded
  English; no DI-style override mechanism is ported.
- **Dynamic orientation switching based on viewport isn't demonstrated as a live example yet** —
  `orientation` itself is a plain reactive prop (just assign a signal driven by your own
  media-query listener), the gap is only in having a ready-made example.
