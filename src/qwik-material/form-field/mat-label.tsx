import {component$, Slot} from '@qwik.dev/core';

/**
 * Mirrors upstream's `MatLabel` (`src/material/form-field/directives/label.ts`)
 * — a bare directive selector with NO host bindings. `<mat-label>` is
 * therefore just a literal, unstyled custom element in the compiled DOM
 * (confirmed live — see `angular-parity.spec.ts`'s skeleton comment: it
 * nests INSIDE `MatFormField`'s own `<label matFormFieldFloatingLabel>`
 * wrapper, not replaced/unwrapped by it).
 *
 * Pass the result as `<MatFormField label={<MatLabel>Email</MatLabel>}>`
 * — not as a nested child — see `mat-form-field.tsx`'s doc comment for why
 * (a component can't inspect its `<Slot>` content).
 */
export interface MatLabelProps {
  class?: string | ReadonlyArray<string>;
  id?: string;
}

export const MatLabel = component$<MatLabelProps>(props => (
  <mat-label id={props.id} class={props.class as string | string[] | undefined}>
    <Slot />
  </mat-label>
));
