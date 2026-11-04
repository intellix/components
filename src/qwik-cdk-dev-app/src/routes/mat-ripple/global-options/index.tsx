import {component$} from '@qwik.dev/core';
import {MatRipple, useMatRippleProvider} from '@angular-community/qwik-material/core';
import {MatButton} from '@angular-community/qwik-material/button';

/**
 * Bespoke, non-upstream fixture for `MAT_RIPPLE_GLOBAL_OPTIONS` (no Angular parity counterpart —
 * this is a Qwik-port-only API surface; see `specs/material-core/ripple-global-options.spec.ts`).
 * Four independently-scoped subtrees, each its own small wrapper component calling
 * `useMatRippleProvider({...})` once (a hook call applies to its OWN component's whole
 * subtree, so each independently-configured sibling needs its own component instance — a
 * single component can't call the same provider hook multiple times with different values for
 * different parts of its own render). Each has one `<MatRipple>` square plus (for the
 * `disabled` case) one `<MatButton>` too — proving a built-in component's OWN internal ripple
 * (not just the standalone directive) also respects the global option, via the shared
 * `handleRippleEvent()` 4th-argument fold-in (`core/ripple/ripple-dom.ts`).
 */
const DisabledGlobally = component$(() => {
  useMatRippleProvider({disabled: true});
  return (
    <>
      <MatRipple class="ripple-disabled-globally" style={{width: '100px', height: '100px'}}>
        Disabled globally
      </MatRipple>
      <MatButton appearance="elevated" class="button-disabled-globally">
        Button
      </MatButton>
    </>
  );
});

const ExitDurationZero = component$(() => {
  useMatRippleProvider({animation: {exitDuration: 0}});
  return (
    <MatRipple class="ripple-exit-duration-0" style={{width: '100px', height: '100px'}}>
      Exit duration 0
    </MatRipple>
  );
});

const TerminateOnPointerUp = component$(() => {
  useMatRippleProvider({terminateOnPointerUp: true});
  return (
    <MatRipple class="ripple-terminate-on-pointer-up" style={{width: '100px', height: '100px'}}>
      Terminate on pointer up
    </MatRipple>
  );
});

export default component$(() => (
  <>
    <div data-parity-root>
      <DisabledGlobally />
      <ExitDurationZero />
      <TerminateOnPointerUp />

      <MatRipple class="ripple-baseline" style={{width: '100px', height: '100px'}}>
        Baseline (no provider)
      </MatRipple>
    </div>
    <main data-scenario-ready>ready</main>
  </>
));
