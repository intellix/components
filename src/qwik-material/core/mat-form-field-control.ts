import {createContextId, type JSXOutput} from '@builder.io/qwik';

/**
 * The Qwik port's equivalent of upstream's `MatFormFieldControl<T>` abstract
 * class (`src/material/form-field/form-field-control.ts`). Any component
 * meant to be rendered as `<MatFormField control={<X .../>}>`'s inner
 * control (`MatInput` today; a future `MatSelect`/`MatDatepickerInput`/
 * `MatChipGrid` etc.) should accept a props shape that is a structural
 * superset of {@link MatFormFieldControlProps}.
 *
 * ## Why this looks nothing like upstream's abstract class
 *
 * Upstream's contract is an object with GETTERS (`empty`, `shouldLabelFloat`,
 * `errorState`, ...) that `MatFormField` reads AFTER the control has been
 * content-projected and initialized (`ngAfterContentInit` / change
 * detection). Angular's multi-pass change detection lets a PARENT
 * re-evaluate its own template bindings AFTER a CHILD's content has
 * initialized or changed.
 *
 * Qwik's SSR is single-pass: a parent component's JSX — including the
 * attributes on its own host tag — is fully evaluated BEFORE any of its
 * `<Slot>`-projected (or prop-passed) children ever run their own render
 * function. Confirmed empirically for this port (a child component writing
 * into a shared `useStore()` DURING its own render never changes what the
 * ALREADY-rendered ancestor serialized — not during SSR, and never
 * afterwards either, since nothing re-triggers that ancestor's render once
 * resumed). Only a write from a genuinely later, client-only trigger (e.g.
 * a `useVisibleTask$`, or — the mechanism this port actually uses — a real
 * event handler such as `onFocus$`/`onBlur$`) reactively updates an
 * ancestor that read the same store/signal during its own earlier render.
 * See `form-field/SYNC.md`'s "SSR ordering" section for the write-up of the
 * experiment that nailed this down.
 *
 * So the contract here is split into two independent halves:
 *
 * 1. **{@link MatFormFieldControlProps}** — plain, synchronously-known
 *    VALUES (never getters, never functions) that `MatFormField` reads
 *    directly off the `control` prop's JSX descriptor
 *    (`(control as JSXNode).props`, via {@link readControlProps}) —
 *    WITHOUT rendering/executing the control at all. A JSX descriptor's
 *    `.props` is just a plain data bag built by the CALLER before either
 *    component renders, so this is available instantly, before
 *    `MatFormField` returns its own JSX — the very FIRST (SSR) render is
 *    correct, with nothing to "fix later". This is the same "pass a named
 *    prop instead of inspecting a `<Slot>`'s children" pattern
 *    `qwik-material/list`'s `MatListItem` already established for a
 *    smaller case (presence/count of a section) — extended here to reading
 *    actual prop VALUES, not just presence.
 *
 * 2. **{@link MatFormFieldControlState}** (the `MAT_FORM_FIELD_CONTROL_STATE`
 *    context) — the only fields that legitimately change AFTER mount with
 *    no consumer-visible trigger (`focused`, `empty`, `shouldLabelFloat`):
 *    a plain `useStore()` of BOOLEANS (deliberately never functions — see
 *    `mat-form-control.ts`'s own doc comment for why function-valued
 *    reactive state is unsafe to pass across a component boundary in this
 *    port) that `MatFormField` creates, seeds from (1), and provides via
 *    context BEFORE rendering the control. The control, once it actually
 *    renders (as a normal descendant), writes into this store from its OWN
 *    lazy `onFocus$`/`onBlur$` handlers — ordinary user-triggered QRLs, not
 *    a mount task (design doc rule 7 — "no per-instance useVisibleTask$ for
 *    interaction plumbing") — and `MatFormField`'s own render reads it
 *    reactively, so a write from anywhere correctly re-renders every
 *    subscriber regardless of tree position.
 *
 * Everything else that upstream computes reactively per-control
 * (`errorState`, `required`-from-validators, the `ng-*` classes) is, in
 * this port, computed by the ROUTE/consumer — who already owns whatever
 * reactive primitive drives it (see `core/mat-form-control.ts`) — and
 * handed to BOTH `<MatFormField>` (via channel (1) above, as fresh plain
 * booleans on every re-render) and to the control itself as plain props.
 * See `form-field/SYNC.md`'s "why form-field doesn't know about
 * validators".
 */
