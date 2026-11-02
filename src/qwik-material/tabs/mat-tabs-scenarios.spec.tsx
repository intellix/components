/**
 * MatTabGroup / MatTabNav scenario port from `src/material/tabs/*.spec.ts`
 * (`tab-group.spec.ts`, `tab-header.spec.ts`, `tab-nav-bar.spec.ts`,
 * `tab-body.spec.ts` — collectively hundreds of `it()` blocks, heavy on
 * `TestBed`/`ComponentFixture` DOM assertions and `fakeAsync`).
 * `createDOM()` hangs this package's vitest worker (see mat-button's own
 * scenario-port comment for the same finding), so no DOM-render tests are
 * attempted here. Restructured:
 *
 *   - Pure logic (pagination math, keyboard-nav index math) is
 *     independently unit-tested in `pagination-math.spec.ts` and
 *     `tab-group-keyboard.spec.ts` — these ARE real behavioral tests, not
 *     just sanity.
 *   - Live sanity tests here: typeof + context ids + DEFAULTS shape + props
 *     shapes.
 *   - describe.skip DOM-rendered: documents what's verified by Playwright
 *     instead. Real DOM/behavior assertions live in
 *     `src/qwik-cdk-parity-tests/specs/material-tabs/angular-parity.spec.ts`
 *     (Angular-vs-Qwik DOM diffing — the authoritative parity gate).
 */
import {describe, it, expect} from 'vitest';
import {
  MAT_TABS_CONFIG,
  MatTabGroup,
  MatTabNav,
  MatTabLink,
  MatTabNavPanel,
  type MatTabDef,
  type MatTabGroupProps,
  type MatTabNavProps,
  type MatTabLinkProps,
} from './public-api';

describe('MatTabs surface — sanity', () => {
  it('MatTabGroup / MatTabNav / MatTabLink / MatTabNavPanel are exported and function-shaped', () => {
    expect(typeof MatTabGroup).toBe('function');
    expect(typeof MatTabNav).toBe('function');
    expect(typeof MatTabLink).toBe('function');
    expect(typeof MatTabNavPanel).toBe('function');
  });

  it('MAT_TABS_CONFIG carries the expected context id', () => {
    expect(MAT_TABS_CONFIG.id).toBe('qwik-material/tabs-config');
  });

  it('MatTabDef accepts the full surface', () => {
    const def: MatTabDef = {
      label: 'First',
      disabled: false,
      ariaLabel: 'First tab',
      ariaLabelledby: 'heading',
      labelClass: 'my-label',
      bodyClass: 'my-body',
      id: 'custom-id',
      content: 'Content 1',
    };
    expect(def.label).toBe('First');
  });

  it('MatTabGroupProps accepts the full surface', () => {
    const props: MatTabGroupProps = {
      tabs: [{label: 'First', content: 'Content 1'}],
      selectedIndex: 0,
      color: 'primary',
      fitInkBarToContent: false,
      stretchTabs: true,
      alignTabs: 'center',
      dynamicHeight: false,
      headerPosition: 'above',
      animationDuration: '500ms',
      contentTabIndex: 0,
      disablePagination: false,
      disableRipple: false,
      preserveContent: false,
      'aria-label': 'Settings',
      class: 'my-group',
      style: 'width: 480px',
      id: 'group-1',
    };
    expect(props.tabs.length).toBe(1);
  });

  it('MatTabNavProps / MatTabLinkProps accept the full surface', () => {
    const navProps: MatTabNavProps = {
      tabPanelId: 'panel-1',
      color: 'accent',
      fitInkBarToContent: false,
      stretchTabs: true,
      disablePagination: false,
      disableRipple: false,
      animationDuration: 300,
      class: 'my-nav',
      style: 'width: 480px',
      id: 'nav-1',
    };
    const linkProps: MatTabLinkProps = {
      active: true,
      disabled: false,
      tabIndex: 0,
      id: 'link-1',
      disableRipple: false,
      class: 'my-link',
    };
    expect(navProps.tabPanelId).toBe('panel-1');
    expect(linkProps.active).toBe(true);
  });
});

describe.skip('MatTabs DOM-rendered scenarios — verified via Playwright', () => {
  it("MatTabGroup renders <mat-tab-group> > <mat-tab-header> (pagination chevrons + .mat-mdc-tab-label-container > .mat-mdc-tab-list[role=tablist] > .mat-mdc-tab-labels > N .mdc-tab) + .mat-mdc-tab-body-wrapper > N <mat-tab-body>, exactly mirroring angular-parity.spec.ts's documented shared structure", () => {});
  it('Every .mdc-tab carries a trailing .mdc-tab-indicator ink-bar span; the active class lives on the SAME host as mdc-tab--active, never the inner span', () => {});
  it('.mat-mdc-tab-list always carries an inline transform: translateX(Npx), even with no overflow (translateX(0px))', () => {});
  it('Clicking an enabled tab selects + focuses it (cdk-focused cdk-mouse-focused); force-clicking a disabled tab (pointer-events: none) is a complete no-op', () => {});
  it('ArrowLeft/ArrowRight/Home/End move roving-tabindex focus only (wrap on Left/Right, clamp on Home/End); Enter/Space activate the focused tab only if it differs from the selected one and is not disabled; a disabled tab IS reachable by arrow-key focus', () => {});
  it('Tab-body content attaches the first time a tab centers (immediate for the initially-selected tab) and detaches on leaving unless preserveContent — the same for plain content and for a matTabContent-equivalent prop, which this port does not distinguish (see mat-tab-body.tsx)', () => {});
  it('Pagination: clicking the "after" chevron scrolls the tab list by a third of the viewport, enabling the "before" chevron and updating translateX bit-for-bit against Angular given synced CSS', () => {});
  it('mat-align-tabs is reflected as a literal host attribute only when alignTabs is set; mat-stretch-tabs never appears as an attribute, only as a class', () => {});
  it('MatTabNav + MatTabLink + MatTabNavPanel: active is driven purely by the `active` prop, not focus; Enter/Space on a focused non-active link synthesizes a real click when a tabPanel is bound; MatTabNav never sets --mat-tab-animation-duration unless animationDuration is explicitly provided', () => {});
});
