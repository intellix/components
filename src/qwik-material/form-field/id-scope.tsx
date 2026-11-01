import {component$, createContextId, Slot, useContext, useContextProvider} from '@qwik.dev/core';

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
 * DOM of its own (`<Slot/>` with no wrapping host tag) — purely a context
 * boundary.
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
 */
export const MatIdScope = component$<{id: string}>(props => {
  useContextProvider(MAT_ASSIGNED_ID, props.id);
  return <Slot />;
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
