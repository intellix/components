import {useSignal, useVisibleTask$, type Signal} from '@qwik.dev/core';
import {Breakpoints, observeBreakpoints} from '@angular-community/qwik-cdk/layout';

/**
 * Whether the viewport currently matches a "small screen" breakpoint (phones + small tablets in
 * portrait) — drives the responsive component/CDK sidenav (`mode="over"` + hidden by default
 * below the breakpoint, `mode="side"` + always open above it). Dogfoods qwik-cdk's own
 * `observeBreakpoints()` (the same primitive `MatBottomSheetContainer` uses internally) instead
 * of a hand-rolled `matchMedia` call.
 *
 * Defaults to `false` (desktop layout) until the client-only task runs, matching this site's
 * SSG'd markup (always rendered as the wide layout, same as `MatDrawer`'s own SSR-safe default —
 * avoids a hydration flash on fast connections, at the cost of one post-load reflow on narrow
 * viewports).
 */
export function useIsScreenSmall(): Signal<boolean> {
  const isSmall = useSignal(false);

  useVisibleTask$(() => {
    return observeBreakpoints([Breakpoints.XSmall, Breakpoints.Small], state => {
      isSmall.value = state.matches;
    });
  });

  return isSmall;
}
