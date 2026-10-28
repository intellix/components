import {component$, createContextId, Slot, useContext, useContextProvider} from '@builder.io/qwik';

/**
 * Context a `<MatHint>`/`<MatError>` reads as its id FALLBACK (an explicit
 * `id` prop always wins) when `MatFormField` generated one for it. A
 * plain `string | undefined` — never a function, same reasoning as every
 * other piece of state this port passes across a component boundary.
 */
export const MAT_ASSIGNED_ID = createContextId<string | undefined>('qwik-material/assigned-id');

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

/** Reads the `MAT_ASSIGNED_ID` context, or `undefined` outside a scope. */
export function useAssignedId(): string | undefined {
  return useContext(MAT_ASSIGNED_ID, undefined);
}
