# qwik-material — directive hooks

**Date:** 2026-10-31
**Author:** Dominic + Claude

## Why

Angular lets several attribute directives sit on one element at once:

```html
<button matButton [matMenuTriggerFor]="menu" matTooltip="Info" matBadge="4">
```

Every qwik-material component that ports one of those directives
(`MatButton`/`MatIconButton`/`MatFabButton`/`MatMiniFabButton`, `MatMenuTrigger`, `MatTooltip`,
`MatBadge`, `MatIcon`, the stepper's `MatStepperNext`/`MatStepperPrevious`) renders AND owns its
own host element — design doc rule 4 (`2026-10-27-qwik-material-dom-parity-remediation-design.md`):
polymorphic `as` prop, intrinsic tags only, no wrapper elements. That rule is correct (it's what
keeps the rendered DOM byte-identical to Angular's), but it has a real consequence: two of these
components can never be nested inside each other without adding a wrapper element, which breaks
DOM parity. There was no way to port the example above at all.

Before this design, each docs-example port that needed this combination worked around it by hand:
`mat-menu/example`/`mat-tooltip/example` copied `MatButton`'s internal markup and drove the
runtime functions (`openMenu`/`showTooltip`) directly; `mat-badge/example` added a one-off
`trailingContent` prop to `MatButton`/`MatIcon`; the stepper added a `matButton` prop to
`MatStepperNext`/`MatStepperPrevious` that duplicated `MatButton`'s chrome inline;
`qwik-material/paginator`'s `PaginatorNavButton` hand-built a `matIconButton` + `matTooltip`
combination from scratch. Each one worked for its own scenario, but none of it was something a
real consumer (especially an Angular team migrating existing templates) could use for a NEW
combination — and the whole point of this port is that it's migration-friendly.

## The design

**Directive-style features become hooks.** `useMatMenuTrigger()`, `useMatTooltip()`,
`useMatBadge()`, `useMatStepperNext()`/`useMatStepperPrevious()` each return everything the real
Angular directive would have contributed to the consumer's own host element — classes,
attributes, event handlers, a `ref` when the directive needs the live element — as a `HostProps`
bag (`qwik-material/core/host-props.ts`). The caller decides what actually owns the element (a
plain native tag, or a host component like `MatButton`/`MatIcon`) and spreads the hook's result
onto it:

```tsx
const trigger = useMatMenuTrigger({menu});
const tip = useMatTooltip({message: 'Info about the action'});
return (
  <>
    <MatButton {...mergeHostProps(trigger.hostProps, tip.hostProps)}>Actions</MatButton>
    <MatMenu />
  </>
);
```

**`HostProps` is a flat bag of real JSX prop names**, not a nested shape — `class`, `onClick$`,
`aria-haspopup`, `ref`, … are literal keys, so `<button {...trigger.hostProps}>` and
`<MatButton {...trigger.hostProps}>` both just work via an ordinary JSX spread. Composing TWO
directives on the same element needs `mergeHostProps(...)` (NOT two separate spreads, which is a
plain object spread that lets the later one silently clobber the earlier one's same-named keys —
see `host-props.ts`'s own doc comment for the full rationale, including why an explicit
`host={[a, b]}` prop was considered and rejected): it concatenates classes, composes same-named
event handlers using Qwik's own native `QRLEventHandlerMulti` array form (no new `$()` closures
invented), composes `ref`s via a plain mount-time function, and merges every other attribute with
later-wins-if-defined semantics — while keeping a key PRESENT (even if `undefined`) whenever any
part mentions it at all, which turned out to be load-bearing for Qwik's DOM reconciliation (see
"Pitfalls found" below).

**A directive's own extra rendered content** (`useMatBadge()`'s `.mat-badge-content` span) is NOT
part of `HostProps` — it can't be "spread" onto an attribute. It's a separate field on the hook's
result (`useMatBadge(...).content`), placed via the host component's `hostContent` prop
(`MatButton`/`MatIcon`/the icon-button family all accept it — the renamed, generalized
`trailingContent`). A directive's own overlay/portal (a menu's panel, a tooltip's floating panel)
isn't part of `HostProps` either; it's rendered the same way it always was, as a sibling
(`<MatMenu/>`) or via `qwik-cdk/overlay`.

**Existing components become thin wrappers.** `<MatMenuTrigger>`, `<MatTooltip>`, `<MatBadge>`,
`<MatStepperNext>`/`<MatStepperPrevious>` keep their exact public API and rendered DOM — each one
just calls its own hook and `mergeHostProps()`s the result with its own remaining props, verified
by every affected component's full parity suite staying green across the refactor.

## Why this hook doesn't use `useOn()`

