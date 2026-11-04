import {
  component$,
  Slot,
  useContext,
  useSignal,
  useVisibleTask$,
  type Component,
  type FunctionComponent,
} from '@qwik.dev/core';
import {computeContentMargins, MAT_DRAWER_CONTAINER_STATE} from './drawer-state';

/**
 * Props for `<MatDrawerContent>`/`<MatSidenavContent>`. Must be rendered
 * inside a `<MatDrawerContainer>`/`<MatSidenavContainer>` (same
 * `MAT_DRAWER_CONTAINER_STATE` requirement as `MatDrawer`/`MatSidenav`).
 */
export interface MatDrawerContentProps {
  class?: string | ReadonlyArray<string>;
  id?: string;
  /** Inline style, merged with this component's own computed `margin-left`/`margin-right` —
   *  this property wins for whichever of those two the caller also sets; the computed value
   *  still applies for the one(s) the caller didn't set. Mirrors Angular's own host
   *  style-binding merge, which is how upstream lets an app bind `style` on
   *  `<mat-sidenav-content>` while `MatDrawerContent`'s own `[style.margin-left]`/
   *  `[style.margin-right]` host bindings keep applying (`src/material/sidenav/sidenav.ts`). */
  style?: string | Record<string, string | number>;
}

/** Whether the caller's `style` already sets `prop` — used to decide whether the mount-time
 *  margin re-apply below (see its own doc comment) should leave that property alone. */
function hasOwnStyleProperty(style: MatDrawerContentProps['style'], prop: string): boolean {
  if (style == null) return false;
  if (typeof style === 'string') return new RegExp(`(?:^|;)\\s*${prop}\\s*:`, 'i').test(style);
  return prop in style;
}

/**
 * Merges this component's own computed margins onto the caller's `style` — see
 * `MatDrawerContentProps.style`'s doc comment for the precedence rule. Object + object merges
 * per-property (caller spread last, so it wins). A string `style` can't be merged
 * property-by-property, so the computed margins are emitted as CSS text FIRST and the caller's
 * string appended after — within one `style` attribute, the browser's own "last declaration for
 * a property wins" parsing then gives the same caller-wins precedence.
 */
function mergeContentStyle(
  computed: Record<string, string>,
  caller: MatDrawerContentProps['style'],
): string | Record<string, string | number> {
  if (caller == null) return computed;
  if (typeof caller === 'string') {
    const computedText = Object.entries(computed)
      .map(([prop, value]) => `${prop}: ${value}`)
      .join('; ');
    return [computedText, caller].filter(Boolean).join('; ');
  }
  return {...computed, ...caller};
}

/**
 * Shared implementation behind `MatDrawerContent`/`MatSidenavContent` —
 * mirrors upstream's `MatSidenavContent extends MatDrawerContent`
 * (`src/material/sidenav/sidenav.ts`): identical behavior, different host
 * tag + an extra static class.
 */
function createContent(
  hostTag: 'mat-drawer-content' | 'mat-sidenav-content',
  extraHostClass: string | undefined,
): Component<MatDrawerContentProps> {
  return component$<MatDrawerContentProps>(props => {
    const containerState = useContext(MAT_DRAWER_CONTAINER_STATE);
    const hostRef = useSignal<HTMLElement>();

    // Mirrors `hostRef` into the shared `containerState.contentHostRef` once mounted, so a
    // registering `MatDrawer`/`MatSidenav` can reach this element imperatively for
    // SUBSEQUENT updates (see that field's doc comment in drawer-state.ts). `ref` itself
    // can't be bound directly to `containerState.contentHostRef` — empirically found, while
    // porting this component, to never actually populate a signal sourced from another
    // component's scope; a plain `useVisibleTask$` copy (no `track()`, no cross-component
    // signal read — just a one-time mount-driven assignment, the same justified exception
    // category as the width-measurement task in `mat-drawer.tsx`) reliably does.
    //
    // ALSO applies the current margins to itself here, synchronously in the same task —
    // relying solely on the (correct, but SSR/resume-only) reactive `style` below left a gap
    // for a drawer that's ALREADY `opened` at mount (e.g. `two-drawers`, `fixed-in-viewport`):
    // `MatDrawer`'s own task (which applies every SUBSEQUENT margins update, per the doc
    // comment above) can run BEFORE this one on initial mount, when `contentHostRef` is still
    // unset, so its very first write has nothing to act on — confirmed empirically while
    // porting this component. This task running for itself, using its own just-available
    // `hostRef`, has no such ordering dependency.
    useVisibleTask$(() => {
      containerState.contentHostRef.value = hostRef.value;
      const el = hostRef.value;
      if (!el) return;
      const m = computeContentMargins(containerState.registry.value);
      // Caller-set properties win (see `MatDrawerContentProps.style`'s doc comment) — skip
      // whichever of margin-left/margin-right the caller's own `style` already sets, so this
      // mount-time re-apply (see this task's OWN doc comment above for why it exists at all)
      // doesn't clobber it straight back to the computed-only value.
      if (!hasOwnStyleProperty(props.style, 'margin-left')) {
        el.style.marginLeft = m.left != null ? `${m.left}px` : '';
      }
      if (!hasOwnStyleProperty(props.style, 'margin-right')) {
        el.style.marginRight = m.right != null ? `${m.right}px` : '';
      }
    });

    // Reads the container's shared registry directly (same context both `MatDrawerContainer`
    // and every `MatDrawer`/`MatSidenav` read) rather than through a value the container
    // precomputes — see drawer-state.ts's doc comment on why this avoids a child-writes/
    // parent-already-rendered ordering problem. Reactive: re-renders whenever any registered
    // drawer's `opened`/`mode`/`width` changes, exactly mirroring upstream's
    // `_contentMarginChanges` subscription — this covers the INITIAL SSR/resume render
    // correctly. Subsequent updates (e.g. after a click) are additionally applied
    // IMPERATIVELY by whichever `MatDrawer`/`MatSidenav` registers the change, directly on
    // `containerState.contentHostRef` — see that field's doc comment in drawer-state.ts for
    // why: a task declared directly in this component to do the same imperative work was
    // empirically found, while porting this component, to never run at all on the client.
    const margins = computeContentMargins(containerState.registry.value);

    const classes = ['mat-drawer-content', extraHostClass, props.class].filter(Boolean) as string[];

    const computedStyle: Record<string, string> = {};
    if (margins.left != null) computedStyle['margin-left'] = `${margins.left}px`;
    if (margins.right != null) computedStyle['margin-right'] = `${margins.right}px`;
    const style = mergeContentStyle(computedStyle, props.style);

    const HostTag = hostTag as unknown as FunctionComponent<Record<string, unknown>>;

    return (
      <HostTag ref={hostRef} id={props.id} class={classes} style={style}>
        <Slot />
      </HostTag>
    );
  });
}

/** `<mat-drawer-content>` — see `MatDrawerContentProps`'s doc comment. */
export const MatDrawerContent: Component<MatDrawerContentProps> = createContent(
  'mat-drawer-content',
  undefined,
);

/** `<mat-sidenav-content>` — see `MatDrawerContentProps`'s doc comment. */
export const MatSidenavContent: Component<MatDrawerContentProps> = createContent(
  'mat-sidenav-content',
  'mat-sidenav-content',
);