export interface MatFormFieldControlProps {
  /** Current value — used only to derive `empty` at first paint. */
  value?: string;
  disabled?: boolean;
  required?: boolean;
  readOnly?: boolean;
  placeholder?: string;
  /**
   * Explicit id. `MatFormField` generates one (via its own `mat-input-`
   * `useIdGenerator()` call) and injects it onto the rendered control when
   * this is omitted — see `form-field/SYNC.md` "id ownership" for why id
   * generation is centralized in `MatFormField` rather than the control,
   * unlike upstream (a deliberate, documented deviation).
   */
  id?: string;
  /**
   * Class suffix for `mat-mdc-form-field-type-<controlType>` on the host.
   * `MatInput` always passes `'mat-input'`.
   */
  controlType?: string;
  'aria-describedby'?: string;
  /**
   * Whether this control is bound to a reactive-forms-like primitive
   * (`useMatFormControl()` or equivalent) — mirrors upstream's
   * `ngControl !== null` gate for the `ng-*` classes / `aria-invalid`
   * default-attribute behavior (see the big comment in
   * `angular-parity.spec.ts`). Plain, uncontrolled inputs must leave this
   * `false`/undefined.
   */
  formBound?: boolean;
  /** Mirrors `NgControlStatus`'s touched/dirty (only meaningful when
   *  `formBound` is true). */
  touched?: boolean;
  dirty?: boolean;
  /**
   * Pre-computed validity (mirrors upstream's `errorState` getter, but
   * computed by the CONSUMER from their own validators — see
   * `core/mat-form-control.ts`). Only meaningful when `formBound` is true.
   */
  invalid?: boolean;
}

/**
 * The reactive (post-mount) half of the contract — see the big comment
 * above. Always plain data (booleans/strings); never a function or getter.
 */
export interface MatFormFieldControlState {
  focused: boolean;
  empty: boolean;
  shouldLabelFloat: boolean;
  /**
   * The id `MatFormField` decided for the control (its own explicit `id`
   * prop if it had one, else a generated fallback) — the control reads
   * this instead of computing its own, so the label's `for` and this id
   * always agree. See `mat-form-field.tsx`'s "id/describedby via context,
   * not cloning" note for why this is a STORE FIELD rather than a prop
   * `MatFormField` injects by cloning the control's JSX descriptor: a
   * clone-based injection was found, via a real hung/stuck-browser repro,
   * to silently stop propagating updates to the cloned element once
   * `MatFormField` re-rendered for an unrelated reason (e.g. its own
   * 300ms animations-enabled timer) — a store field, read directly, has
   * no such issue (confirmed by the same repro once switched).
   */
  assignedId: string;
  /** Mirrors upstream's `_syncDescribedByIds()` result — the control
   *  renders this directly as its `aria-describedby` (already merged with
   *  the control's own explicit `aria-describedby`, if any, by
   *  `MatFormField`) rather than merging it again itself. */
  assignedDescribedBy: string | undefined;
}

/**
 * Context id a `<MatFormField>` instance provides (seeded from
 * {@link readControlProps} on its own `control` prop) and the rendered
 * control reads/writes via its own lazy event handlers. Never exists
 * without an owning `MatFormField` — there is no sensible standalone
 * default, so every consumer MUST go through a `<MatFormField>`.
 */
export const MAT_FORM_FIELD_CONTROL_STATE = createContextId<MatFormFieldControlState>(
  'qwik-material/form-field-control-state',
);

/**
 * Reads the props of a `JSXOutput` value produced by `<SomeComponent .../>`
 * WITHOUT rendering/executing that component — see the big comment above.
 * Returns `undefined` for anything that isn't a single JSX element
 * descriptor (`null`/`undefined`/a string/a number/a boolean/an array).
 */
export function readControlProps(
  node: JSXOutput | undefined,
): MatFormFieldControlProps | undefined {
  if (node && typeof node === 'object' && !Array.isArray(node) && 'props' in node) {
    return (node as {props: MatFormFieldControlProps}).props;
  }
  return undefined;
}