Every OTHER lazy interaction hook in this port (`useFocusOrigin()`, `useRippleLoader()`) uses
`useOn()`, which attaches a listener to "the calling component's own host element." That's fine
when the component calling it OWNS its host directly (`MatButton` calling `useFocusOrigin()` on
itself). It's NOT reliably fine for a hook meant to be called by a THIRD PARTY and spread onto a
DIFFERENT host component (`<MatButton {...tip.hostProps}>`) — which element Qwik resolves as "the
calling component's host" when that component's own JSX root is ANOTHER component (not a plain
tag) wasn't something this port verified conclusively enough to depend on silently. So
`useMatTooltip()` (the one hook that needs hover/focus/touch listeners) returns them as plain JSX
handler props instead (`onMouseEnter$`, `onFocusIn$`, …) — Qwik threads those through component
layers unambiguously, the same contract `class`/`onClick$` already rely on. Its keyboard-vs-
pointer focus-origin heuristic is reproduced from `useFocusOrigin()`'s own building blocks
(`wasRecentKeydown()`/`consumeRecentKeydown()`, promoted to `qwik-cdk/a11y`'s public API) rather
than calling `useFocusOrigin()` itself.

## Pitfalls found while building this

- **A host component wrapping a directive hook must pass its OWN live `props` object into the
  hook, not a rebuilt `{field: props.field, ...}` literal**, whenever the hook has internal
  `useTask$`-driven reactivity (`useMatTooltip()`'s message/disabled syncing).
  `useTask$`'s `track()` only establishes a subscription by reading through Qwik's real reactive
  props proxy; a brand-new plain object rebuilt from its fields every render is NOT that proxy, so
  tracking a field on it is a silent no-op — confirmed live (`message-change`'s message swap was
  stuck forever with the rebuilt-object version). `MatTooltipProps` being a structural superset of
  `UseMatTooltipProps` means passing `props` straight through satisfies the hook's parameter type
  with no cast.
- **A theorized "signal read inside a helper function loses reactivity" hazard did NOT
  generalize** to hooks called fresh every render. `mat-badge/example`'s OLD, pre-hooks
  `badgeDecoration()` helper had a documented comment warning that a signal's `.value` passed as a
  plain function parameter silently stops updating the DOM. `useMatBadge({hidden: hidden.value})`
  looks like the same shape, but is confirmed live to react correctly (the "Hide" button scenario
  toggles `.mat-badge-hidden` on click, through the hook, every time).
- **`mergeHostProps()` must keep a mentioned key PRESENT even when every part's value for it is
  `undefined`.** An earlier version dropped the key entirely once nothing defined it. That broke
  `aria-controls` specifically: closing a menu flips it to `undefined` on a client re-render, and a
  SPREAD prop whose KEY disappears (vs. staying present with an `undefined` value, the way a
  literal object expression always did) doesn't reliably get removed from the live DOM by Qwik's
  reconciler — confirmed live (`aria-controls="mat-menu-panel-0"` survived every subsequent
  close). See `host-props.spec.ts`'s regression test.
- **`Omit<T, K>` collapses every named property to the index signature's type** once `T` already
  has a `[key: string]: unknown` index signature (`keyof` a type with a string index signature is
  `string`, not the literal union of its named keys) — hit directly by `MatMiniFabProps extends
  Omit<MatFabProps, 'extended'>` once `MatFabProps` grew its own `[extraAttr]` index signature.
  Fixed by splitting `MatFabProps` into an index-signature-free `MatFabOwnProps` (which `Omit`
  works on correctly) plus `MatFabProps = MatFabOwnProps & {[k: string]: unknown}`.

## Out of scope / deferred

- `mat-dialog/example`'s hand-built `PlainButton` (combining bare `matButton` with
  `cdkFocusInitial` + `[mat-dialog-close]`) is a DIFFERENT composition than any directive this
  design covers — no hook for `cdkFocusInitial`/`mat-dialog-close` was in scope. Left as-is;
  documented here as checked, not silently skipped.
- `qwik-material/paginator`'s `PaginatorNavButton` (hand-built `matIconButton` + `matTooltip`) was
  NOT refactored onto the new hooks in this pass — see `paginator/SYNC.md` for the specific reason
  (its `disabledInteractive`-driven ripple/attribute timing is bespoke enough that refactoring it
  safely needs its own focused pass, not a mechanical swap).

## See also

- `qwik-material/core/host-props.ts` — the `HostProps`/`mergeHostProps()` implementation and its
  own, more detailed rationale.
- `qwik-material/README.md`'s "Composing directives" section — the consumer-facing how-to, with
  Angular → Qwik before/after examples.
- Each affected component's `SYNC.md` (`menu`, `tooltip`, `badge`, `button`, `icon`, `stepper`) —
  the specific deviation this replaced and how parity was reverified.
