import {component$} from '@qwik.dev/core';
import {MatList, MatActionList, MatListItem, MatListItemTitle} from '@angular-community/qwik-material/list';
import {QwikMaterialProvider} from '@angular-community/qwik-material/dialog';

/**
 * Bespoke, non-upstream fixture for list-item ripple SUPPRESSION paths — no Angular mirror
 * (see `specs/material-list/ripple-functional.spec.ts`): every row here renders the SAME
 * steady-state DOM whether or not a ripple would fire (the only observable difference is
 * whether a real `mousedown` launches a `.mat-ripple-element` — behavior, not shape), so there
 * is nothing for a structural Angular-vs-Qwik comparison to exercise. Same category as
 * `mat-ripple/global-options` (`MAT_RIPPLE_GLOBAL_OPTIONS` itself is a port-only API with no
 * Angular DI equivalent to navigate to).
 *
 * Buttons throughout (action-list items, never `<a href>`) so a real Playwright `.click()` never
 * risks navigating the tab away — see `specs/material-list/ripple-mid-flight.spec.ts` for the
 * one spec that DOES exercise a real `<a mat-list-item>` and has to guard against that.
 *
 * Covers, one `<MatActionList>` (interactive) per row unless noted:
 * - `.list-control` — nothing disabled; the fixture's own proof that ripples fire at all here
 *   (guards against a vacuously-true "no ripple anywhere" bug in the test itself).
 * - `.list-disable-ripple-on-list` — `<MatActionList disableRipple>` (mirrors upstream
 *   `MatListBase.disableRipple`).
 * - `.list-disable-ripple-on-item` — list has nothing set; the ITEM sets `disableRipple` (mirrors
 *   upstream `MatListItemBase.disableRipple`'s own settable half).
 * - `.list-non-interactive` — a plain `<MatList>` (non-interactive): upstream never constructs a
 *   `RippleRenderer` at all for an item in a non-interactive list.
 * - `.list-global-disabled` — `<QwikMaterialProvider matRippleConfig={{disabled: true}}>`
 *   wrapping an otherwise-plain `<MatActionList>` item (mirrors `MAT_RIPPLE_GLOBAL_OPTIONS`).
 */
export default component$(() => (
  <>
    <div data-parity-root>
      <MatActionList class="list-control">
        <MatListItem as="button" title={<MatListItemTitle>Control</MatListItemTitle>} />
      </MatActionList>

      <MatActionList disableRipple class="list-disable-ripple-on-list">
        <MatListItem as="button" title={<MatListItemTitle>List disables ripple</MatListItemTitle>} />
      </MatActionList>

      <MatActionList class="list-disable-ripple-on-item">
        <MatListItem
          as="button"
          disableRipple
          title={<MatListItemTitle>Item disables ripple</MatListItemTitle>}
        />
      </MatActionList>

      <MatList class="list-non-interactive">
        <MatListItem title={<MatListItemTitle>Non-interactive</MatListItemTitle>} />
      </MatList>

      <QwikMaterialProvider matRippleConfig={{disabled: true}}>
        <MatActionList class="list-global-disabled">
          <MatListItem as="button" title={<MatListItemTitle>Global disabled</MatListItemTitle>} />
        </MatActionList>
      </QwikMaterialProvider>
    </div>
    <main data-scenario-ready>ready</main>
  </>
));
