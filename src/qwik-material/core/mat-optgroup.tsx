import {component$, Slot} from '@builder.io/qwik';
import {createIdGenerator} from '@angular-community/qwik-cdk/a11y';

/** Fallback id generator — see `mat-option.tsx`'s matching `fallbackIdGen`
 *  doc comment; same rationale, same "pure safety net" caveat. */
const fallbackIdGen = createIdGenerator();

/**
 * Qwik port of upstream `MatOptgroup` (`src/material/core/option/optgroup.ts`
 * + `optgroup.html`). Renders the literal `<mat-optgroup>` custom element
 * (same convention as `<mat-form-field>`/`<mat-label>`/`<mat-pseudo-checkbox>`
 * elsewhere in this port — see `intrinsic-elements.d.ts`).
 *
 * Unlike upstream, this component is never rendered directly by a
 * consumer's own JSX tree — it is a renderer invoked internally by whatever
 * owns the option list (`MatSelect` today; a future `MatAutocomplete`/
 * datepicker/timepicker port later), which passes every prop explicitly
 * after resolving its own `options` data (see
 * `qwik-material/select/select-option-resolver.ts` and that package's
 * `SYNC.md` for the full "SSR-correct option-definition shape" writeup —
 * the short version: Qwik can't introspect a `<Slot>`'s projected children
 * during its OWN SSR render, so the owning list component takes a plain
 * array of `<MatOption>`/`<MatOptgroup>` JSX *descriptors* as a prop,
 * mines each one's `.props` without rendering it, and then renders fresh
 * `<MatOptgroup>`/`<MatOption>` elements itself with every computed prop
 * filled in). `<MatOptgroup>`'s own children (via `<Slot/>`) are exactly
 * that owning component's rendered `<MatOption>` elements — ordinary,
 * synchronous JSX nesting, since the owner constructs both in the same
 * render pass.
 */
export interface MatOptgroupProps {
  /** Mirrors `MatOptgroup.label`. */
  label: string;
  /** Mirrors `MatOptgroup.disabled`. */
  disabled?: boolean;
  /** Mirrors `MatOptgroup._labelId` (`_IdGenerator().getId('mat-optgroup-label-')`).
   *  Optional — see `mat-option.tsx`'s matching `id` doc comment for why. */
  labelId?: string;
  /**
   * Mirrors `MatOptgroup._inert` — true only for a parent list that opts
   * into `MatOptionParentComponent.inertGroups` (upstream: `MatAutocomplete`
   * on Safari only; `MatSelect` never sets it, so every select scenario in
   * this port's parity suite passes `false`/omits this). When true, the
   * group's own `role`/`aria-disabled`/`aria-labelledby` are all omitted —
   * accessibility for the group is instead carried by a visually-hidden
   * span each contained `<MatOption>` renders itself (see
   * `mat-option.tsx`'s `groupInert`/`groupLabel` props).
   */
  inert?: boolean;
  class?: string | ReadonlyArray<string>;
}

export const MatOptgroup = component$<MatOptgroupProps>(props => {
  const inert = props.inert ?? false;
  const disabled = props.disabled ?? false;
  const labelId = props.labelId ?? fallbackIdGen.getId('mat-optgroup-label-');

  const labelClasses = ['mat-mdc-optgroup-label', disabled && 'mdc-list-item--disabled'].filter(
    Boolean,
  ) as string[];

  return (
    <mat-optgroup
      class={['mat-mdc-optgroup', props.class] as string[]}
      role={inert ? undefined : 'group'}
      aria-disabled={inert ? undefined : disabled ? 'true' : 'false'}
      aria-labelledby={inert ? undefined : labelId}
    >
      <span class={labelClasses} role="presentation" id={labelId}>
        <span class="mdc-list-item__primary-text">{props.label}</span>
      </span>
      <Slot />
    </mat-optgroup>
  );
});
