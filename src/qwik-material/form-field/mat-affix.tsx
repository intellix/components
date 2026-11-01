import {component$, Slot} from '@qwik.dev/core';

/**
 * Mirrors upstream's `MatPrefix`/`MatSuffix`
 * (`src/material/form-field/directives/prefix.ts` + `suffix.ts`) — both
 * directives share ONE selector covering 3 attribute spellings
 * (`[matPrefix],[matIconPrefix],[matTextPrefix]` / the suffix equivalent),
 * with `_isText` distinguishing only the `matTextPrefix`/`matTextSuffix`
 * spelling. This port splits that one directive into two dedicated
 * components per side (`MatIconPrefix`/`MatTextPrefix`,
 * `MatIconSuffix`/`MatTextSuffix`) since `<MatFormField>` needs the
 * icon-vs-text distinction as a NAMED PROP anyway (`iconPrefix`/
 * `textPrefix`/`iconSuffix`/`textSuffix` — see `mat-form-field.tsx`'s doc
 * comment for why content is passed as named props, not nested children) —
 * there is no bare, undistinguished `matPrefix`/`matSuffix` prop in this
 * port's surface (no parity scenario exercises that spelling; a future
 * consumer needing it can just use the icon variant, which renders
 * identically — same selector-attribute category either way).
 *
 * Each renders a bare `<span>` with the literal selector attribute
 * (`matTextPrefix=""` etc — a CONSUMER_SELECTOR_ATTRS candidate, see
 * `angular-parity.spec.ts`'s header comment) and NO Material-added classes
 * — confirmed live: the classes live on `MatFormField`'s own wrapping
 * `.mat-mdc-form-field-{icon,text}-{prefix,suffix}` container instead.
 */
export interface MatAffixProps {
  class?: string | ReadonlyArray<string>;
  id?: string;
}

export const MatIconPrefix = component$<MatAffixProps>(props => (
  <span {...{maticonprefix: ''}} id={props.id} class={props.class as string | string[] | undefined}>
    <Slot />
  </span>
));

export const MatTextPrefix = component$<MatAffixProps>(props => (
  <span {...{mattextprefix: ''}} id={props.id} class={props.class as string | string[] | undefined}>
    <Slot />
  </span>
));

export const MatIconSuffix = component$<MatAffixProps>(props => (
  <span {...{maticonsuffix: ''}} id={props.id} class={props.class as string | string[] | undefined}>
    <Slot />
  </span>
));

export const MatTextSuffix = component$<MatAffixProps>(props => (
  <span {...{mattextsuffix: ''}} id={props.id} class={props.class as string | string[] | undefined}>
    <Slot />
  </span>
));
