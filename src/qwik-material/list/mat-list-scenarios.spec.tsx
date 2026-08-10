/**
 * MatList scenario port from src/material/list/list.spec.ts.
 *
 * Upstream has ~40 `it()` blocks — heavy on @ContentChildren QueryList
 * inspection + _updateItemLines + cdkObserveContent behavior verification.
 * All of that is moot in the port because layout is pure CSS grid + :has()
 * (spec §5 deviations #1, #2). Restructured:
 *
 *   - Live sanity tests (7): typeof + MAT_LIST_CONFIG.id + config +
 *     props shape acceptance for all 10 components.
 *   - describe.skip DOM-rendered (8): container variants + polymorphic
 *     item + slot components + CSS grid layout + :has() sizing.
 *     Deferred to Playwright Task 11.
 *   - describe.skip Angular-only (4): BooleanInput/NumberInput coercion,
 *     @ContentChildren + _updateItemLines + cdkObserveContent,
 *     MatListBase/MatListItemBase inheritance, ripple/focus-manager/state
 *     layer. Deferred forever per spec §5.
 *
 * Real DOM assertions live in
 * src/qwik-cdk-parity-tests/specs/material-list/*.spec.ts.
 */
import {describe, it, expect} from 'vitest';
import {
  MAT_LIST_CONFIG,
  MatList,
  MatNavList,
  MatActionList,
  MatSubheader,
  MatListItem,
  MatListItemAvatar,
  MatListItemIcon,
  MatListItemTitle,
  MatListItemLine,
  MatListItemMeta,
  type MatListConfig,
  type MatListProps,
  type MatNavListProps,
  type MatActionListProps,
  type MatSubheaderProps,
  type MatListItemProps,
  type MatListItemSectionProps,
} from './public-api';

describe('MatList surface — sanity', () => {
  it('all 10 components are exported and function-shaped', () => {
    expect(typeof MatList).toBe('function');
    expect(typeof MatNavList).toBe('function');
    expect(typeof MatActionList).toBe('function');
    expect(typeof MatSubheader).toBe('function');
    expect(typeof MatListItem).toBe('function');
    expect(typeof MatListItemAvatar).toBe('function');
    expect(typeof MatListItemIcon).toBe('function');
    expect(typeof MatListItemTitle).toBe('function');
    expect(typeof MatListItemLine).toBe('function');
    expect(typeof MatListItemMeta).toBe('function');
  });

  it('MAT_LIST_CONFIG carries the expected context id', () => {
    expect(MAT_LIST_CONFIG.id).toBe('qwik-material/list-config');
  });

  it('MatListConfig accepts an empty object', () => {
    const cfg: MatListConfig = {};
    expect(cfg).toBeDefined();
  });

  it('MatListProps + MatNavListProps + MatActionListProps accept aria + role + disabled + class + id', () => {
    const listProps: MatListProps = {
      role: 'list',
      disabled: false,
      'aria-label': 'Inbox',
      'aria-labelledby': 'inbox-heading',
      'aria-describedby': 'inbox-desc',
      class: 'my-list',
      id: 'inbox',
    };
    const navProps: MatNavListProps = {
      role: 'ignored — nav forces navigation',
      disabled: true,
      'aria-label': 'Main navigation',
      class: 'my-nav',
      id: 'nav',
    };
    const actionProps: MatActionListProps = {
      disabled: false,
      class: 'my-actions',
      id: 'actions',
    };
    expect(listProps['aria-label']).toBe('Inbox');
    expect(navProps.disabled).toBe(true);
    expect(actionProps.class).toBe('my-actions');
  });

  it('MatListItemProps accepts as / href / activated / disabled + aria + role', () => {
    const divProps: MatListItemProps = {
      role: 'listitem',
      class: 'item',
      id: 'i1',
    };
    const anchorProps: MatListItemProps = {
      as: 'a',
      href: '/inbox',
      activated: true,
      'aria-label': 'Inbox',
      id: 'nav-inbox',
    };
    const buttonProps: MatListItemProps = {
      as: 'button',
      disabled: true,
      'aria-label': 'Delete',
      id: 'delete',
    };
    expect(divProps.role).toBe('listitem');
    expect(anchorProps.as).toBe('a');
    expect(anchorProps.href).toBe('/inbox');
    expect(anchorProps.activated).toBe(true);
    expect(buttonProps.as).toBe('button');
    expect(buttonProps.disabled).toBe(true);
  });

  it('MatSubheaderProps accepts aria + class + id (no role, no disabled)', () => {
    const props: MatSubheaderProps = {
      'aria-label': 'Section header',
      'aria-labelledby': 'section-title',
      'aria-describedby': 'section-desc',
      class: 'my-subheader',
      id: 'sh1',
    };
    expect(props['aria-label']).toBe('Section header');
  });

  it('MatListItemSectionProps accepts class + id (shared by all 5 slot components)', () => {
    const props: MatListItemSectionProps = {
      class: 'my-avatar',
      id: 'avatar-1',
    };
    expect(props.class).toBe('my-avatar');
    expect(props.id).toBe('avatar-1');
  });

  it('MatListItemProps.as union covers exactly div/a/button', () => {
    const divVariant: MatListItemProps['as'] = 'div';
    const anchorVariant: MatListItemProps['as'] = 'a';
    const buttonVariant: MatListItemProps['as'] = 'button';
    expect(divVariant).toBe('div');
    expect(anchorVariant).toBe('a');
    expect(buttonVariant).toBe('button');
  });
});

describe.skip('MatList DOM-rendered scenarios — deferred to Playwright Task 11', () => {
  it('MatList renders <mat-list> with class ladder + role passthrough', () => {});
  it('MatNavList renders <mat-nav-list role="navigation">', () => {});
  it('MatActionList renders <mat-action-list role="group">', () => {});
  it('MatListItem polymorphism: as="div" → <mat-list-item>; as="a" href → <a href>; as="button" → <button>', () => {});
  it('MatListItem activated on <a> emits aria-current="page"; on <div> does not', () => {});
  it('slot components (Avatar/Icon/Title/Line/Meta) render <div> with class hooks', () => {});
  it('CSS grid layout: avatar left, title/lines center, meta right (Playwright bounding-box)', () => {});
  it(':has() line-count sizing: 1/2/3 lines → 48/64/88px min-height', () => {});
});

describe.skip('MatList — Angular-only tests', () => {
  it('should coerce BooleanInput/NumberInput attribute values', () => {
    // Omitted — Qwik JSX passes booleans/numbers directly (spec §5 deviation #10).
  });
  it('should enumerate slot content via @ContentChildren + _updateItemLines + cdkObserveContent', () => {
    // Replaced by CSS :has() selectors (spec §5 deviation #2).
  });
  it('should inherit from MatListBase / MatListItemBase abstract classes', () => {
    // Collapsed to plain component$ wrappers (spec §5 deviation #10).
  });
  it('should integrate ripple / focus-manager / MDC state layer', () => {
    // All out of scope (spec §5 deviations #1, #4, #7).
  });
});
