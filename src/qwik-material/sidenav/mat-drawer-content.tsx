import {
  component$,
  Slot,
  useContext,
  type Component,
  type FunctionComponent,
} from '@builder.io/qwik';
import {computeContentMargins, isShowingBackdrop, MAT_DRAWER_CONTAINER_STATE} from './drawer-state';

/**
 * Props for `<MatDrawerContent>`/`<MatSidenavContent>`. Must be rendered
 * inside a `<MatDrawerContainer>`/`<MatSidenavContainer>` (same
 * `MAT_DRAWER_CONTAINER_STATE` requirement as `MatDrawer`/`MatSidenav`).
 */
export interface MatDrawerContentProps {
  class?: string | ReadonlyArray<string>;
  id?: string;
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

    // Reads the container's shared registry directly (same context both `MatDrawerContainer`
    // and every `MatDrawer`/`MatSidenav` read) rather than through a value the container
    // precomputes — see drawer-state.ts's doc comment on why this avoids a child-writes/
    // parent-already-rendered ordering problem. Reactive: re-renders whenever any registered
    // drawer's `opened`/`mode`/`width` changes, exactly mirroring upstream's
    // `_contentMarginChanges` subscription.
    const margins = computeContentMargins(containerState.registry.value);
    const inert = isShowingBackdrop(
      containerState.registry.value,
      containerState.backdropOverride.value,
    );

    const classes = ['mat-drawer-content', extraHostClass, props.class].filter(Boolean) as string[];

    const style: Record<string, string> = {};
    if (margins.left != null) style['margin-left'] = `${margins.left}px`;
    if (margins.right != null) style['margin-right'] = `${margins.right}px`;

    // `inert="true"` (a literal string value, matching upstream's `element.setAttribute('inert',
    // 'true')` — NOT the bare boolean-reflected `inert=""` a plain `true` would otherwise
    // produce) only while a backdrop is genuinely showing. This port applies it immediately
    // (derived straight from `registry`) rather than upstream's extra ~50ms
    // `_drawerToggled()` delay — see drawer-state.ts's doc comment on why that's safe here.
    const inertAttr = inert ? 'true' : undefined;

    const HostTag = hostTag as unknown as FunctionComponent<Record<string, unknown>>;

    return (
      <HostTag id={props.id} class={classes} style={style} inert={inertAttr}>
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
