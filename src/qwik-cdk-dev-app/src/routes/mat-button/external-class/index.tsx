import {component$} from '@qwik.dev/core';
import {
  MatButton,
  MatFabButton,
  MatIconButton,
  MatMiniFabButton,
} from '@angular-community/qwik-material/button';

/**
 * Qwik-only scenario: every button-family host carries a consumer class (`ext-initial`) that the
 * spec then edits from outside the component via `classList` — the way a third-party script
 * toggles classes on an Angular `matButton` host (upstream never rewrites the class attribute,
 * FocusMonitor/MatRippleLoader only `classList.add/remove` their own classes).
 */
export default component$(() => (
  <>
    <div data-parity-root>
      <MatButton class="ext-initial" appearance="filled">
        Button
      </MatButton>
      <MatButton class="ext-initial" href="#link">
        Link
      </MatButton>
      <MatIconButton class="ext-initial" ariaLabel="Icon button">
        <span>i</span>
      </MatIconButton>
      <MatFabButton class="ext-initial" ariaLabel="FAB" />
      <MatMiniFabButton class="ext-initial" ariaLabel="Mini FAB" />
    </div>
    <button data-outside>outside</button>
    <main data-scenario-ready>ready</main>
  </>
));
