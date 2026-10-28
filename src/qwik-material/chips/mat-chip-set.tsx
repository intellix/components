import {$, component$, useOn, useSignal, type JSXOutput, type QRL} from '@builder.io/qwik';
import {isBrowser} from '@builder.io/qwik/build';
import {useAnimationsDisabled} from '../dialog/use-animations-disabled';
import {MatChip, type MatChipRemoveButtonDef} from './mat-chip';

/**
 * Descriptor for one `<MatChip>` rendered inside `<MatChipSet chips={[...]}>`.
 * See `mat-chip-set.tsx`'s module doc comment for why `MatChipSet` takes a
 * DATA ARRAY rather than `<Slot>`-projected `<MatChip>` children.
 */
export interface MatChipDef {
  /**
   * Stable identity for this entry — mirrors Angular's `@for (... track ...)`. Falls back to
   * `id`, then array index, when omitted. Needed whenever entries are added/removed from the
   * middle of the array (e.g. `removable`'s fruit chips): upstream keeps each SURVIVING
   * chip's own auto-generated id stable across a removal (ids are per-chip, never reassigned
   * on reflow — confirmed live). Keying by array index alone would make Qwik reuse the
   * component instance at a given index for whatever item slides into it, handing that
   * surviving item the REMOVED item's id instead of its own. Pass the item's own value
   * (`key={fruit}`) wherever the array can be reordered/spliced.
   */
  key?: string | number;
  id?: string;
  /** The chip's visible text/content (what would be `<MatChip>` children upstream). */
  content: JSXOutput;
  disabled?: boolean;
  highlighted?: boolean;
  color?: string | null;
  removable?: boolean;
  disableRipple?: boolean;
  'aria-label'?: string;
  avatar?: JSXOutput;
  trailingIcon?: JSXOutput;
  removeButton?: MatChipRemoveButtonDef;
  onRemoved$?: QRL<() => void>;
  class?: string | ReadonlyArray<string>;
}

/**
 * Props for `<MatChipSet>` — upstream `MatChipSet` (`src/material/chips/chip-set.ts`),
 * the base, non-selectable chip container.
 *
 * ## Why `chips: MatChipDef[]` instead of nested `<MatChip>` children
 *
 * Upstream's `role` getter is `this.empty ? null : this._defaultRole` — the
 * `role` ATTRIBUTE ITSELF disappears once the set has zero chips (confirmed
 * live: `removable`'s final step). `MatChipListbox`/`MatChipGrid` (which
 * extend this class) ALSO gate their own `tabIndex`/`aria-required` host
 * attributes on chip count. All of this must be correct on the very FIRST
 * (SSR) render.
 *
 * Qwik's `component$` strips `children` from the props its render function
 * receives — content projection (`<Slot/>`) is resolved independently of a
 * component's own synchronous render, by design, for resumability (see
 * `qwik-material/grid-list/mat-grid-list.tsx`'s header comment, confirmed
 * empirically there). So a `<MatChipSet>` implemented as a normal
 * `component$` with `<Slot/>`-projected `<MatChip>` children could never
 * know "how many chips do I have" at the moment it needs to decide its OWN
 * `role`/`tabIndex` attributes — there is no "render children, look at what
 * they turned out to be, then decide the parent's attributes" order
 * available to it.
 *
 * `qwik-material/tabs`' `MatTabGroup` (`tabs: MatTabDef[]`) and
 * `qwik-material/stepper`'s `MatStepper` (`steps: MatStepDef[]`) hit the
 * EXACT same problem (their own host/ARIA structure depends on the full set
 * of children up front) and solved it the same way: a plain data-array
 * prop, each entry carrying a `content: JSXOutput` field for whatever
 * arbitrary visible content that entry needs — THIS is "the most
 * migration-friendly SSR-correct shape" the remediation design doc asks
 * every ported component to pick for this exact dilemma. `MatChipSet`/
 * `MatChipListbox`/`MatChipGrid` all follow it. Every OTHER field on
 * `MatChipDef` maps 1:1 to the matching Angular `@Input` name, so porting a
 * `<mat-chip-set><mat-chip [disabled]="x">...</mat-chip></mat-chip-set>`
 * template to `<MatChipSet chips={[{disabled: x, content: <>...</>}]} />`
 * is a mechanical, field-by-field rename — not a redesign.
 *
 * (Compare `qwik-material/button-toggle`'s `MatButtonToggleGroup`, which
 * DOES use ordinary `<Slot/>`-projected `<MatButtonToggle>` children: its
 * own `role`/host attributes never depend on how many toggles it has, so it
 * never hits this wall and can stay with the simpler, more Angular-template-
 * shaped nested-JSX authoring. The dividing line is exactly that
 * dependency, not a blanket policy.)
 */
