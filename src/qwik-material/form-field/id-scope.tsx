import {
  component$,
  createContextId,
  useContext,
  useContextProvider,
  type JSXOutput,
} from '@qwik.dev/core';

/**
 * Context a `<MatHint>`/`<MatError>` reads as its id FALLBACK (an explicit
 * `id` prop always wins) when `MatFormField` generated one for it. A
 * plain `string | undefined` — never a function, same reasoning as every
 * other piece of state this port passes across a component boundary.
 */
export const MAT_ASSIGNED_ID = createContextId<string | undefined>('qwikMaterial/assignedId');

/**
 * Wraps a single hint/error WITHOUT cloning it, providing the id
 * `MatFormField` generated for this slot via context instead. Renders no
 * DOM of its own — purely a context boundary.
 *
 * Replaces an earlier approach that CLONED the hint/error's JSX descriptor
 * to inject `id` as a prop directly (`withProps()`/`withGeneratedId()` in
 * `mat-form-field.tsx`'s git history). That approach was found, via a real
 * hung-browser repro, to silently freeze the slot's PROJECTED CHILDREN at
 * whatever they were the first time `MatFormField` happened to re-render
 * for an unrelated reason (its own 300ms animations-enabled timer) —
 * confirmed by reproducing it, then confirming context-based injection
 * (which never reconstructs the original JSX node at all) does not have
 * the same issue. See `core/mat-form-field-control.ts`'s
 * `MatFormFieldControlState.assignedId` doc comment for the analogous fix
 * applied to the control itself (a context STORE FIELD, not a clone).
 *
 * Takes `content` as an explicit PROP, not `<Slot/>`-projected JSX children — a Qwik v2
 * regression fix (2026-11-01). `mat-form-field.tsx`'s 3 call sites all forward a `JSXOutput`
 * that arrived through `MatFormField`'s OWN `errors`/`hintStart`/`hintEnd` props (i.e. authored
 * by a caller several component-boundaries away, not as literal JSX children written inline at
 * THIS call site) into `<MatIdScope>{node}</MatIdScope>`. Confirmed live: under Qwik v2, a
 * `<Slot/>` projecting a value that arrived this way — through a prop, then re-inserted as JSX
 * children — loses its OWN nested text/Slot content (an error's `<MatError>Please enter a valid
 * date</MatError>` rendered with a completely empty label), even on a plain, FRESH-every-render
 * value (ruling out element-reuse as the cause here; that's a SEPARATE Qwik v2 regression,
 * worked around by `core/jsx-reuse.ts`'s `cloneJsxForReuse` where it applies). Interpolating the
 * value directly as `{props.content}` instead of through `<Slot/>` sidesteps it, matching the
 * same fix applied to `qwik-material/datepicker`'s `ActionsOutlet` (see that file's doc comment)
 * — both are instances of "a `<Slot/>` whose projected content didn't originate as this
 * component's own JSX children" breaking under v2.
 */
export const MatIdScope = component$<{id: string; content: JSXOutput}>(props => {
  useContextProvider(MAT_ASSIGNED_ID, props.id);
  return props.content;
});

/** Sentinel passed as `useContext`'s default — see `useAssignedId()`'s own doc comment for why
 *  the literal value `undefined` can't be used as that default directly. Module-private. */
const NO_SCOPE = Symbol('no-id-scope');

/**
 * Reads the `MAT_ASSIGNED_ID` context, or `undefined` outside a scope.
 *
 * Can't simply call `useContext(MAT_ASSIGNED_ID, undefined)` — confirmed live (a genuine Qwik
 * 1.20 core bug, not a guess): `useContext`'s own implementation checks `defaultValue !==
 * undefined` to decide whether a default was supplied at all, so passing the literal value
 * `undefined` as the default is indistinguishable from passing none, and it throws
 * `QError_notFoundContext` instead of returning it. Only matters for a `<MatHint>`/`<MatError>`
 * rendered with no `MatIdScope`/`MatFormField` ancestor at all (every in-product usage has one;
 * this surfaced via a dev-app route rendering a lone, chunk-warming `<MatError>` outside any
 * form field). Routing through a private sentinel default sidesteps the bug entirely.
 */
export function useAssignedId(): string | undefined {
  const value = useContext(MAT_ASSIGNED_ID, NO_SCOPE as unknown as string | undefined);
  return value === (NO_SCOPE as unknown as string | undefined) ? undefined : value;
}
