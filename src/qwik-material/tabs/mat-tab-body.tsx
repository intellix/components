import {component$, useSignal, useTask$, type JSXOutput} from '@builder.io/qwik';

/**
 * Internal per-tab body — `src/material/tabs/tab-body.html` + `tab-body.ts`
 * (`MatTabBody`/`MatTabBodyPortal`). Not exported from the public API — only
 * `MatTabGroup` renders these, one per `tabs` entry, in the SAME order as
 * the labels (see that component's doc comment).
 *
 * Content attach/detach (angular-parity.spec.ts note 3): ANY tab's content
 * — plain or lazy — attaches the first time it becomes centered (for the
 * initially-selected tab, that's immediately: `everCentered` starts `true`
 * when `position` is already 0) and detaches again (unmounts, not just
 * hides) on leaving UNLESS `preserveContent`. Re-activating a detached,
 * non-preserved tab re-renders its content from scratch — a natural
 * consequence of the conditional `{attached && …}` below unmounting and
 * remounting the same JSX, no extra bookkeeping needed.
 *
 * IMPORTANT: every JSX attribute below that depends on "is this tab
 * centered" re-evaluates `props.position === 0` INLINE rather than reading
 * a shared `const isCenter = …` local. Empirically bisected (see SYNC.md):
 * in this component — a `component$` instantiated from a parent's
 * `.map()` with a `key`, where the attribute in question can toggle to/
 * from `undefined` (here, `inert`) — a local `const` computed via a
 * comparison (`=== 0`) and then fed into that attribute fails to update on
 * the client after the FIRST client-side prop change, even though the
 * identical comparison inlined directly at the attribute site updates
 * correctly, and even though a DIRECT boolean prop (no comparison) through
 * a local `const` ALSO updates correctly. Looks like a Qwik optimizer/
 * diffing edge case, not a logic bug in this component — inlining is the
 * workaround.
 *
 * There is deliberately NO separate "lazy content" prop/mechanism (no
 * `QRL<() => JSXOutput>` thunk): a plain `content: JSXOutput` already gets
 * the lazy behavior upstream's `<ng-template matTabContent>` opts into,
 * for free, from the SAME `attached` gate below. Upstream's `matTabContent`
 * and plain-content paths are OBSERVABLY IDENTICAL from the DOM's
 * perspective (angular-parity.spec.ts note 3 explicitly says so — "ANY
 * tab's content… attaches the first time… detaches… unless
 * preserveContent"); the only thing `matTabContent` changes is which
 * Angular `TemplateRef` gets portaled, an internal-to-Angular distinction
 * with no Qwik equivalent needed. A `<ExpensiveThing/>` JSX descriptor
 * passed as `content` is only ever RENDERED (its `component$` body
 * invoked) once Qwik actually includes it in the returned tree below —
 * i.e. exactly when `attached` flips true — so it's already "lazy" in
 * every sense this port's parity gate cares about. (An earlier version of
 * this component accepted a `lazyContent$: QRL<() => JSXOutput>` thunk,
 * awaited into a signal for later use in a non-async render — that broke
 * SSR outright with `serializeQRL: Cannot resolve symbol …`, because a
 * `JSXOutput`/vnode is not a value Qwik's resumability serializer knows how
 * to persist as component STATE; it's only ever meant to flow as a render
 * function's own return value, and `component$`'s render function cannot
 * be `async` either — `OnRenderFn<PROPS> = (props: PROPS) => JSXOutput`,
 * no `Promise` allowed. Removed rather than worked around once the
 * underlying need turned out to already be covered.)
 *
 * Deliberately NOT implemented (see SYNC.md deviations):
 * - The transient `mat-tab-body-animating` class / `transitionstart`/
 *   `transitionend` wiring: upstream's own timing means it's never present
 *   at any snapshot the parity spec takes (note 4 — the spec itself waits
 *   it out before every comparison), so it carries no test-passing OR
 *   documented-behavior weight here.
 * - The dynamic-height wrapper resize animation (transient inline `height`
 *   on `.mat-mdc-tab-body-wrapper`, always cleared before any snapshot per
 *   the spec's own dynamic-height note).
 */
export interface MatTabBodyItemProps {
  id: string;
  labelledBy: string;
  /** `index - selectedIndex`. Sign determines left/right; 0 is centered. */
  position: number;
  /** Same shape as `position`, but against the PREVIOUS selectedIndex —
   *  drives `-can-animate` exactly like upstream's `_previousPosition`. */
  previousPosition: number;
  preserveContent: boolean;
  bodyClass?: string | ReadonlyArray<string>;
  contentTabIndex?: number | null;
  content?: JSXOutput;
}

export const MatTabBodyItem = component$<MatTabBodyItemProps>(props => {
  // Sticky "has this tab EVER been centered" gate (upstream: the portal's
  // `_beforeCentering.pipe(startWith(isCenterPosition()))` subscription,
  // which — once it fires once — stays attached for the component's
  // lifetime). `useTask$` runs synchronously before the first render too, so
  // an initially-centered tab starts `true` with no extra branch needed.
  const everCentered = useSignal(props.position === 0);
  useTask$(({track}) => {
    if (track(() => props.position) === 0) everCentered.value = true;
  });

  const attached = props.position === 0 || (everCentered.value && props.preserveContent);
  const content = attached ? props.content : undefined;

  const bodyClasses = [
    'mat-mdc-tab-body',
    props.position === 0 && 'mat-mdc-tab-body-active',
    props.bodyClass,
  ].filter(Boolean) as string[];

  const contentClasses = [
    'mat-mdc-tab-body-content',
    props.position < 0 && 'mat-tab-body-content-left',
    props.position > 0 && 'mat-tab-body-content-right',
    (props.position === 0 || props.previousPosition === 0) && 'mat-tab-body-content-can-animate',
  ].filter(Boolean) as string[];

  return (
    <mat-tab-body
      role="tabpanel"
      id={props.id}
      class={bodyClasses}
      tabIndex={
        props.contentTabIndex != null && props.position === 0 ? props.contentTabIndex : undefined
      }
      aria-labelledby={props.labelledBy}
      aria-hidden={props.position === 0 ? 'false' : 'true'}
      inert={props.position !== 0 || undefined}
    >
      <div class={contentClasses} {...({cdkscrollable: ''} as Record<string, string>)}>
        {content}
      </div>
    </mat-tab-body>
  );
});