export interface MatChipSetProps {
  chips: MatChipDef[];
  disabled?: boolean;
  'aria-label'?: string;
  'aria-labelledby'?: string;
  /** Explicit role override. Omit to get upstream's computed default
   *  (`'presentation'`, or no attribute at all when `chips` is empty). */
  role?: string | null;
  id?: string;
  class?: string | ReadonlyArray<string>;
}

export const MatChipSet = component$<MatChipSetProps>(props => {
  const chips = props.chips;
  const disabled = props.disabled ?? false;
  const empty = chips.length === 0;
  // Upstream's `role` getter: `this._explicitRole ?? (this.empty ? null : this._defaultRole)`.
  const role = props.role !== undefined ? props.role : empty ? null : 'presentation';
  const classes = ['mat-mdc-chip-set', 'mdc-evolution-chip-set', props.class].filter(
    Boolean,
  ) as string[];

  // See `mat-chip.tsx`'s `rippleDisabledInitial` doc comment for the full write-up of the
  // upstream timing quirk this reproduces (`_isRippleDisabled()` frozen `true` at
  // construction, corrected on the next Angular change-detection pass — which runs
  // whole-tree, so ANY event anywhere corrects every surviving chip, not just the one
  // interacted with) and for why the correction is applied here, IMPERATIVELY, rather than
  // through a signal a descendant `<MatChip>` would read reactively (that path was found,
  // via an extensive live repro, to recompute correctly but never actually patch the live
  // DOM attribute on a DIFFERENT component instance than the one whose own host-scoped
  // listener wrote the signal — see `mat-chip.tsx`'s own doc comment for the two-path split:
  // a chip that receives its OWN qualifying event self-corrects reactively via
  // `rippleInitialized`; this container-level pass exists for chips that never do, e.g.
  // `removable`'s chip that did NOT receive the reflow-under-pointer `mouseenter`). A single
  // `useOn()` here (bubbling — covers every descendant chip for free, including a remove
  // button two levels down) directly corrects each currently-rendered base `<mat-chip>` host
  // that is eligible (has a remove button and isn't disabled/ripple-disabled/animation-
  // disabled). Idempotent (a `removeAttribute()` on an already-absent attribute is a no-op)
  // but deliberately re-applied on EVERY qualifying event, not just once: `<MatChip>`'s
  // `rippleDisabledInitial` is recomputed fresh — still unconditionally `true` before path
  // (1) fires — every time ITS OWN function re-runs, and that happens whenever
  // `<MatChipSet>` itself re-renders with a structurally-new `chips` array (e.g. after a
  // removal splices the array) and reconstructs every surviving `<MatChip>`'s props as new
  // object references — confirmed live: a chip fixed-up after one removal reverted to showing
  // the attribute again after a LATER, unrelated removal of a DIFFERENT chip, because its own
  // props object changed identity even though every field stayed the same.
  const animationsDisabled = useAnimationsDisabled();
  const containerRef = useSignal<Element>();
  const fixupRippleDisabled$ = $(() => {
    const root = containerRef.value;
    if (!root || !isBrowser) return;
    // Deferred to the next frame: this chip-set's own re-render (triggered by the SAME
    // event bubbling to here) must land first, or `querySelectorAll` below could still see
    // last render's elements mid-removal.
    requestAnimationFrame(() => {
      const chipEls = Array.from(root.querySelectorAll('mat-chip'));
      chipEls.forEach((el, i) => {
        const def = chips[i];
        if (!def) return;
        const chipDisabled = (def.disabled ?? false) || disabled;
        const chipDisableRipple = def.disableRipple ?? false;
        const hasInteractiveActions = def.removeButton != null;
        if (
          hasInteractiveActions &&
          !chipDisabled &&
          !chipDisableRipple &&
          !animationsDisabled.value
        ) {
          el.removeAttribute('mat-ripple-loader-disabled');
        }
      });
    });
  });
  useOn('pointerdown', fixupRippleDisabled$);
  useOn('keydown', fixupRippleDisabled$);
  useOn('focusin', fixupRippleDisabled$);

  return (
    <mat-chip-set
      ref={containerRef}
      id={props.id}
      class={classes}
      role={role ?? undefined}
      aria-label={props['aria-label']}
      aria-labelledby={props['aria-labelledby']}
    >
      <div class="mdc-evolution-chip-set__chips" role="presentation">
        {chips.map((def, i) => (
          <MatChip
            key={def.key ?? def.id ?? i}
            id={def.id}
            disabled={def.disabled}
            chipListDisabled={disabled}
            highlighted={def.highlighted}
            color={def.color}
            removable={def.removable}
            disableRipple={def.disableRipple}
            aria-label={def['aria-label']}
            avatar={def.avatar}
            trailingIcon={def.trailingIcon}
            removeButton={def.removeButton}
            onRemoved$={def.onRemoved$}
            class={def.class}
          >
            {def.content}
          </MatChip>
        ))}
      </div>
    </mat-chip-set>
  );
});
