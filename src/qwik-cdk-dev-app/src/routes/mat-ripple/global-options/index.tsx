import {component$} from '@qwik.dev/core';
import {MatRipple} from '@angular-community/qwik-material/core';
import {QwikMaterialProvider} from '@angular-community/qwik-material/dialog';
import {MatButton} from '@angular-community/qwik-material/button';

/**
 * Bespoke, non-upstream fixture for `MAT_RIPPLE_GLOBAL_OPTIONS` (no Angular parity counterpart —
 * this is a Qwik-port-only API surface; see `specs/material-core/ripple-global-options.spec.ts`).
 * Four independently-scoped `<QwikMaterialProvider matRippleConfig={...}>` subtrees, each with one
 * `<MatRipple>` square plus (for the `disabled` case) one `<MatButton>` too — proving a built-in
 * component's OWN internal ripple (not just the standalone directive) also respects the global
 * option, via the shared `handleRippleEvent()` 4th-argument fold-in (`core/ripple/ripple-dom.ts`).
 */
export default component$(() => (
  <>
    <div data-parity-root>
      <QwikMaterialProvider matRippleConfig={{disabled: true}}>
        <MatRipple class="ripple-disabled-globally" style={{width: '100px', height: '100px'}}>
          Disabled globally
        </MatRipple>
        <MatButton appearance="elevated" class="button-disabled-globally">
          Button
        </MatButton>
      </QwikMaterialProvider>

      <QwikMaterialProvider matRippleConfig={{animation: {exitDuration: 0}}}>
        <MatRipple class="ripple-exit-duration-0" style={{width: '100px', height: '100px'}}>
          Exit duration 0
        </MatRipple>
      </QwikMaterialProvider>

      <QwikMaterialProvider matRippleConfig={{terminateOnPointerUp: true}}>
        <MatRipple class="ripple-terminate-on-pointer-up" style={{width: '100px', height: '100px'}}>
          Terminate on pointer up
        </MatRipple>
      </QwikMaterialProvider>

      <MatRipple class="ripple-baseline" style={{width: '100px', height: '100px'}}>
        Baseline (no provider)
      </MatRipple>
    </div>
    <main data-scenario-ready>ready</main>
  </>
));
